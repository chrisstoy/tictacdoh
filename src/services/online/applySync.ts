import type { RoundData } from '@/types';
import { type PlayMode, useMatchStore } from '../matchState';
import { useOptionsStore } from '../optionsState';
import { useRoundStore } from '../roundState';
import type { PlayPhase, RoomSnapshot } from './protocol';

export function playPhaseToPlayMode(phase: PlayPhase): PlayMode {
  switch (phase) {
    case 'WAITING':
      return 'SETUP_ROUND';
    case 'PLAYING':
      return 'PLAYING';
    case 'ROUND_OVER':
      return 'ROUND_OVER';
    case 'MATCH_OVER':
    case 'CLOSED':
      return 'MATCH_OVER';
  }
}

/**
 * Authoritative hydration from a Worker RoomSnapshot into local match/round stores.
 * Does not replay applyMove/recordRound — the server already computed winners.
 */
export function applySyncToLocalStores(snapshot: RoomSnapshot): void {
  const rounds: RoundData[] = snapshot.rounds.map((r) => ({
    boardState: Array(9).fill(' ') as RoundData['boardState'],
    winner: r.winner,
  }));

  useMatchStore.setState({
    isCPU: { X: false, O: false },
    roundsInMatch: snapshot.roundsInMatch,
    rounds,
    winner: snapshot.matchWinner,
    playMode: playPhaseToPlayMode(snapshot.phase),
  });

  useRoundStore.setState({
    boardState: [...snapshot.board],
    turn: snapshot.turn,
    winner: snapshot.roundWinner,
    isDraw: snapshot.isDraw,
  });

  // Use the action so AsyncStorage persistence stays in sync with optionsState.
  useOptionsStore.getState().setAutoReplay(false);
}
