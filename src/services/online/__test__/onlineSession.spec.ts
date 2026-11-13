jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMatchStore } from '../../matchState';
import { useOptionsStore } from '../../optionsState';
import { useRoundStore } from '../../roundState';
import {
  __setOnlineWsFactoryForTests,
  createOnlineSession,
  joinOnlineSession,
  leaveOnlineSession,
  reconnectOnlineSession,
  sendMove,
  sendNextRound,
  sendRematch,
} from '../onlineSession';
import type { RoomSnapshot, ServerMessage } from '../protocol';
import { ONLINE_SESSION_STORAGE_KEY, loadOnlineReconnectCreds } from '../reconnectStorage';
import { useOnlineSessionStore } from '../sessionStore';

type Listener = ((ev: MessageEvent | Event) => void) | null;

class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onmessage: Listener = null;
  onclose: Listener = null;
  onerror: Listener = null;
  sent: string[] = [];
  url: string;

  onopen: Listener = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    });
  }

  static instances: MockWebSocket[] = [];

  static reset() {
    MockWebSocket.instances = [];
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new Event('close'));
  }

  emit(msg: ServerMessage) {
    this.onmessage?.(
      new MessageEvent('message', { data: JSON.stringify(msg) }) as unknown as MessageEvent
    );
  }
}

function snapshot(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    code: 'ABCD12',
    phase: 'WAITING',
    roundsInMatch: 3,
    board: Array(9).fill(' '),
    turn: 'X',
    roundWinner: undefined,
    isDraw: false,
    rounds: [],
    matchWinner: undefined,
    hostConnected: true,
    guestConnected: false,
    reclaimDeadlineMs: null,
    forfeitedBy: undefined,
    ...overrides,
  };
}

async function flush() {
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 20));
}

