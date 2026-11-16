import { SELF, env, runInDurableObject } from 'cloudflare:test';
import { describe, expect, it, vi } from 'vitest';
import type { GameRoom } from '../src/GameRoom';
import type { ClientMessage, ServerMessage } from '../src/protocol';
import { IDLE_TTL_MS } from '../src/protocol';

type CreateRoomResponse = {
  code: string;
  hostToken: string;
  roundsInMatch: number;
  wsUrl: string;
  joinPath: string;
};

async function createRoom(roundsInMatch = 3): Promise<CreateRoomResponse> {
  const res = await SELF.fetch('https://example.com/rooms', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ roundsInMatch }),
  });
  expect(res.status).toBe(200);
  return (await res.json()) as CreateRoomResponse;
}

async function openWs(code: string): Promise<WebSocket> {
  const res = await SELF.fetch(`https://example.com/rooms/${code}/ws`, {
    headers: { Upgrade: 'websocket' },
  });
  expect(res.status).toBe(101);
  const ws = res.webSocket;
  expect(ws).toBeTruthy();
  ws!.accept();
  return ws!;
}

function send(ws: WebSocket, msg: ClientMessage): void {
  ws.send(JSON.stringify(msg));
}

function nextMessage(ws: WebSocket, timeoutMs = 3000, label = 'message'): Promise<ServerMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for WS ${label}`)), timeoutMs);
    const onMessage = (event: MessageEvent) => {
      clearTimeout(timer);
      ws.removeEventListener('message', onMessage);
      resolve(JSON.parse(String(event.data)) as ServerMessage);
    };
    ws.addEventListener('message', onMessage);
  });
}

async function joinAsHost(code: string, hostToken: string) {
  const ws = await openWs(code);
  const pending = nextMessage(ws, 3000, 'host welcome');
  send(ws, { type: 'join', token: hostToken });
  const welcome = await pending;
  expect(welcome.type).toBe('welcome');
  if (welcome.type !== 'welcome') throw new Error('expected welcome');
  expect(welcome.seat).toBe('X');
  return { ws, welcome };
}

async function joinAsGuest(code: string) {
  const ws = await openWs(code);
  const pending = nextMessage(ws, 3000, 'guest welcome');
  send(ws, { type: 'join' });
  const welcome = await pending;
  expect(welcome.type).toBe('welcome');
  if (welcome.type !== 'welcome') throw new Error('expected welcome');
  expect(welcome.seat).toBe('O');
  return { ws, welcome };
}

describe('multiplayer worker HTTP', () => {
  it('GET /health returns ok', async () => {
    const res = await SELF.fetch('https://example.com/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('POST /rooms creates a room and GET /join/:code returns deep-link landing', async () => {
    const room = await createRoom(5);
    expect(room.code).toMatch(/^[A-Z2-9]{6}$/);
    expect(room.hostToken.length).toBeGreaterThan(10);
    expect(room.roundsInMatch).toBe(5);
    expect(room.joinPath).toBe(`/join/${room.code}`);

    const join = await SELF.fetch(`https://example.com/join/${room.code}`);
    expect(join.status).toBe(200);
    expect(join.headers.get('content-type')).toContain('text/html');
    const html = await join.text();
    expect(html).toContain(`tictacdoh://join/${room.code}`);
    expect(html).toContain(room.code);
  });

  it('rejects invalid roundsInMatch', async () => {
    const res = await SELF.fetch('https://example.com/rooms', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ roundsInMatch: 4 }),
    });
    expect(res.status).toBe(400);
  });
});

