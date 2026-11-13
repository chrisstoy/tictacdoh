/** RN-free shared types for app + multiplayer Worker. */

export type PlayerId = 'X' | 'O';
export type TileState = PlayerId | ' ';

export interface Winner {
  player: PlayerId;
  line: number[];
}

export type RoundResult = {
  boardState?: TileState[];
  winner: Winner | undefined;
};
