import { create } from 'zustand';
import { PlayerId, TileState } from '../types';
import { Winner, determineWinner } from './game';

export interface GameState {
  boardState: TileState[];
  turn: PlayerId;
  winner: Winner | undefined;
  isDraw: boolean;

  reset(): void;

  setBoardState(boardState: TileState[]): void;
  setTurn(turn: PlayerId): void;
  setWinner(winner: Winner | undefined): void;
  setIsDraw(isDraw: boolean): void;

  setTileState(index: number, owner: PlayerId | undefined): void;
}

export const useGameStore = create<GameState>()((set) => ({
  boardState: [],
  turn: 'X',
  winner: undefined,
  isDraw: false,

  reset() {
    set({
      boardState: new Array(9).fill(undefined),
      turn: 'X',
      winner: undefined,
      isDraw: false,
    });
  },

  setBoardState: (boardState: TileState[]) => set({ boardState }),
  setTurn: (turn: 'X' | 'O') => set({ turn }),
  setWinner: (winner: Winner | undefined) => set({ winner }),
  setIsDraw: (isDraw: boolean) => set({ isDraw }),

  setTileState(index: number, owner: PlayerId | undefined) {
    const newBoardState = [...this.boardState];
    newBoardState[index] = owner;
    this.setBoardState(newBoardState);

    const winner = determineWinner(newBoardState);
    if (winner) {
      this.setWinner(winner);
    } else if (!newBoardState.includes(undefined)) {
      this.setIsDraw(true);
    }
  },
}));
