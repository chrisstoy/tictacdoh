jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { useMatchStore } from '../../matchState';
import { useOptionsStore } from '../../optionsState';
import { useRoundStore } from '../../roundState';
import { applySyncToLocalStores } from '../applySync';
import type { RoomSnapshot } from '../protocol';

function baseSnapshot(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    code: 'ABCD12',
    phase: 'PLAYING',
    roundsInMatch: 5,
    board: ['X', 'O', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    turn: 'X',
    roundWinner: undefined,
    isDraw: false,
    rounds: [{ winner: { player: 'O', line: [0, 1, 2] } }],
    matchWinner: undefined,
    hostConnected: true,
    guestConnected: true,
    reclaimDeadlineMs: null,
    forfeitedBy: undefined,
    ...overrides,
  };
}

describe('applySyncToLocalStores', () => {
  beforeEach(() => {
    useMatchStore.setState({
      isCPU: { X: true, O: true },
      roundsInMatch: 3,
      rounds: [],
      winner: undefined,
      playMode: 'SETUP_MATCH',
    });
    useRoundStore.setState({
      boardState: Array(9).fill(' '),
      turn: 'O',
      winner: undefined,
      isDraw: false,
    });
    useOptionsStore.setState({ autoReplay: true, enableSound: true, enableMusic: true });
  });

  it('hydrates board, turn, rounds, playMode, and roundsInMatch', () => {
    applySyncToLocalStores(
      baseSnapshot({
        phase: 'ROUND_OVER',
        roundWinner: { player: 'X', line: [0, 4, 8] },
        isDraw: false,
        board: ['X', ' ', ' ', ' ', 'X', ' ', ' ', ' ', 'X'],
        turn: 'X',
      })
    );

    const match = useMatchStore.getState();
    expect(match.roundsInMatch).toBe(5);
    expect(match.playMode).toBe('ROUND_OVER');
    expect(match.rounds).toEqual([
      {
        boardState: Array(9).fill(' '),
        winner: { player: 'O', line: [0, 1, 2] },
      },
    ]);
    expect(match.winner).toBeUndefined();

    const round = useRoundStore.getState();
    expect(round.boardState).toEqual(['X', ' ', ' ', ' ', 'X', ' ', ' ', ' ', 'X']);
    expect(round.turn).toBe('X');
    expect(round.winner).toEqual({ player: 'X', line: [0, 4, 8] });
    expect(round.isDraw).toBe(false);
  });

  it('maps WAITING→SETUP_ROUND and MATCH_OVER/CLOSED→MATCH_OVER', () => {
    applySyncToLocalStores(baseSnapshot({ phase: 'WAITING' }));
    expect(useMatchStore.getState().playMode).toBe('SETUP_ROUND');

    applySyncToLocalStores(baseSnapshot({ phase: 'MATCH_OVER', matchWinner: 'X' }));
    expect(useMatchStore.getState().playMode).toBe('MATCH_OVER');
    expect(useMatchStore.getState().winner).toBe('X');

    applySyncToLocalStores(baseSnapshot({ phase: 'CLOSED', matchWinner: 'O' }));
    expect(useMatchStore.getState().playMode).toBe('MATCH_OVER');
  });

  it('disables local CPU and options autoReplay', () => {
    applySyncToLocalStores(baseSnapshot());
    expect(useMatchStore.getState().isCPU).toEqual({ X: false, O: false });
    expect(useOptionsStore.getState().autoReplay).toBe(false);
  });
});
