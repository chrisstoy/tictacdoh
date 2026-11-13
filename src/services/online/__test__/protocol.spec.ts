import { parseServerMessage } from '../protocol';

describe('parseServerMessage', () => {
  it('parses welcome with seat, token, and snapshot', () => {
    const raw = JSON.stringify({
      type: 'welcome',
      seat: 'X',
      token: 'abc123',
      snapshot: {
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
      },
    });

    expect(parseServerMessage(raw)).toEqual({
      type: 'welcome',
      seat: 'X',
      token: 'abc123',
      snapshot: expect.objectContaining({ code: 'ABCD12', phase: 'WAITING' }),
    });
  });

  it('parses sync snapshots', () => {
    const raw = JSON.stringify({
      type: 'sync',
      snapshot: {
        code: 'ABCD12',
        phase: 'PLAYING',
        roundsInMatch: 5,
        board: ['X', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        turn: 'O',
        roundWinner: undefined,
        isDraw: false,
        rounds: [],
        matchWinner: undefined,
        hostConnected: true,
        guestConnected: true,
        reclaimDeadlineMs: null,
        forfeitedBy: undefined,
      },
    });

    const msg = parseServerMessage(raw);
    expect(msg?.type).toBe('sync');
    if (msg?.type === 'sync') {
      expect(msg.snapshot.board[0]).toBe('X');
      expect(msg.snapshot.turn).toBe('O');
    }
  });

  it('parses disconnect, error, and roomClosed', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'disconnect', seat: 'O', reclaimMs: 60000 }))).toEqual({
      type: 'disconnect',
      seat: 'O',
      reclaimMs: 60000,
    });
    expect(parseServerMessage(JSON.stringify({ type: 'error', message: 'Not your turn' }))).toEqual({
      type: 'error',
      message: 'Not your turn',
    });
    expect(parseServerMessage(JSON.stringify({ type: 'roomClosed', reason: 'idle' }))).toEqual({
      type: 'roomClosed',
      reason: 'idle',
    });
  });

  it('returns null for invalid payloads', () => {
    expect(parseServerMessage('not-json')).toBeNull();
    expect(parseServerMessage(JSON.stringify({ type: 'unknown' }))).toBeNull();
    expect(parseServerMessage(JSON.stringify({ type: 'welcome', seat: 'Z' }))).toBeNull();
    expect(parseServerMessage(JSON.stringify({ type: 'sync' }))).toBeNull();
  });
});
