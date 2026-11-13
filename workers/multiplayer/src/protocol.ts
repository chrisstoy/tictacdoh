import type { PlayerId, TileState, Winner } from '../../../shared/types';

export type PlayPhase = 'WAITING' | 'PLAYING' | 'ROUND_OVER' | 'MATCH_OVER' | 'CLOSED';

export type ClientMessage =
  | { type: 'join'; token?: string }
  | { type: 'move'; index: number }
  | { type: 'nextRound' }
  | { type: 'rematch' }
  | { type: 'quit' };

export type RoomSnapshot = {
  code: string;
  phase: PlayPhase;
  roundsInMatch: number;
  board: TileState[];
  turn: PlayerId;
  roundWinner: Winner | undefined;
  isDraw: boolean;
  rounds: { winner: Winner | undefined }[];
  matchWinner: PlayerId | undefined;
  hostConnected: boolean;
  guestConnected: boolean;
  reclaimDeadlineMs: number | null;
  forfeitedBy: PlayerId | undefined;
};

export type ServerMessage =
  | { type: 'welcome'; seat: PlayerId; token: string; snapshot: RoomSnapshot }
  | { type: 'sync'; snapshot: RoomSnapshot }
  | { type: 'disconnect'; seat: PlayerId; reclaimMs: number }
  | { type: 'error'; message: string }
  | { type: 'roomClosed'; reason: string };

export const RECLAIM_MS = 60_000;
export const IDLE_TTL_MS = 30 * 60_000;

export function parseClientMessage(raw: string): ClientMessage | null {
  try {
    const data = JSON.parse(raw) as { type?: string };
    if (!data || typeof data.type !== 'string') return null;
    switch (data.type) {
      case 'join':
        return {
          type: 'join',
          token: typeof (data as { token?: unknown }).token === 'string'
            ? (data as { token: string }).token
            : undefined,
        };
      case 'move': {
        const index = (data as { index?: unknown }).index;
        if (typeof index !== 'number') return null;
        return { type: 'move', index };
      }
      case 'nextRound':
      case 'rematch':
      case 'quit':
        return { type: data.type };
      default:
        return null;
    }
  } catch {
    return null;
  }
}
