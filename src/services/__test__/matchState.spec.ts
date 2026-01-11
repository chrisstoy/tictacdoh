import { RoundData } from '../../types';
import {
  INFINITE_ROUNDS,
  selectIsMatchOver,
  selectIsPlayerCPU,
  selectMatchWinner,
  selectNumberOfRoundsPlayed,
  selectRounds,
  selectRoundsInMatch,
  selectRoundsWonByPlayer,
  useMatchStore,
} from '../matchState';

describe('matchState', () => {
  beforeEach(() => {
    // Reset the store completely before each test
    useMatchStore.setState({
      isCPU: { X: false, O: false },
      roundsInMatch: 3,
      rounds: [],
      winner: undefined,
    });
  });

  describe('Initial State', () => {
    it('should have correct default values', () => {
      const state = useMatchStore.getState();

      expect(state.isCPU).toEqual({ X: false, O: false });
      expect(state.roundsInMatch).toBe(3);
      expect(state.rounds).toEqual([]);
      expect(state.winner).toBeUndefined();
    });
  });

  describe('Selectors', () => {
    describe('selectRoundsInMatch', () => {
      it('should return the roundsInMatch value', () => {
        const state = useMatchStore.getState();
        expect(selectRoundsInMatch(state)).toBe(3);

        useMatchStore.setState({ roundsInMatch: 7 });
        const newState = useMatchStore.getState();
        expect(selectRoundsInMatch(newState)).toBe(7);
      });
    });

    describe('selectRounds', () => {
      it('should return the rounds array', () => {
        const state = useMatchStore.getState();
        expect(selectRounds(state)).toEqual([]);

        const rounds: RoundData[] = [
          {
            boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
            winner: { player: 'X', line: [0, 1, 2] },
          },
        ];
        useMatchStore.setState({ rounds });
        const newState = useMatchStore.getState();
        expect(selectRounds(newState)).toEqual(rounds);
      });
    });

    describe('selectMatchWinner', () => {
      it('should return the match winner', () => {
        const state = useMatchStore.getState();
        expect(selectMatchWinner(state)).toBeUndefined();

        useMatchStore.setState({ winner: 'X' });
        const newState = useMatchStore.getState();
        expect(selectMatchWinner(newState)).toBe('X');
      });
    });

    describe('selectCurrentRound', () => {
      it('should return 1 when no rounds have been played', () => {
        const state = useMatchStore.getState();
        expect(selectNumberOfRoundsPlayed(state)).toBe(0);
      });

      it('should return the correct round number based on completed rounds', () => {
        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        expect(selectNumberOfRoundsPlayed(useMatchStore.getState())).toBe(1);

        useMatchStore.getState().recordRound({
          boardState: ['O', 'O', 'O', ' ', 'X', ' ', 'X', ' ', 'X'],
          winner: { player: 'O', line: [0, 1, 2] },
        });
        expect(selectNumberOfRoundsPlayed(useMatchStore.getState())).toBe(2);
      });
    });

    describe('selectRoundsWonByPlayer', () => {
      it('should count rounds won by each player correctly', () => {
        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        let state = useMatchStore.getState();
        expect(selectRoundsWonByPlayer('X')(state)).toBe(1);
        expect(selectRoundsWonByPlayer('O')(state)).toBe(0);

        useMatchStore.getState().recordRound({
          boardState: ['O', 'O', 'O', ' ', 'X', ' ', 'X', ' ', 'X'],
          winner: { player: 'O', line: [0, 1, 2] },
        });
        state = useMatchStore.getState();
        expect(selectRoundsWonByPlayer('X')(state)).toBe(1);
        expect(selectRoundsWonByPlayer('O')(state)).toBe(1);
      });

      it('should not count draws as wins', () => {
        useMatchStore.getState().recordRound({
          boardState: ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'X'],
          winner: undefined, // draw
        });

        const state = useMatchStore.getState();
        expect(selectRoundsWonByPlayer('X')(state)).toBe(0);
        expect(selectRoundsWonByPlayer('O')(state)).toBe(0);
      });
    });

    describe('selectIsPlayerCPU', () => {
      it('should return correct CPU status for players', () => {
        let state = useMatchStore.getState();
        expect(selectIsPlayerCPU('X')(state)).toBe(false);
        expect(selectIsPlayerCPU('O')(state)).toBe(false);

        useMatchStore.getState().setPlayerIsCPU('X', true);
        state = useMatchStore.getState();
        expect(selectIsPlayerCPU('X')(state)).toBe(true);
        expect(selectIsPlayerCPU('O')(state)).toBe(false);

        useMatchStore.getState().setPlayerIsCPU('O', true);
        state = useMatchStore.getState();
        expect(selectIsPlayerCPU('X')(state)).toBe(true);
        expect(selectIsPlayerCPU('O')(state)).toBe(true);
      });
    });

    describe('selectIsMatchOver', () => {
      it('should return false when match just started', () => {
        const state = useMatchStore.getState();
        expect(selectIsMatchOver(state)).toBe(false);
      });

      it('should return false for infinite rounds mode', () => {
        useMatchStore.getState().setRoundsInMatch(INFINITE_ROUNDS);

        // Record many rounds
        for (let i = 0; i < 10; i++) {
          useMatchStore.getState().recordRound({
            boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
            winner: { player: 'X', line: [0, 1, 2] },
          });
        }

        expect(selectIsMatchOver(useMatchStore.getState())).toBe(false);
      });

      it('should return true when a player wins majority in best-of-3', () => {
        useMatchStore.getState().setRoundsInMatch(3);

        // X wins 2 rounds (majority of 3)
        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        expect(selectIsMatchOver(useMatchStore.getState())).toBe(false);

        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', 'O', 'O', ' ', ' ', ' ', ' '],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        const state = useMatchStore.getState();
        expect(selectIsMatchOver(state)).toBe(true);
        expect(state.winner).toBe('X');
      });

      it('should return true when a player wins majority in best-of-5', () => {
        useMatchStore.getState().setRoundsInMatch(5);

        // X wins 3 rounds (majority of 5)
        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        useMatchStore.getState().recordRound({
          boardState: ['O', 'O', 'O', ' ', 'X', ' ', 'X', ' ', 'X'],
          winner: { player: 'O', line: [0, 1, 2] },
        });
        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', 'O', 'O', ' ', ' ', ' ', ' '],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        expect(selectIsMatchOver(useMatchStore.getState())).toBe(false);

        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', 'O', 'O', ' ', ' ', ' ', ' '],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        const state = useMatchStore.getState();
        expect(selectIsMatchOver(state)).toBe(true);
        expect(state.winner).toBe('X');
      });

      it('should return true when all rounds are played', () => {
        useMatchStore.getState().setRoundsInMatch(3);

        useMatchStore.getState().recordRound({
          boardState: ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'X'],
          winner: undefined, // draw
        });
        useMatchStore.getState().recordRound({
          boardState: ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'X'],
          winner: undefined, // draw
        });
        expect(selectIsMatchOver(useMatchStore.getState())).toBe(false);

        useMatchStore.getState().recordRound({
          boardState: ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'X'],
          winner: undefined, // draw
        });
        expect(selectIsMatchOver(useMatchStore.getState())).toBe(true);
      });
    });
  });

  describe('Actions', () => {
    describe('initNewMatch', () => {
      it('should reset rounds and winner', () => {
        // Set up some state
        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', 'O', 'O', ' ', ' ', ' ', ' '],
          winner: { player: 'X', line: [0, 1, 2] },
        });

        let state = useMatchStore.getState();
        expect(state.rounds.length).toBe(2);
        expect(state.winner).toBe('X');

        // Reset match
        useMatchStore.getState().initNewMatch();

        state = useMatchStore.getState();
        expect(state.rounds).toEqual([]);
        expect(state.winner).toBeUndefined();
      });

      it('should not reset player CPU settings', () => {
        useMatchStore.getState().setPlayerIsCPU('X', true);
        useMatchStore.getState().setPlayerIsCPU('O', true);

        useMatchStore.getState().initNewMatch();

        const state = useMatchStore.getState();
        expect(selectIsPlayerCPU('X')(state)).toBe(true);
        expect(selectIsPlayerCPU('O')(state)).toBe(true);
      });

      it('should not reset roundsInMatch setting', () => {
        useMatchStore.getState().setRoundsInMatch(7);
        useMatchStore.getState().initNewMatch();

        const state = useMatchStore.getState();
        expect(state.roundsInMatch).toBe(7);
      });
    });

    describe('recordRound', () => {
      it('should add a round to the rounds array', () => {
        const round: RoundData = {
          boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
          winner: { player: 'X', line: [0, 1, 2] },
        };

        useMatchStore.getState().recordRound(round);

        const state = useMatchStore.getState();
        expect(state.rounds.length).toBe(1);
        expect(state.rounds[0]).toEqual(round);
      });

      it('should calculate match winner when majority is reached', () => {
        useMatchStore.getState().setRoundsInMatch(3);

        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        expect(useMatchStore.getState().winner).toBeUndefined();

        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', 'O', 'O', ' ', ' ', ' ', ' '],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        expect(useMatchStore.getState().winner).toBe('X');
      });

      it('should not set winner in infinite rounds mode', () => {
        useMatchStore.getState().setRoundsInMatch(INFINITE_ROUNDS);

        for (let i = 0; i < 10; i++) {
          useMatchStore.getState().recordRound({
            boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
            winner: { player: 'X', line: [0, 1, 2] },
          });
        }

        expect(useMatchStore.getState().winner).toBeUndefined();
      });

      it('should not record round when match already has a winner', () => {
        useMatchStore.getState().setRoundsInMatch(3);

        // Win 2 rounds to get a winner
        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', 'O', 'O', ' ', ' ', ' ', ' '],
          winner: { player: 'X', line: [0, 1, 2] },
        });

        let state = useMatchStore.getState();
        expect(state.rounds.length).toBe(2);
        expect(state.winner).toBe('X');

        // Try to record another round
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        useMatchStore.getState().recordRound({
          boardState: ['O', 'O', 'O', ' ', 'X', ' ', 'X', ' ', 'X'],
          winner: { player: 'O', line: [0, 1, 2] },
        });

        expect(consoleSpy).toHaveBeenCalledWith('Cannot record round: match already has a winner');
        state = useMatchStore.getState();
        expect(state.rounds.length).toBe(2); // Should not have added the round
        consoleSpy.mockRestore();
      });

      it('should not record round when max rounds reached', () => {
        useMatchStore.getState().setRoundsInMatch(3);

        // Record 3 draws
        for (let i = 0; i < 3; i++) {
          useMatchStore.getState().recordRound({
            boardState: ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'X'],
            winner: undefined, // draw
          });
        }

        let state = useMatchStore.getState();
        expect(state.rounds.length).toBe(3);

        // Try to record another round
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
          winner: { player: 'X', line: [0, 1, 2] },
        });

        expect(consoleSpy).toHaveBeenCalledWith('Cannot record round: max rounds reached');
        state = useMatchStore.getState();
        expect(state.rounds.length).toBe(3); // Should not have added the round
        consoleSpy.mockRestore();
      });

      it('should correctly determine winner in best-of-7 scenario', () => {
        useMatchStore.getState().setRoundsInMatch(7);

        // Need 4 wins to win best-of-7
        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        expect(useMatchStore.getState().winner).toBeUndefined();

        useMatchStore.getState().recordRound({
          boardState: ['O', 'O', 'O', ' ', 'X', ' ', 'X', ' ', 'X'],
          winner: { player: 'O', line: [0, 1, 2] },
        });
        expect(useMatchStore.getState().winner).toBeUndefined();

        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', 'O', 'O', ' ', ' ', ' ', ' '],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        expect(useMatchStore.getState().winner).toBeUndefined();

        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', 'O', 'O', ' ', ' ', ' ', ' '],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        expect(useMatchStore.getState().winner).toBeUndefined();

        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', 'O', 'O', ' ', ' ', ' ', ' '],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        expect(useMatchStore.getState().winner).toBe('X'); // X has 4 wins
      });

      it('should handle O winning the match', () => {
        useMatchStore.getState().setRoundsInMatch(3);

        useMatchStore.getState().recordRound({
          boardState: ['O', 'O', 'O', ' ', 'X', ' ', 'X', ' ', 'X'],
          winner: { player: 'O', line: [0, 1, 2] },
        });
        useMatchStore.getState().recordRound({
          boardState: ['O', 'O', 'O', 'X', 'X', ' ', ' ', ' ', ' '],
          winner: { player: 'O', line: [0, 1, 2] },
        });

        expect(useMatchStore.getState().winner).toBe('O');
      });

      it('should declare player with most wins as winner when all rounds are played without reaching majority', () => {
        useMatchStore.getState().setRoundsInMatch(5);

        // X wins 2 rounds
        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
          winner: { player: 'X', line: [0, 1, 2] },
        });
        useMatchStore.getState().recordRound({
          boardState: ['X', 'X', 'X', 'O', 'O', ' ', ' ', ' ', ' '],
          winner: { player: 'X', line: [0, 1, 2] },
        });

        // O wins 1 round
        useMatchStore.getState().recordRound({
          boardState: ['O', 'O', 'O', ' ', 'X', ' ', 'X', ' ', 'X'],
          winner: { player: 'O', line: [0, 1, 2] },
        });

        // Two draws
        useMatchStore.getState().recordRound({
          boardState: ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'X'],
          winner: undefined, // draw
        });
        expect(useMatchStore.getState().winner).toBeUndefined();

        useMatchStore.getState().recordRound({
          boardState: ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'X'],
          winner: undefined, // draw
        });

        // After all 5 rounds, X has 2 wins, O has 1 win, 2 draws
        // X should be declared the winner
        const state = useMatchStore.getState();
        expect(state.rounds.length).toBe(5);
        expect(state.winner).toBe('X');
      });
    });

    describe('setPlayerIsCPU', () => {
      it('should update CPU status for a player', () => {
        let state = useMatchStore.getState();
        expect(state.isCPU).toEqual({ X: false, O: false });

        useMatchStore.getState().setPlayerIsCPU('X', true);
        state = useMatchStore.getState();
        expect(state.isCPU).toEqual({ X: true, O: false });

        useMatchStore.getState().setPlayerIsCPU('O', true);
        state = useMatchStore.getState();
        expect(state.isCPU).toEqual({ X: true, O: true });

        useMatchStore.getState().setPlayerIsCPU('X', false);
        state = useMatchStore.getState();
        expect(state.isCPU).toEqual({ X: false, O: true });
      });
    });

    describe('setRoundsInMatch', () => {
      it('should update the rounds in match setting', () => {
        let state = useMatchStore.getState();
        expect(state.roundsInMatch).toBe(3);

        useMatchStore.getState().setRoundsInMatch(5);
        state = useMatchStore.getState();
        expect(state.roundsInMatch).toBe(5);

        useMatchStore.getState().setRoundsInMatch(INFINITE_ROUNDS);
        state = useMatchStore.getState();
        expect(state.roundsInMatch).toBe(INFINITE_ROUNDS);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle match with all draws', () => {
      useMatchStore.getState().setRoundsInMatch(3);

      for (let i = 0; i < 3; i++) {
        useMatchStore.getState().recordRound({
          boardState: ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'X'],
          winner: undefined, // draw
        });
      }

      const state = useMatchStore.getState();
      expect(state.rounds.length).toBe(3);
      expect(state.winner).toBeUndefined();
      expect(selectIsMatchOver(state)).toBe(true);
    });

    it('should handle alternating wins without clear majority until end', () => {
      useMatchStore.getState().setRoundsInMatch(5);

      useMatchStore.getState().recordRound({
        boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
        winner: { player: 'X', line: [0, 1, 2] },
      });
      useMatchStore.getState().recordRound({
        boardState: ['O', 'O', 'O', ' ', 'X', ' ', 'X', ' ', 'X'],
        winner: { player: 'O', line: [0, 1, 2] },
      });
      useMatchStore.getState().recordRound({
        boardState: ['X', 'X', 'X', 'O', 'O', ' ', ' ', ' ', ' '],
        winner: { player: 'X', line: [0, 1, 2] },
      });
      useMatchStore.getState().recordRound({
        boardState: ['O', 'O', 'O', 'X', 'X', ' ', ' ', ' ', ' '],
        winner: { player: 'O', line: [0, 1, 2] },
      });

      let state = useMatchStore.getState();
      expect(state.winner).toBeUndefined();
      expect(selectIsMatchOver(state)).toBe(false);

      useMatchStore.getState().recordRound({
        boardState: ['X', 'X', 'X', 'O', 'O', ' ', ' ', ' ', ' '],
        winner: { player: 'X', line: [0, 1, 2] },
      });

      state = useMatchStore.getState();
      expect(state.winner).toBe('X'); // X has 3 wins
      expect(selectIsMatchOver(state)).toBe(true);
    });

    it('should handle early termination correctly', () => {
      useMatchStore.getState().setRoundsInMatch(5);

      // X wins 3 times in a row - should end match early
      useMatchStore.getState().recordRound({
        boardState: ['X', 'X', 'X', ' ', 'O', ' ', 'O', ' ', 'O'],
        winner: { player: 'X', line: [0, 1, 2] },
      });
      useMatchStore.getState().recordRound({
        boardState: ['X', 'X', 'X', 'O', 'O', ' ', ' ', ' ', ' '],
        winner: { player: 'X', line: [0, 1, 2] },
      });
      useMatchStore.getState().recordRound({
        boardState: ['X', 'X', 'X', 'O', 'O', ' ', ' ', ' ', ' '],
        winner: { player: 'X', line: [0, 1, 2] },
      });

      const state = useMatchStore.getState();
      expect(state.winner).toBe('X');
      expect(selectIsMatchOver(state)).toBe(true);
      expect(state.rounds.length).toBe(3); // Only 3 rounds played, not all 5
    });
  });
});
