export type PlayerId = 'X' | 'O';
export type TileState = PlayerId | undefined;

export interface BoardState {
  board: TileState[]; // the current state of the board
  player: PlayerId; // who made the move on this board
  move: number; // the location the player made the move
  victoryState: 'win' | 'lose' | 'draw' | 'none'; // is this board a win, lose, or draw
  victoryLines?: number[]; // if this board is a win, what lines did it win on
  children: BoardState[]; // all possible boards resulting from this move
}
