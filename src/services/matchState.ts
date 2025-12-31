import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { PlayerId, RoundData } from '../types';
import { withZustandDevtools } from './zustandDevtools';

export const INFINITE_ROUNDS = -1;
export const AVAILABLE_ROUNDS_IN_MATCH = [3, 5, 7, 9, INFINITE_ROUNDS];
export type PlayMode = 'SETUP_MATCH' | 'SETUP_ROUND' | 'PLAYING' | 'ROUND_OVER' | 'MATCH_OVER';

const countRoundsWonBy = (rounds: RoundData[], player: PlayerId) =>
  rounds.filter((round) => round.winner?.player === player).length;

type MatchActions = {
  initNewMatch(): void;
  setPlayerIsCPU(player: PlayerId, isCPU: boolean): void;
  setRoundsInMatch(roundsInMatch: number): void;
  recordRound(round: RoundData): void;
  setPlayMode(playMode: PlayMode): void;
};

type MatchState = {
  isCPU: Record<PlayerId, boolean>;
  roundsInMatch: number;
  rounds: RoundData[];
  winner: PlayerId | undefined;

  playMode: PlayMode;
};

export const useMatchStore = create<MatchState & MatchActions>()(
  withZustandDevtools(
    (set, get) => ({
      isCPU: {
        X: false,
        O: false,
      },
      roundsInMatch: 3,
      rounds: [],
      winner: undefined,

      playMode: 'SETUP_MATCH',

      // actions
      initNewMatch() {
        set({
          rounds: [],
          winner: undefined,
        });
      },

      setPlayerIsCPU(player: PlayerId, isCPU: boolean) {
        set((state) => ({ isCPU: { ...state.isCPU, [player]: isCPU } }));
      },

      setRoundsInMatch(roundsInMatch: number) {
        set({ roundsInMatch });
      },

      setPlayMode(playMode: PlayMode) {
        set({ playMode });
      },

      recordRound(round: RoundData) {
        const curState = get();

        if (curState.winner !== undefined) {
          console.warn('Cannot record round: match already has a winner');
          return;
        }

        if (
          curState.roundsInMatch !== INFINITE_ROUNDS &&
          curState.rounds.length >= curState.roundsInMatch
        ) {
          console.warn('Cannot record round: max rounds reached');
          return;
        }

        set((state) => {
          const newRounds = [...state.rounds, round];
          const roundsNeededToWin = Math.ceil(state.roundsInMatch / 2);

          // Calculate if match is over and who won
          const matchWinner: PlayerId | undefined =
            state.roundsInMatch === INFINITE_ROUNDS
              ? undefined
              : countRoundsWonBy(newRounds, 'X') >= roundsNeededToWin
                ? 'X'
                : countRoundsWonBy(newRounds, 'O') >= roundsNeededToWin
                  ? 'O'
                  : undefined;

          return {
            rounds: newRounds,
            winner: matchWinner,
          };
        });
      },
    }),
    {
      name: 'MatchStore',
    }
  )
);

/** State Selectors */
export const selectRoundsInMatch = (state: MatchState) => state.roundsInMatch;
export const selectRounds = (state: MatchState) => state.rounds;
export const selectMatchWinner = (state: MatchState) => state.winner;
export const selectPlayMode = (state: MatchState) => state.playMode;

/** Complex Selectors */
export const selectNumberOfRoundsPlayed = (state: MatchState) => selectRounds(state).length;

export const selectRoundsWonByPlayer = (player: PlayerId) => (state: MatchState) =>
  countRoundsWonBy(selectRounds(state), player);

export const selectIsPlayerCPU = (player: PlayerId) => (state: MatchState) => state.isCPU[player];

export const selectIsMatchOver = (state: MatchState) => {
  const roundsInMatch = selectRoundsInMatch(state);
  const matchHasWinner = !!selectMatchWinner(state);
  const playedMaxRounds = selectNumberOfRoundsPlayed(state) >= roundsInMatch;
  const matchOver = roundsInMatch !== INFINITE_ROUNDS && (matchHasWinner || playedMaxRounds);
  return matchOver;
};

/** Action Selectors */
export const useMatchActions = () =>
  useMatchStore(
    useShallow((s) => ({
      initNewMatch: s.initNewMatch,
      recordRound: s.recordRound,
      setPlayerIsCPU: s.setPlayerIsCPU,
      setRoundsInMatch: s.setRoundsInMatch,
      setPlayMode: s.setPlayMode,
    }))
  );
