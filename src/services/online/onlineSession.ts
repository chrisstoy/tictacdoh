import { applySyncToLocalStores } from './applySync';
import { isOnlineMultiplayerConfigured } from './config';
import { createRoom, roomWsUrl } from './http';
import type { ClientMessage, RoomSnapshot, ServerMessage } from './protocol';
import {
  clearOnlineReconnectCreds,
  loadOnlineReconnectCreds,
  saveOnlineReconnectCreds,
} from './reconnectStorage';
import { useOnlineSessionStore } from './sessionStore';
import { OnlineWsClient, type WsFactory } from './wsClient';

let wsClient = new OnlineWsClient();
let pendingInviteUrl: string | undefined;

/** Test seam — swap WebSocket factory / reset singleton client. */
export function __setOnlineWsFactoryForTests(factory?: WsFactory): void {
  wsClient.close();
  wsClient = new OnlineWsClient(factory ?? ((url) => new WebSocket(url)));
}

function handleServerMessage(msg: ServerMessage): void {
  const store = useOnlineSessionStore.getState();

  switch (msg.type) {
    case 'welcome': {
      void saveOnlineReconnectCreds({
        roomCode: msg.snapshot.code,
        reconnectToken: msg.token,
        seat: msg.seat,
      });
      store.applyWelcome({
        seat: msg.seat,
        token: msg.token,
        snapshot: msg.snapshot,
        roomCode: msg.snapshot.code,
        inviteUrl: pendingInviteUrl,
      });
      applySyncToLocalStores(msg.snapshot);
      break;
    }
    case 'sync': {
      store.applySync(msg.snapshot);
      applySyncToLocalStores(msg.snapshot);
      break;
    }
    case 'disconnect': {
      store.applyDisconnect(msg.seat, msg.reclaimMs);
      break;
    }
    case 'error': {
      store.applyError(msg.message);
      break;
    }
    case 'roomClosed': {
      void clearOnlineReconnectCreds();
      store.applyRoomClosed(msg.reason);
      wsClient.close();
      break;
    }
  }
}

function openSocket(wsUrl: string): void {
  wsClient.connect(wsUrl, {
    onMessage: handleServerMessage,
    onClose: () => {
      const { status } = useOnlineSessionStore.getState();
      if (status === 'connected' || status === 'connecting' || status === 'reconnecting') {
        useOnlineSessionStore.getState().setStatus('disconnected');
      }
    },
    onError: () => {
      useOnlineSessionStore.getState().applyError('WebSocket error');
    },
  });
}

async function connectAndJoin(opts: {
  code: string;
  wsUrl?: string;
  token?: string;
  inviteUrl?: string;
  status: 'connecting' | 'reconnecting';
}): Promise<void> {
  if (!isOnlineMultiplayerConfigured() && !opts.wsUrl) {
    throw new Error('Online multiplayer is not configured');
  }

  pendingInviteUrl = opts.inviteUrl;
  useOnlineSessionStore.getState().setConnecting({
    status: opts.status,
    roomCode: opts.code.toUpperCase(),
    inviteUrl: opts.inviteUrl,
  });

  const url = roomWsUrl(opts.code, opts.wsUrl);
  openSocket(url);
  await wsClient.waitUntilOpen();
  wsClient.send({ type: 'join', token: opts.token });
}

export async function createOnlineSession(roundsInMatch: number): Promise<{
  code: string;
  inviteUrl: string;
}> {
  const room = await createRoom(roundsInMatch);
  await connectAndJoin({
    code: room.code,
    wsUrl: room.wsUrl,
    token: room.hostToken,
    inviteUrl: room.inviteUrl,
    status: 'connecting',
  });
  return { code: room.code, inviteUrl: room.inviteUrl };
}

export async function joinOnlineSession(code: string): Promise<void> {
  await connectAndJoin({
    code,
    status: 'connecting',
  });
}

export async function reconnectOnlineSession(): Promise<boolean> {
  const creds = await loadOnlineReconnectCreds();
  if (!creds) {
    useOnlineSessionStore.getState().applyError('No reconnect credentials');
    useOnlineSessionStore.getState().setStatus('disconnected');
    return false;
  }
  await connectAndJoin({
    code: creds.roomCode,
    token: creds.reconnectToken,
    status: 'reconnecting',
  });
  return true;
}

function requireOpenSend(msg: ClientMessage): void {
  if (!wsClient.isOpen) {
    throw new Error('Not connected to an online room');
  }
  wsClient.send(msg);
}

export function sendMove(index: number): void {
  requireOpenSend({ type: 'move', index });
}

export function sendNextRound(): void {
  requireOpenSend({ type: 'nextRound' });
}

export function sendRematch(): void {
  requireOpenSend({ type: 'rematch' });
}

export async function leaveOnlineSession(): Promise<void> {
  try {
    if (wsClient.isOpen) {
      wsClient.send({ type: 'quit' });
    }
  } catch {
    // ignore
  }
  wsClient.close();
  await clearOnlineReconnectCreds();
  useOnlineSessionStore.getState().reset();
}

/** Apply a snapshot without a live socket — useful for tests / offline hydrate. */
export function applyOnlineSnapshot(snapshot: RoomSnapshot): void {
  useOnlineSessionStore.getState().applySync(snapshot);
  applySyncToLocalStores(snapshot);
}
