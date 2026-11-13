import { joinOnlineSession, leaveOnlineSession } from './onlineSession';
import { useOnlineSessionStore } from './sessionStore';

function hasActiveOnlineSession(): boolean {
  const { status, roomCode } = useOnlineSessionStore.getState();
  if (!roomCode) {
    return false;
  }
  return (
    status === 'connecting' ||
    status === 'connected' ||
    status === 'reconnecting' ||
    status === 'disconnected'
  );
}

/**
 * Join a room from a deep-link code. If another online session is already
 * active, leave it first so we do not stack sockets.
 */
export async function acceptDeepLinkJoin(code: string): Promise<void> {
  if (hasActiveOnlineSession()) {
    await leaveOnlineSession();
  }
  await joinOnlineSession(code);
}