describe('onlineSession', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.EXPO_PUBLIC_MULTIPLAYER_URL;

  beforeEach(async () => {
    await AsyncStorage.clear();
    MockWebSocket.reset();
    process.env.EXPO_PUBLIC_MULTIPLAYER_URL = 'https://mp.example.com';
    __setOnlineWsFactoryForTests((url) => new MockWebSocket(url) as unknown as WebSocket);
    useOnlineSessionStore.getState().reset();
    useMatchStore.setState({
      isCPU: { X: true, O: false },
      roundsInMatch: 3,
      rounds: [],
      winner: undefined,
      playMode: 'SETUP_MATCH',
    });
    useRoundStore.setState({
      boardState: Array(9).fill(' '),
      turn: 'X',
      winner: undefined,
      isDraw: false,
    });
    useOptionsStore.setState({ autoReplay: true, enableSound: true, enableMusic: true });

    global.fetch = jest.fn(async () =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          code: 'ABCD12',
          hostToken: 'host-tok',
          roundsInMatch: 3,
          wsUrl: 'wss://mp.example.com/rooms/ABCD12/ws',
          joinPath: '/join/ABCD12',
        }),
      })
    ) as unknown as typeof fetch;
  });

  afterEach(async () => {
    await leaveOnlineSession();
    global.fetch = originalFetch;
    if (originalEnv === undefined) {
      delete process.env.EXPO_PUBLIC_MULTIPLAYER_URL;
    } else {
      process.env.EXPO_PUBLIC_MULTIPLAYER_URL = originalEnv;
    }
    __setOnlineWsFactoryForTests();
  });

  it('createOnlineSession posts /rooms, joins with host token, and hydrates on welcome', async () => {
    const result = await createOnlineSession(3);
    await flush();

    expect(result).toEqual({
      code: 'ABCD12',
      inviteUrl: 'https://mp.example.com/join/ABCD12',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://mp.example.com/rooms',
      expect.objectContaining({ method: 'POST' })
    );

    const ws = MockWebSocket.instances[0]!;
    expect(ws.url).toBe('wss://mp.example.com/rooms/ABCD12/ws');
    await flush();
    expect(ws.sent.some((s) => s.includes('"join"') && s.includes('host-tok'))).toBe(true);

    ws.emit({
      type: 'welcome',
      seat: 'X',
      token: 'host-tok',
      snapshot: snapshot({ phase: 'WAITING' }),
    });
    await flush();

    const session = useOnlineSessionStore.getState();
    expect(session.status).toBe('connected');
    expect(session.seat).toBe('X');
    expect(session.roomCode).toBe('ABCD12');
    expect(session.inviteUrl).toBe('https://mp.example.com/join/ABCD12');
    expect(session.reconnectToken).toBe('host-tok');
    expect(useMatchStore.getState().playMode).toBe('SETUP_ROUND');
    expect(useMatchStore.getState().isCPU).toEqual({ X: false, O: false });
    expect(useOptionsStore.getState().autoReplay).toBe(false);
    expect(await loadOnlineReconnectCreds()).toEqual({
      roomCode: 'ABCD12',
      reconnectToken: 'host-tok',
      seat: 'X',
    });
  });

  it('joinOnlineSession connects without host token and maps sync', async () => {
    await joinOnlineSession('abcd12');
    await flush();
    const ws = MockWebSocket.instances[0]!;
    expect(ws.url).toContain('/rooms/ABCD12/ws');
    await flush();
    expect(ws.sent.some((s) => JSON.parse(s).type === 'join' && !JSON.parse(s).token)).toBe(true);

    ws.emit({
      type: 'welcome',
      seat: 'O',
      token: 'guest-tok',
      snapshot: snapshot({ guestConnected: true, phase: 'PLAYING' }),
    });
    await flush();

    ws.emit({
      type: 'sync',
      snapshot: snapshot({
        phase: 'PLAYING',
        board: ['X', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        turn: 'O',
        guestConnected: true,
      }),
    });
    await flush();

    expect(useOnlineSessionStore.getState().seat).toBe('O');
    expect(useRoundStore.getState().boardState[0]).toBe('X');
    expect(useRoundStore.getState().turn).toBe('O');
    expect(useMatchStore.getState().playMode).toBe('PLAYING');
  });

  it('sendMove / nextRound / rematch / leave talk to the socket', async () => {
    await joinOnlineSession('ABCD12');
    await flush();
    const ws = MockWebSocket.instances[0]!;
    ws.readyState = MockWebSocket.OPEN;
    ws.emit({
      type: 'welcome',
      seat: 'O',
      token: 'guest-tok',
      snapshot: snapshot({ phase: 'PLAYING', guestConnected: true }),
    });
    await flush();

    sendMove(4);
    sendNextRound();
    sendRematch();
    expect(ws.sent.map((s) => JSON.parse(s).type)).toEqual(
      expect.arrayContaining(['move', 'nextRound', 'rematch'])
    );

    await leaveOnlineSession();
    expect(await AsyncStorage.getItem(ONLINE_SESSION_STORAGE_KEY)).toBeNull();
    expect(useOnlineSessionStore.getState().status).toBe('idle');
  });

  it('reconnectOnlineSession uses stored credentials', async () => {
    await AsyncStorage.setItem(
      ONLINE_SESSION_STORAGE_KEY,
      JSON.stringify({ roomCode: 'ABCD12', reconnectToken: 'reclaim-tok', seat: 'X' })
    );

    const ok = await reconnectOnlineSession();
    expect(ok).toBe(true);
    await flush();
    const ws = MockWebSocket.instances[0]!;
    await flush();
    const join = ws.sent.map((s) => JSON.parse(s)).find((m) => m.type === 'join');
    expect(join).toEqual({ type: 'join', token: 'reclaim-tok' });
    expect(useOnlineSessionStore.getState().status).toBe('reconnecting');
  });

  it('reconnectOnlineSession fails cleanly without credentials', async () => {
    const ok = await reconnectOnlineSession();
    expect(ok).toBe(false);
    expect(useOnlineSessionStore.getState().status).toBe('disconnected');
    expect(useOnlineSessionStore.getState().lastError).toMatch(/credentials/i);
  });
});
