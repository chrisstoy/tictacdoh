import { determineWinner as sharedDetermineWinner } from '../../shared/gameRules';
import { BoardState, PlayerId, TileState, Winner } from '../types';

/** Re-export shared rules so fixtures and the app keep importing from here. */
export function determineWinner(boardState: TileState[]): Winner | undefined {
  return sharedDetermineWinner(boardState);
}

export function solveBoard(boardState: BoardState, turn: PlayerId, player: PlayerId): BoardState {
  const winner = determineWinner(boardState.board);
  if (winner) {
    return {
      ...boardState,
      victoryState: winner.player === player ? 'win' : 'lose',
    };
  }

  // create list of all possible moves
  const possibleMoves = boardState.board.reduce<BoardState[]>((acc, tileState, index) => {
    if (tileState === ' ') {
      const newBoardState = [...boardState.board];
      newBoardState[index] = turn;
      acc.push({
        board: newBoardState,
        player: turn,
        move: index,
        victoryState: 'none',
        children: [],
      });
    }
    return acc;
  }, []);

  // no possible moves, so the board is a draw
  if (possibleMoves.length === 0) {
    return {
      ...boardState,
      victoryState: 'draw',
    };
  }

  const nextTurn = turn === 'X' ? 'O' : 'X';
  const children = possibleMoves.map((move) => solveBoard(move, nextTurn, player));
  return {
    ...boardState,
    victoryState: 'none',
    children,
  };
}

const randomItem = <T>(arr: T[]) =>
  arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined;

const pickMoveForState = (state: BoardState['victoryState']) => (children: BoardState[]) => {
  const moves = children.filter((child) => child.victoryState === state).map((child) => child.move);
  return randomItem(moves);
};

const pickWinningMove = pickMoveForState('win');
const pickLosingMove = pickMoveForState('lose');

export function pickMove(board: BoardState): number | undefined {
  if (board.victoryState !== 'none') {
    return undefined;
  }

  // if no moves yet, just pick a random tile
  const exisingMove = board.board.find((tile) => tile !== ' ');
  if (!exisingMove) {
    return pickRandomEmptyTile(board.board);
  }

  const solvedBoard = solveBoard({ ...board }, board.player, board.player);

  // pick any board that is an immediate win
  const winingMove = pickWinningMove(solvedBoard.children);
  if (winingMove !== undefined) return winingMove;

  // pick any move that will block a loss next turn
  const losingMove = randomItem(
    solvedBoard.children.reduce<number[]>((acc, child) => {
      const move = pickLosingMove(child.children);
      if (move !== undefined) {
        acc.push(move);
      }
      return acc;
    }, [])
  );

  if (losingMove !== undefined) return losingMove;

  // pick any move that could be a win on the next turn

  // pick a random move
  const possibleMoves = solvedBoard.children
    .filter((child) => child.victoryState === 'none')
    .map((child) => child.move);
  return randomItem(possibleMoves) ?? undefined;
}

export function pickRandomEmptyTile(boardState: TileState[]): number {
  const emptyTiles = boardState.reduce<number[]>((acc, tileState, index) => {
    if (tileState === ' ') {
      acc.push(index);
    }
    return acc;
  }, []);
  return emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
}

export function pickNextMoveOnBoardForPlayer(board: TileState[], player: PlayerId) {
  const boardState: BoardState = {
    board,
    player,
    move: 0,
    victoryState: 'none',
    children: [],
  };

  let move = pickMove(boardState);
  if (move === undefined || move === -1) {
    // failed to find a move.  sad.  just randomly pick a move
    move = pickRandomEmptyTile(board);
  }

  return move;
}
