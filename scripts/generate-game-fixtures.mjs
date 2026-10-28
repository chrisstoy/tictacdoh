/**
 * Regenerates test-fixtures/game-cases.json from a line-by-line copy of
 * src/services/game.ts. src/services/__test__/gameFixtures.spec.ts checks the
 * real TypeScript against the file this writes. If the two disagree, fix this
 * script and the Swift port together.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function determineWinner(board) {
  let x = 0;
  let o = 0;
  for (const tile of board) {
    if (tile === 'X') x += 1;
    else if (tile === 'O') o += 1;
  }
  if (x < 3 && o < 3) return undefined;

  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] !== ' ' && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a], line };
    }
  }
  return undefined;
}

function solveBoard(boardState, turn, player) {
  const winner = determineWinner(boardState.board);
  if (winner) {
    return {
      ...boardState,
      victoryState: winner.player === player ? 'win' : 'lose',
      children: [],
    };
  }

  const possibleMoves = [];
  boardState.board.forEach((tileState, index) => {
    if (tileState === ' ') {
      const newBoard = [...boardState.board];
      newBoard[index] = turn;
      possibleMoves.push({
        board: newBoard,
        player: turn,
        move: index,
        victoryState: 'none',
        children: [],
      });
    }
  });

  if (possibleMoves.length === 0) {
    return { ...boardState, victoryState: 'draw', children: [] };
  }

  const nextTurn = turn === 'X' ? 'O' : 'X';
  return {
    ...boardState,
    victoryState: 'none',
    children: possibleMoves.map((move) => solveBoard(move, nextTurn, player)),
  };
}

function unique(values) {
  return [...new Set(values)];
}

function immediateMoves(children, victoryState) {
  return unique(
    children.filter((child) => child.victoryState === victoryState).map((child) => child.move)
  );
}

/**
 * Every index pickMove can return for this board and player.
 * Empty result means pickMove returns undefined.
 */
function expectedMoves(board, player) {
  if (!board.some((tile) => tile !== ' ')) {
    return board.map((_, index) => index);
  }

  const solved = solveBoard(
    { board, player, move: 0, victoryState: 'none', children: [] },
    player,
    player
  );
  const wins = immediateMoves(solved.children, 'win');
  if (wins.length > 0) return wins;

  const blocks = [];
  for (const child of solved.children) {
    blocks.push(...immediateMoves(child.children, 'lose'));
  }
  if (blocks.length > 0) return unique(blocks);

  return immediateMoves(solved.children, 'none');
}

function expectedBlockMoves(board, player) {
  const solved = solveBoard(
    { board, player, move: 0, victoryState: 'none', children: [] },
    player,
    player
  );
  const blocks = [];
  for (const child of solved.children) {
    blocks.push(...immediateMoves(child.children, 'lose'));
  }
  return unique(blocks);
}

function expectedImmediateWinMoves(board, player) {
  const solved = solveBoard(
    { board, player, move: 0, victoryState: 'none', children: [] },
    player,
    player
  );
  return immediateMoves(solved.children, 'win');
}

const named = [
  ['empty', [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '], 'X'],
  ['win-index-2', ['X', 'X', ' ', ' ', 'O', ' ', 'O', 'X', 'O'], 'X'],
  ['win-index-3', ['X', 'O', ' ', ' ', 'O', 'X', 'X', ' ', 'O'], 'X'],
  ['win-index-7', ['X', 'O', ' ', 'O', 'O', ' ', 'X', ' ', 'X'], 'X'],
  ['block-index-2', ['X', ' ', ' ', 'X', 'O', ' ', 'O', 'X', 'O'], 'X'],
  ['block-index-0-as-o', [' ', 'X', 'O', 'X', 'O', ' ', 'X', 'O', 'X'], 'O'],
  ['block-index-0-as-o-2', [' ', 'X', 'X', 'X', 'O', 'O', 'O', 'X', ' '], 'O'],
  ['single-x-corner', ['X', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '], 'O'],
  ['x-top-row', ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'], 'O'],
  ['o-left-col', ['O', ' ', ' ', 'O', 'X', ' ', 'O', ' ', 'X'], 'X'],
  ['draw', ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'X'], 'X'],
  ['x-can-win-or-block', ['X', 'X', ' ', 'O', 'O', ' ', ' ', ' ', ' '], 'X'],
];

const cases = named.map(([id, board, turn]) => {
  const winner = determineWinner(board);
  const draw = !winner && !board.includes(' ');
  return {
    id,
    board,
    turn,
    expectedWinner: winner?.player ?? null,
    expectedLine: winner?.line ?? null,
    expectedDraw: draw,
    expectedImmediateWinMoves: expectedImmediateWinMoves(board, turn),
    expectedBlockMoves: expectedBlockMoves(board, turn),
    expectedMoves: expectedMoves(board, turn),
  };
});

const locked = {
  'win-index-2': [2],
  'win-index-3': [3],
  'win-index-7': [7],
  'block-index-2': [2],
  'block-index-0-as-o': [0],
  'block-index-0-as-o-2': [0],
  'x-can-win-or-block': [2],
  empty: [0, 1, 2, 3, 4, 5, 6, 7, 8],
};

for (const [id, moves] of Object.entries(locked)) {
  const found = cases.find((entry) => entry.id === id);
  const actual = found.expectedMoves.join(',');
  const wanted = moves.join(',');
  if (actual !== wanted) {
    throw new Error(`${id}: expected moves ${wanted}, generator produced ${actual}`);
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'test-fixtures', 'game-cases.json');
mkdirSync(join(root, 'test-fixtures'), { recursive: true });
writeFileSync(out, `${JSON.stringify({ cases }, null, 2)}\n`);
console.log(`wrote ${cases.length} cases to ${out}`);