describe('GameRoom websocket protocol', () => {
  it('host is X, guest is O; moves sync; invalid move rejected', async () => {
    const room = await createRoom(3);
    const host = await joinAsHost(room.code, room.hostToken);

    // Attach host listener before guest join so sync is not missed.
    const hostSync = nextMessage(host.ws, 3000, 'guest-joined sync');
    const guest = await joinAsGuest(room.code);
    const sync = await hostSync;
    expect(sync.type).toBe('sync');
    if (sync.type === 'sync') {
      expect(sync.snapshot.phase).toBe('PLAYING');
      expect(sync.snapshot.guestConnected).toBe(true);
    }

    {
      const hostAfterMove = nextMessage(host.ws, 3000, 'host move sync');
      const guestAfterMove = nextMessage(guest.ws, 3000, 'guest move sync');
      send(host.ws, { type: 'move', index: 0 });
      const h = await hostAfterMove;
      const g = await guestAfterMove;
      expect(h.type).toBe('sync');
      expect(g.type).toBe('sync');
      if (h.type === 'sync') {
        expect(h.snapshot.board[0]).toBe('X');
        expect(h.snapshot.turn).toBe('O');
      }
    }

    {
      const errP = nextMessage(host.ws, 3000, 'not your turn');
      send(host.ws, { type: 'move', index: 1 });
      expect(await errP).toEqual({ type: 'error', message: 'Not your turn' });
    }

    {
      const invalidP = nextMessage(guest.ws, 3000, 'invalid move');
      send(guest.ws, { type: 'move', index: 0 });
      expect(await invalidP).toEqual({ type: 'error', message: 'Invalid move' });
    }

    host.ws.close(1000, 'done');
    guest.ws.close(1000, 'done');
  });

  it('nextRound and rematch advance both clients; rematch keeps seats', async () => {
    const room = await createRoom(3);
    const host = await joinAsHost(room.code, room.hostToken);
    const hostSync = nextMessage(host.ws);
    const guest = await joinAsGuest(room.code);
    await hostSync;

    const moves: Array<{ seat: 'host' | 'guest'; index: number }> = [
      { seat: 'host', index: 0 },
      { seat: 'guest', index: 3 },
      { seat: 'host', index: 1 },
      { seat: 'guest', index: 4 },
      { seat: 'host', index: 2 },
    ];
    for (const m of moves) {
      const actor = m.seat === 'host' ? host.ws : guest.ws;
      const other = m.seat === 'host' ? guest.ws : host.ws;
      const a = nextMessage(actor);
      const b = nextMessage(other);
      send(actor, { type: 'move', index: m.index });
      await a;
      await b;
    }

    {
      const a = nextMessage(host.ws);
      const b = nextMessage(guest.ws);
      send(host.ws, { type: 'nextRound' });
      const nrHost = await a;
      const nrGuest = await b;
      expect(nrHost.type).toBe('sync');
      expect(nrGuest.type).toBe('sync');
      if (nrHost.type === 'sync') {
        expect(nrHost.snapshot.phase).toBe('PLAYING');
        expect(nrHost.snapshot.board.every((t) => t === ' ')).toBe(true);
        expect(nrHost.snapshot.rounds).toHaveLength(1);
      }
    }

    for (const m of moves) {
      const actor = m.seat === 'host' ? host.ws : guest.ws;
      const other = m.seat === 'host' ? guest.ws : host.ws;
      const a = nextMessage(actor);
      const b = nextMessage(other);
      send(actor, { type: 'move', index: m.index });
      await a;
      await b;
    }

    {
      const a = nextMessage(host.ws);
      const b = nextMessage(guest.ws);
      send(guest.ws, { type: 'rematch' });
      const rmHost = await a;
      const rmGuest = await b;
      expect(rmHost.type).toBe('sync');
      if (rmHost.type === 'sync') {
        expect(rmHost.snapshot.phase).toBe('PLAYING');
        expect(rmHost.snapshot.rounds).toHaveLength(0);
        expect(rmHost.snapshot.matchWinner).toBeUndefined();
      }
      expect(rmGuest.type).toBe('sync');
    }
    expect(host.welcome.seat).toBe('X');
    expect(guest.welcome.seat).toBe('O');

    {
      const a = nextMessage(host.ws);
      const b = nextMessage(guest.ws);
      send(host.ws, { type: 'quit' });
      const quitHost = await a;
      const quitGuest = await b;
      expect(quitHost.type).toBe('sync');
      expect(quitGuest.type).toBe('sync');
      if (quitGuest.type === 'sync') {
        expect(quitGuest.snapshot.phase).toBe('MATCH_OVER');
        expect(quitGuest.snapshot.forfeitedBy).toBe('X');
        expect(quitGuest.snapshot.matchWinner).toBe('O');
        expect(quitGuest.snapshot.hostConnected).toBe(false);
      }
    }
  });

  it('tells a guest the game is not available when the room is missing or not waiting', async () => {
    const missing = await openWs('ZZZZZZ');
    const missingReply = nextMessage(missing, 3000, 'missing room');
    send(missing, { type: 'join' });
    const missingMsg = await missingReply;
    expect(missingMsg.type).toBe('roomClosed');

    const room = await createRoom(3);
    const host = await joinAsHost(room.code, room.hostToken);
    const hostSync = nextMessage(host.ws, 3000, 'guest joined');
    await joinAsGuest(room.code);
    await hostSync;

    const late = await openWs(room.code);
    const lateReply = nextMessage(late, 3000, 'late guest');
    send(late, { type: 'join' });
    const lateMsg = await lateReply;
    expect(lateMsg).toEqual({ type: 'error', message: 'The game is not available' });
  });

  it('disconnect before the guest joins can still be reclaimed', async () => {
    const room = await createRoom(3);
    const host = await joinAsHost(room.code, room.hostToken);
    host.ws.close(1000, 'refresh');

    const id = env.GAME_ROOM.idFromName(room.code);
    const stub = env.GAME_ROOM.get(id);
    await vi.waitFor(async () => {
      const pending = await runInDurableObject(stub, (instance: GameRoom) =>
        instance.hasPendingReclaim()
      );
      expect(pending).toBe(true);
    });

    const again = await openWs(room.code);
    const pending = nextMessage(again, 3000, 'host reclaim welcome');
    send(again, { type: 'join', token: room.hostToken });
    const welcome = await pending;
    expect(welcome.type).toBe('welcome');
    if (welcome.type === 'welcome') {
      expect(welcome.seat).toBe('X');
      expect(welcome.snapshot.phase).toBe('WAITING');
      expect(welcome.snapshot.hostConnected).toBe(true);
      expect(welcome.snapshot.reclaimDeadlineMs).toBeNull();
    }
  });

  it('disconnect during a match ends it immediately', async () => {
    const room = await createRoom(3);
    const host = await joinAsHost(room.code, room.hostToken);
    const hostSync = nextMessage(host.ws);
    const guest = await joinAsGuest(room.code);
    await hostSync;

    const left = nextMessage(host.ws, 3000, 'guest left');
    guest.ws.close(1000, 'left');
    const sync = await left;
    expect(sync.type).toBe('sync');
    if (sync.type === 'sync') {
      expect(sync.snapshot.phase).toBe('MATCH_OVER');
      expect(sync.snapshot.forfeitedBy).toBe('O');
      expect(sync.snapshot.matchWinner).toBe('X');
      expect(sync.snapshot.guestConnected).toBe(false);
    }

    host.ws.close(1000, 'done');
  });

  it('idle TTL closes a room with fewer than two connected seats', async () => {
    const room = await createRoom(3);
    const host = await joinAsHost(room.code, room.hostToken);

    const id = env.GAME_ROOM.idFromName(room.code);
    const stub = env.GAME_ROOM.get(id);

    const closed = nextMessage(host.ws, 3000, 'idle roomClosed');
    await runInDurableObject(stub, async (instance: GameRoom) => {
      await instance.runDueAlarms(Date.now() + IDLE_TTL_MS + 1);
    });
    const msg = await closed;
    expect(msg.type).toBe('roomClosed');
    if (msg.type === 'roomClosed') {
      expect(msg.reason).toBe('idle timeout');
    }
  });
});
