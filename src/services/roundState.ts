import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { PlayerId, TileState, Winner } from '../types';
import { determineWinner } from './game';
import { withZustandDevtools } from './zustandDevtools';

type RoundActions = {
  initNewRound(): void;
  applyMove(index: number, player: PlayerId): void;
};

type RoundState = {
  boardState: TileState[];
  turn: PlayerId;
  winner: Winner | undefined;
  isDraw: boolean;
};

export const useRoundStore = create<RoundState & RoundActions>()(
  withZustandDevtools(
    (set, get) => ({
      boardState: Array(9).fill(' '),
      turn: 'X',
      winner: undefined,
      isDraw: false,

      // actions
      initNewRound() {
        set({
          boardState: Array(9).fill(' '),
          turn: 'X',
          winner: undefined,
          isDraw: false,
        });
      },

      applyMove(tileIndex: number, player: PlayerId) {
        const curState = get();

        // Validation
        if (selectIsGameOver(curState)) {
          console.warn('Cannot apply move: game is over');
          return;
        }

        if (tileIndex < 0 || tileIndex >= 9) {
          console.warn('Invalid tile index:', tileIndex);
          return;
        }

        if (curState.boardState[tileIndex] !== ' ') {
          console.warn('Tile already occupied:', tileIndex);
          return;
        }

        set((state) => {
          const newBoardState = [...state.boardState];
          newBoardState[tileIndex] = player;

          const winner = determineWinner(newBoardState);
          const isDraw = !winner && !newBoardState.includes(' ');
          const nextTurn = winner || isDraw ? state.turn : state.turn === 'X' ? 'O' : 'X';

          return {
            boardState: newBoardState,
            winner,
            isDraw,
            turn: nextTurn,
          };
        });
      },
    }),
    {
      name: 'RoundStore',
    }
  )
);

/** State Selectors */
export const selectBoardState = (state: RoundState) => state.boardState;
export const selectTurn = (state: RoundState) => state.turn;
export const selectWinner = (state: RoundState) => state.winner;
export const selectIsDraw = (state: RoundState) => state.isDraw;

/** Complex Selectors */
export const selectIsPlayerTurn = (player: PlayerId) => (state: RoundState) =>
  state.turn === player;

export const selectIsGameOver = (state: RoundState) => !!state.winner || state.isDraw;

/** Action Selectors */
export const useRoundActions = () =>
  useRoundStore(
    useShallow((s) => ({
      applyMove: s.applyMove,
      initNewRound: s.initNewRound,
    }))
  );
