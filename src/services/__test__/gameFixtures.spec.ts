import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BoardState, PlayerId, TileState } from '../../types';
import { determineWinner, pickMove } from '../game';

type FixtureCase = {
  id: string;
  board: TileState[];
  turn: PlayerId;
  expectedWinner: PlayerId | null;
  expectedLine: number[] | null;
  expectedDraw: boolean;
  expectedImmediateWinMoves: number[];
  expectedBlockMoves: number[];
  expectedMoves: number[];
};

const fixtures = JSON.parse(
  readFileSync(join(__dirname, '../../../test-fixtures/game-cases.json'), 'utf8')
) as { cases: FixtureCase[] };

function asBoard(entry: FixtureCase): BoardState {
  return {
    board: entry.board,
    player: entry.turn,
    move: 0,
    victoryState: 'none',
    children: [],
  };
}

describe('shared game fixtures', () => {
  it('loads at least the locked pickMove cases', () => {
    expect(fixtures.cases.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'empty',
        'win-index-2',
        'win-index-3',
        'win-index-7',
        'block-index-2',
        'block-index-0-as-o',
        'block-index-0-as-o-2',
      ])
    );
  });

  it.each(fixtures.cases)('$id matches determineWinner and pickMove', (entry) => {
    const winner = determineWinner(entry.board);
    if (entry.expectedWinner) {
      expect(winner?.player).toBe(entry.expectedWinner);
      expect(winner?.line).toEqual(entry.expectedLine);
    } else {
      expect(winner).toBeUndefined();
    }

    const board = asBoard(entry);
    if (entry.expectedMoves.length === 0) {
      expect(pickMove(board)).toBeUndefined();
      return;
    }

    for (let trial = 0; trial < 40; trial += 1) {
      expect(entry.expectedMoves).toContain(pickMove(board));
    }
  });
});
