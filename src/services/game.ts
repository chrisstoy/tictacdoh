import { BoardState, PlayerId, TileState } from '../types';

export function determineWinner(boardState: TileState[]): PlayerId | 'none' {
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
      boardState[a] &&
      boardState[a] === boardState[b] &&
      boardState[a] === boardState[c]
    ) {
      return boardState[a] ?? 'none';
    }
  }
  if (!boardState.includes(undefined)) {
    return 'none';
  }
  return 'none';
}

export function solveBoard(
  boardState: BoardState,
  turn: PlayerId,
  player: PlayerId
): BoardState {
  const winner = determineWinner(boardState.board);
  if (winner !== 'none') {
    return {
      ...boardState,
      victoryState: winner === player ? 'win' : 'lose',
    };
  }

  // create list of all possible moves
  const possibleMoves = boardState.board.reduce<BoardState[]>(
    (acc, tileState, index) => {
      if (tileState === undefined) {
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

export function pickMove(
  board: BoardState,
  player: PlayerId
): number | undefined {
  if (board.victoryState === 'none') {
    return undefined;
  }

  const possibleMoves = board.children
    .filter((child) => child.victoryState === 'none')
    .map((child) => child.move);

  if (possibleMoves.length === 0) {
    return -1;
  }
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}
