import { create } from 'zustand';
import { PlayerId, TileState } from '../types';
import { determineWinner } from './game';

export interface GameState {
  boardState: TileState[];
  turn: PlayerId;
  winner: PlayerId | 'none';
  isDraw: boolean;

  reset(): void;

  setBoardState(boardState: TileState[]): void;
  setTurn(turn: PlayerId): void;
  setWinner(winner: PlayerId | 'none'): void;
  setIsDraw(isDraw: boolean): void;

  setTileState(index: number, owner: PlayerId | undefined): void;
}

export const useGameStore = create<GameState>()((set) => ({
  boardState: [],
  turn: 'X',
  winner: 'none',
  isDraw: false,

  reset() {
    set({
      boardState: new Array(9).fill(undefined),
      turn: 'X',
      winner: 'none',
      isDraw: false,
    });
  },

  setBoardState: (boardState: TileState[]) => set({ boardState }),
  setTurn: (turn: 'X' | 'O') => set({ turn }),
  setWinner: (winner: 'X' | 'O' | 'none') => set({ winner }),
  setIsDraw: (isDraw: boolean) => set({ isDraw }),

  setTileState(index: number, owner: PlayerId | undefined) {
    const newBoardState = [...this.boardState];
    newBoardState[index] = owner;
    this.setBoardState(newBoardState);

    const winner = determineWinner(newBoardState);
    if (winner !== 'none') {
      this.setWinner(winner);
    } else if (!newBoardState.includes(undefined)) {
      this.setIsDraw(true);
    }
  },
}));
