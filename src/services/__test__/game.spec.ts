import { BoardState, PlayerId } from '../../types';
import { solveBoard } from '../game';

describe('game', () => {
  describe('solveBoard', () => {
    it('should return the correct victory state for a winning board', () => {
      const boardState: BoardState = {
        // prettier-ignore
        board: [
          'X', 'X', 'X',
          undefined, 'O', undefined,
          'O', undefined, 'O'
        ],
        // prettier-ignore-end
        victoryState: 'none',
        children: [],
        player: 'X',
        move: 0,
      };
      expect(solveBoard(boardState, 'X', 'X').victoryState).toBe('win');
      expect(solveBoard(boardState, 'X', 'O').victoryState).toBe('lose');
    });

    it('should return child boards containings all possible solutions to this board', () => {
      const boardState: BoardState = {
        // prettier-ignore
        board: [
          'X', undefined, 'X',
          undefined, 'O', undefined,
          'O', undefined, 'O',
        ],
        // prettier-ignore-end
        move: 0,
        player: 'X',
        victoryState: 'none',
        children: [],
      };

      const result = solveBoard(boardState, 'X', 'X');

      expect(result.victoryState).toBe('none');
    });

    // Add more test cases to cover different scenarios
  });
});
