import {
  AVAILABLE_ROUNDS_IN_MATCH,
  INFINITE_ROUNDS,
  applyMove,
  determineWinner,
  emptyBoard,
  isValidMove,
  isValidRoundsInMatch,
  matchWinnerAfterRounds,
} from '../gameRules';
import type { TileState } from '../types';

describe('shared/gameRules', () => {
  describe('determineWinner', () => {
    it('detects a top-row X win', () => {
      const board: TileState[] = ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'];
      expect(determineWinner(board)).toEqual({ player: 'X', line: [0, 1, 2] });
    });

    it('returns undefined when fewer than three marks', () => {
      expect(determineWinner(emptyBoard())).toBeUndefined();
    });

    it('returns undefined for a full board draw (no line)', () => {
      const board: TileState[] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
      expect(determineWinner(board)).toBeUndefined();
    });
  });

  describe('isValidMove / applyMove', () => {
    it('allows empty tile on current turn', () => {
      const board = emptyBoard();
      expect(isValidMove(board, 4, 'X')).toBe(true);
      expect(applyMove(board, 4, 'X')[4]).toBe('X');
    });

    it('rejects occupied tile and out-of-range index', () => {
      const board = applyMove(emptyBoard(), 0, 'X');
      expect(isValidMove(board, 0, 'O')).toBe(false);
      expect(isValidMove(board, 9, 'O')).toBe(false);
      expect(isValidMove(board, -1, 'O')).toBe(false);
    });

    it('rejects move when a winner already exists', () => {
      const board: TileState[] = ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', ' '];
      expect(isValidMove(board, 3, 'O')).toBe(false);
    });
  });

  describe('matchWinnerAfterRounds', () => {
    it('declares majority winner in best-of-3', () => {
      expect(
        matchWinnerAfterRounds(
          [{ winner: { player: 'X', line: [0, 1, 2] } }, { winner: { player: 'X', line: [0, 1, 2] } }],
          3
        )
      ).toBe('X');
    });

    it('never declares a winner in infinite rounds', () => {
      expect(
        matchWinnerAfterRounds(
          [
            { winner: { player: 'X', line: [0, 1, 2] } },
            { winner: { player: 'X', line: [0, 1, 2] } },
            { winner: { player: 'X', line: [0, 1, 2] } },
          ],
          INFINITE_ROUNDS
        )
      ).toBeUndefined();
    });
  });

  describe('rounds validation', () => {
    it('accepts known match lengths', () => {
      for (const n of AVAILABLE_ROUNDS_IN_MATCH) {
        expect(isValidRoundsInMatch(n)).toBe(true);
      }
      expect(isValidRoundsInMatch(4)).toBe(false);
    });
  });
});
