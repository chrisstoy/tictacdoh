import { BoardState, PlayerId, TileState } from '../types';

export interface Winner {
  player: PlayerId;
  line: number[];
}

export function determineWinner(boardState: TileState[]): Winner | undefined {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (
      boardState[a] !== ' ' &&
      boardState[a] === boardState[b] &&
      boardState[a] === boardState[c]
    ) {
      return {
        player: boardState[a] as PlayerId,
        line: lines[i],
      };
    }
  }
  if (!boardState.includes(' ')) {
    return undefined;
  }
  return undefined;
}

export function solveBoard(
  boardState: BoardState,
  turn: PlayerId,
  player: PlayerId
): BoardState {
  const winner = determineWinner(boardState.board);
  if (winner) {
    return {
      ...boardState,
      victoryState: winner.player === player ? 'win' : 'lose',
    };
  }

  // create list of all possible moves
  const possibleMoves = boardState.board.reduce<BoardState[]>(
    (acc, tileState, index) => {
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
    },
    []
  );

  // no possible moves, so the board is a draw
  if (possibleMoves.length === 0) {
    return {
      ...boardState,
      victoryState: 'draw',
    };
  }

  const nextTurn = turn === 'X' ? 'O' : 'X';
  const children = possibleMoves.map((move) =>
    solveBoard(move, nextTurn, player)
  );
  return {
    ...boardState,
    victoryState: 'none',
    children,
  };
}

const randomItem = <T>(arr: T[]) =>
  arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined;

const pickMoveForState =
  (state: BoardState['victoryState']) => (children: BoardState[]) => {
    const moves = children
      .filter((child) => child.victoryState === state)
      .map((child) => child.move);
    return randomItem(moves);
  };

const pickWinningMove = pickMoveForState('win');
const pickLosingMove = pickMoveForState('lose');

export function pickMove(board: BoardState): number | undefined {
  if (board.victoryState !== 'none') {
    return undefined;
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
