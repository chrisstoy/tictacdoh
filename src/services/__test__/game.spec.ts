import { BoardState, PlayerId, TileState } from '../../types';
import { pickMove, solveBoard } from '../game';

function createMockBoard(
  board: TileState[],
  player: PlayerId = 'X'
): BoardState {
  return {
    board,
    player,
    move: 0,
    victoryState: 'none',
    children: [],
  };
}

describe('game', () => {
  describe('solveBoard', () => {
    it('should return the correct victory state for a winning board', () => {
      const boardState = createMockBoard(
        // prettier-ignore
        [
          'X', 'X', 'X',
          ' ', 'O', ' ',
          'O', ' ', 'O'
        ]
        // prettier-ignore-end
      );
      expect(solveBoard(boardState, 'X', 'X').victoryState).toBe('win');
      expect(solveBoard(boardState, 'X', 'O').victoryState).toBe('lose');
    });

    it('should return child boards containings all possible solutions to this board', () => {
      const boardState = createMockBoard(
        // prettier-ignore
        [
          'X', ' ', 'X',
          ' ', 'O', ' ',
          'O', ' ', 'O',
        ]
        // prettier-ignore-end
      );
      const result = solveBoard(boardState, 'X', 'X');
      expect(result.victoryState).toBe('none');
    });

    // Add more test cases to cover different scenarios
  });

  describe('pickMove', () => {
    it('should return the correct move for a winning board', () => {
      const m1 = pickMove(
        createMockBoard(
          // prettier-ignore
          [
              'X', 'X', ' ',
              ' ', 'O', ' ',
              'O', 'X', 'O'
            ]
          // prettier-ignore-end
        )
      );
      expect(m1).toBe(2);

      const m2 = pickMove(
        createMockBoard(
          // prettier-ignore
          [
              'X', 'O', ' ',
              ' ', 'O', 'X',
              'X', ' ', 'O'
            ]
          // prettier-ignore-end
        )
      );
      expect(m2).toBe(3);

      const m3 = pickMove(
        createMockBoard(
          // prettier-ignore
          [
              'X', 'O', ' ',
              'O', 'O', ' ',
              'X', ' ', 'X'
            ]
          // prettier-ignore-end
        )
      );
      expect(m3).toBe(7);
    });

    it('should return the correct move to block losing next turn', () => {
      const m1 = pickMove(
        createMockBoard(
          // prettier-ignore
          [
              'X', ' ', ' ',
              'X', 'O', ' ',
              'O', 'X', 'O'
            ]
          // prettier-ignore-end
        )
      );
      expect(m1).toBe(2);

      const m2 = pickMove(
        createMockBoard(
          // prettier-ignore
          [
              ' ', 'X', 'O',
              'X', 'O', ' ',
              'X', 'O', 'X'
            ],
          // prettier-ignore-end
          'O'
        )
      );
      expect(m2).toBe(0);
    });
  });
});
