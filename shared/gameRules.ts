import type { PlayerId, RoundResult, TileState, Winner } from './types';

export const INFINITE_ROUNDS = -1;
export const AVAILABLE_ROUNDS_IN_MATCH = [3, 5, 7, 9, INFINITE_ROUNDS] as const;

export const WINNING_LINES: readonly (readonly number[])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function emptyBoard(): TileState[] {
  return [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];
}

export function isValidRoundsInMatch(roundsInMatch: number): boolean {
  return (AVAILABLE_ROUNDS_IN_MATCH as readonly number[]).includes(roundsInMatch);
}

export function determineWinner(boardState: TileState[]): Winner | undefined {
  const { X, O } = boardState.reduce(
    (acc, tileState) => {
      if (tileState === 'X') {
        acc.X += 1;
      } else if (tileState === 'O') {
        acc.O += 1;
      }
      return acc;
    },
    { X: 0, O: 0 }
  );
  if (X < 3 && O < 3) {
    return undefined;
  }

  for (let i = 0; i < WINNING_LINES.length; i++) {
    const line = WINNING_LINES[i];
    const [a, b, c] = line;
    if (
      boardState[a] !== ' ' &&
      boardState[a] === boardState[b] &&
      boardState[a] === boardState[c]
    ) {
      return {
        player: boardState[a] as PlayerId,
        line: [...line],
      };
    }
  }
  return undefined;
}

export function isDraw(boardState: TileState[]): boolean {
  return !determineWinner(boardState) && !boardState.includes(' ');
}

export function isValidMove(
  boardState: TileState[],
  index: number,
  player: PlayerId
): boolean {
  if (!Number.isInteger(index) || index < 0 || index > 8) {
    return false;
  }
  if (boardState[index] !== ' ') {
    return false;
  }
  if (determineWinner(boardState) || isDraw(boardState)) {
    return false;
  }
  // player arg reserved for callers that already know whose turn it is
  void player;
  return true;
}

export function applyMove(
  boardState: TileState[],
  index: number,
  player: PlayerId
): TileState[] {
  if (!isValidMove(boardState, index, player)) {
    throw new Error('Invalid move');
  }
  const next = [...boardState];
  next[index] = player;
  return next;
}

const countRoundsWonBy = (rounds: RoundResult[], player: PlayerId) =>
  rounds.filter((round) => round.winner?.player === player).length;

/** Same majority / tie-break rules as matchState.recordRound. */
export function matchWinnerAfterRounds(
  rounds: RoundResult[],
  roundsInMatch: number
): PlayerId | undefined {
  if (roundsInMatch === INFINITE_ROUNDS) {
    return undefined;
  }

  const roundsNeededToWin = Math.ceil(roundsInMatch / 2);
  const xWins = countRoundsWonBy(rounds, 'X');
  const oWins = countRoundsWonBy(rounds, 'O');

  let matchWinner: PlayerId | undefined =
    xWins >= roundsNeededToWin ? 'X' : oWins >= roundsNeededToWin ? 'O' : undefined;

  if (matchWinner === undefined && rounds.length >= roundsInMatch) {
    matchWinner = xWins > oWins ? 'X' : oWins > xWins ? 'O' : undefined;
  }

  return matchWinner;
}
