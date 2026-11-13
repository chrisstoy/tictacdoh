import type { PlayerId, TileState, Winner } from '@/types';

/** Mirrors workers/multiplayer/src/protocol.ts — keep shapes in lockstep. */

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

const PLAYER_IDS: PlayerId[] = ['X', 'O'];
const PHASES: PlayPhase[] = ['WAITING', 'PLAYING', 'ROUND_OVER', 'MATCH_OVER', 'CLOSED'];

function isPlayerId(value: unknown): value is PlayerId {
  return typeof value === 'string' && (PLAYER_IDS as string[]).includes(value);
}

function isPlayPhase(value: unknown): value is PlayPhase {
  return typeof value === 'string' && (PHASES as string[]).includes(value);
}

function isTileState(value: unknown): value is TileState {
  return value === ' ' || value === 'X' || value === 'O';
}

function parseWinner(value: unknown): Winner | undefined {
  if (value == null) return undefined;
  if (typeof value !== 'object') return undefined;
  const w = value as { player?: unknown; line?: unknown };
  if (!isPlayerId(w.player) || !Array.isArray(w.line)) return undefined;
  if (!w.line.every((n) => typeof n === 'number')) return undefined;
  return { player: w.player, line: w.line as number[] };
}

function parseSnapshot(value: unknown): RoomSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const s = value as Record<string, unknown>;
  if (typeof s.code !== 'string') return null;
  if (!isPlayPhase(s.phase)) return null;
  if (typeof s.roundsInMatch !== 'number') return null;
  if (!Array.isArray(s.board) || s.board.length !== 9 || !s.board.every(isTileState)) return null;
  if (!isPlayerId(s.turn)) return null;
  if (typeof s.isDraw !== 'boolean') return null;
  if (!Array.isArray(s.rounds)) return null;
  if (typeof s.hostConnected !== 'boolean' || typeof s.guestConnected !== 'boolean') return null;
  if (!(s.reclaimDeadlineMs === null || typeof s.reclaimDeadlineMs === 'number')) return null;

  const rounds = s.rounds.map((r) => {
    if (!r || typeof r !== 'object') return { winner: undefined };
    return { winner: parseWinner((r as { winner?: unknown }).winner) };
  });

  return {
    code: s.code,
    phase: s.phase,
    roundsInMatch: s.roundsInMatch,
    board: s.board as TileState[],
    turn: s.turn,
    roundWinner: parseWinner(s.roundWinner),
    isDraw: s.isDraw,
    rounds,
    matchWinner: isPlayerId(s.matchWinner) ? s.matchWinner : undefined,
    hostConnected: s.hostConnected,
    guestConnected: s.guestConnected,
    reclaimDeadlineMs: s.reclaimDeadlineMs as number | null,
    forfeitedBy: isPlayerId(s.forfeitedBy) ? s.forfeitedBy : undefined,
  };
}

export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    const data = JSON.parse(raw) as { type?: string };
    if (!data || typeof data.type !== 'string') return null;

    switch (data.type) {
      case 'welcome': {
        const seat = (data as { seat?: unknown }).seat;
        const token = (data as { token?: unknown }).token;
        const snapshot = parseSnapshot((data as { snapshot?: unknown }).snapshot);
        if (!isPlayerId(seat) || typeof token !== 'string' || !snapshot) return null;
        return { type: 'welcome', seat, token, snapshot };
      }
      case 'sync': {
        const snapshot = parseSnapshot((data as { snapshot?: unknown }).snapshot);
        if (!snapshot) return null;
        return { type: 'sync', snapshot };
      }
      case 'disconnect': {
        const seat = (data as { seat?: unknown }).seat;
        const reclaimMs = (data as { reclaimMs?: unknown }).reclaimMs;
        if (!isPlayerId(seat) || typeof reclaimMs !== 'number') return null;
        return { type: 'disconnect', seat, reclaimMs };
      }
      case 'error': {
        const message = (data as { message?: unknown }).message;
        if (typeof message !== 'string') return null;
        return { type: 'error', message };
      }
      case 'roomClosed': {
        const reason = (data as { reason?: unknown }).reason;
        if (typeof reason !== 'string') return null;
        return { type: 'roomClosed', reason };
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function serializeClientMessage(msg: ClientMessage): string {
  return JSON.stringify(msg);
}
