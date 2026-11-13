import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { PlayerId } from '@/types';
import { withZustandDevtools } from '../zustandDevtools';
import type { RoomSnapshot } from './protocol';

export type OnlineConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'closed';

type SessionState = {
  status: OnlineConnectionStatus;
  seat: PlayerId | undefined;
  roomCode: string | undefined;
  inviteUrl: string | undefined;
  reconnectToken: string | undefined;
  reclaimDeadlineMs: number | null;
  lastSnapshot: RoomSnapshot | undefined;
  lastError: string | undefined;
  hostConnected: boolean;
  guestConnected: boolean;
};

type SessionActions = {
  reset(): void;
  setConnecting(partial?: Partial<SessionState>): void;
  applyWelcome(input: {
    seat: PlayerId;
    token: string;
    snapshot: RoomSnapshot;
    roomCode: string;
    inviteUrl?: string;
  }): void;
  applySync(snapshot: RoomSnapshot): void;
  applyDisconnect(seat: PlayerId, reclaimMs: number): void;
  applyError(message: string): void;
  applyRoomClosed(reason: string): void;
  setStatus(status: OnlineConnectionStatus): void;
};

const initialState: SessionState = {
  status: 'idle',
  seat: undefined,
  roomCode: undefined,
  inviteUrl: undefined,
  reconnectToken: undefined,
  reclaimDeadlineMs: null,
  lastSnapshot: undefined,
  lastError: undefined,
  hostConnected: false,
  guestConnected: false,
};

export const useOnlineSessionStore = create<SessionState & SessionActions>()(
  withZustandDevtools(
    (set) => ({
      ...initialState,

      reset() {
        set({ ...initialState });
      },

      setConnecting(partial = {}) {
        set({
          status: 'connecting',
          lastError: undefined,
          ...partial,
        });
      },

      applyWelcome({ seat, token, snapshot, roomCode, inviteUrl }) {
        set((state) => ({
          status: 'connected',
          seat,
          reconnectToken: token,
          roomCode,
          inviteUrl: inviteUrl ?? state.inviteUrl,
          lastSnapshot: snapshot,
          reclaimDeadlineMs: snapshot.reclaimDeadlineMs,
          hostConnected: snapshot.hostConnected,
          guestConnected: snapshot.guestConnected,
          lastError: undefined,
        }));
      },

      applySync(snapshot) {
        set({
          status: 'connected',
          lastSnapshot: snapshot,
          roomCode: snapshot.code,
          reclaimDeadlineMs: snapshot.reclaimDeadlineMs,
          hostConnected: snapshot.hostConnected,
          guestConnected: snapshot.guestConnected,
          lastError: undefined,
        });
      },

      applyDisconnect(seat, reclaimMs) {
        set({
          status: 'disconnected',
          reclaimDeadlineMs: Date.now() + reclaimMs,
          lastError: undefined,
          ...(seat === 'X' ? { hostConnected: false } : { guestConnected: false }),
        });
      },

      applyError(message) {
        set({ lastError: message });
      },

      applyRoomClosed(reason) {
        set({
          status: 'closed',
          lastError: reason,
          reclaimDeadlineMs: null,
          hostConnected: false,
          guestConnected: false,
        });
      },

      setStatus(status) {
        set({ status });
      },
    }),
    { name: 'OnlineSessionStore' }
  )
);

export const selectOnlineStatus = (s: SessionState) => s.status;
export const selectOnlineSeat = (s: SessionState) => s.seat;
export const selectOnlineRoomCode = (s: SessionState) => s.roomCode;
export const selectOnlineInviteUrl = (s: SessionState) => s.inviteUrl;
export const selectOnlineLastSnapshot = (s: SessionState) => s.lastSnapshot;
export const selectOnlineReclaimDeadlineMs = (s: SessionState) => s.reclaimDeadlineMs;
export const selectOnlineLastError = (s: SessionState) => s.lastError;

/** Active online match (lobby→play or mid-reclaim). Idle/closed are local-only. */
export const selectIsOnlineMatchActive = (s: SessionState) =>
  s.seat != null &&
  (s.status === 'connected' || s.status === 'disconnected' || s.status === 'reconnecting');

export function selectIsOpponentDisconnected(s: SessionState): boolean {
  if (!selectIsOnlineMatchActive(s) || s.reclaimDeadlineMs == null || s.seat == null) {
    return false;
  }
  if (s.seat === 'X') return !s.guestConnected;
  return !s.hostConnected;
}

export const useOnlineSessionActions = () =>
  useOnlineSessionStore(
    useShallow((s) => ({
      reset: s.reset,
      setConnecting: s.setConnecting,
      applyWelcome: s.applyWelcome,
      applySync: s.applySync,
      applyDisconnect: s.applyDisconnect,
      applyError: s.applyError,
      applyRoomClosed: s.applyRoomClosed,
      setStatus: s.setStatus,
    }))
  );
