import { create } from 'zustand';
import { PlayerId, TileState } from '../types';
import { Winner, determineWinner } from './game';

export interface GameState {
  boardState: TileState[];
  turn: PlayerId;
  winner: Winner | undefined;
  isDraw: boolean;
  isCPU: Record<PlayerId, boolean>;
  stats: {
    wins: Record<PlayerId, number>;
    totalGames: number;
  };
  autoReplay: boolean;

  initNewGame(): void;
  setIsCPU(player: PlayerId, isCPU: boolean): void;
  setBoardState(boardState: TileState[]): void;
  setTurn(turn: PlayerId): void;
  setWinner(winner: Winner | undefined): void;
  setIsDraw(isDraw: boolean): void;

  setTileState(index: number, owner: PlayerId | undefined): void;
  isGameOver(): boolean;

  setAutoReplay(autoReplay: boolean): void;

  setState(state: GameState): void;
}

export const useGameStore = create<GameState>()((set) => ({
  boardState: [],
  turn: 'X',
  winner: undefined,
  isDraw: false,
  isCPU: {
    X: false,
    O: false,
  },
  stats: {
    wins: {
      X: 0,
      O: 0,
    },
    totalGames: 0,
  },
  autoReplay: false,

  setState(state: GameState) {
    set(state);
  },

  initNewGame() {
    set({
      boardState: new Array<TileState>(9).fill(' '),
      turn: 'X',
      winner: undefined,
      isDraw: false,
    });
  },

  setIsCPU: (player: PlayerId, isCPU: boolean): void => {
    set({ isCPU: { ...useGameStore.getState().isCPU, [player]: isCPU } });
  },

  setBoardState: (boardState: TileState[]) => set({ boardState }),
  setTurn: (turn: 'X' | 'O') => set({ turn }),
  setWinner: (winner: Winner | undefined) => {
    const stats: GameState['stats'] = { ...useGameStore.getState().stats };
    stats.totalGames = stats.totalGames + 1;
    if (winner) {
      stats.wins[winner.player] = stats.wins[winner.player] + 1;
    }
    return set({
      winner,
      stats,
    });
  },
  setIsDraw: (isDraw: boolean) => {
    const stats: GameState['stats'] = { ...useGameStore.getState().stats };
    stats.totalGames = stats.totalGames + 1;

    return set({ isDraw, stats });
  },

  setTileState(index: number, owner: PlayerId | undefined) {
    const newBoardState = [...this.boardState];
    newBoardState[index] = owner ?? ' ';
    this.setBoardState(newBoardState);

    const winner = determineWinner(newBoardState);
    if (winner) {
      this.setWinner(winner);
    } else if (!newBoardState.includes(' ')) {
      this.setIsDraw(true);
    }
  },

  setAutoReplay(autoReplay: boolean) {
    set({ autoReplay });
  },

  isGameOver() {
    return !!this.winner || this.isDraw;
  },
}));

export interface PreviousGameStates {
  previousStates: GameState[];

  push(state: GameState): void;
  pop(): GameState | undefined;
  clear(): void;
}

export const usePreviousGameStates = create<PreviousGameStates>((set) => ({
  previousStates: [],
  push(state: GameState) {
    set({
      previousStates: [
        ...usePreviousGameStates.getState().previousStates,
        state,
      ],
    });
  },
  clear() {
    set({ previousStates: [] });
  },

  pop() {
    if (this.previousStates.length === 0) return undefined;
    const lastState = this.previousStates[this.previousStates.length - 1];
    set({
      previousStates: usePreviousGameStates
        .getState()
        .previousStates.slice(0, -1),
    });
    return lastState;
  },
}));
