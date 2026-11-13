import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import {
  leaveOnlineSession,
  sendMove,
  sendNextRound,
  sendRematch,
  useOnlineSessionStore,
} from '@/services/online';
import { applySyncToLocalStores } from '@/services/online/applySync';
import type { RoomSnapshot } from '@/services/online/protocol';
import { useMatchStore } from '@/services/matchState';
import { useRoundStore } from '@/services/roundState';
import { PlayGameScreen } from '../PlayGameScreen';

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-reanimated/mock');
});

jest.mock('@/animations/pushAnim', () => ({
  createPushAnim: (done: () => void) => {
    done();
    return 1;
  },
}));

jest.mock('@/services/audioService', () => ({
  useAudioService: () => ({ playSound: jest.fn(), playMusic: jest.fn(), stopMusic: jest.fn() }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/online/shareInvite', () => ({
  buildInviteShareText: jest.fn(() => ''),
  shareOnlineInvite: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/services/online', () => {
  const actual = jest.requireActual('@/services/online');
  return {
    ...actual,
    sendMove: jest.fn(),
    sendNextRound: jest.fn(),
    sendRematch: jest.fn(),
    leaveOnlineSession: jest.fn(() => Promise.resolve()),
  };
});

const mockedSendMove = sendMove as jest.Mock;
const mockedSendNextRound = sendNextRound as jest.Mock;
const mockedSendRematch = sendRematch as jest.Mock;
const mockedLeave = leaveOnlineSession as jest.Mock;

function snapshot(overrides: Partial<RoomSnapshot> = {}): RoomSnapshot {
  return {
    code: 'ABCD12',
    phase: 'PLAYING',
    roundsInMatch: 3,
    board: Array(9).fill(' '),
    turn: 'X',
    roundWinner: undefined,
    isDraw: false,
    rounds: [],
    matchWinner: undefined,
    hostConnected: true,
    guestConnected: true,
    reclaimDeadlineMs: null,
    forfeitedBy: undefined,
    ...overrides,
  };
}

function enterOnlinePlay(seat: 'X' | 'O' = 'X', snap: RoomSnapshot = snapshot()) {
  useOnlineSessionStore.setState({
    status: 'connected',
    seat,
    roomCode: snap.code,
    hostConnected: snap.hostConnected,
    guestConnected: snap.guestConnected,
    reclaimDeadlineMs: snap.reclaimDeadlineMs,
    lastSnapshot: snap,
  });
  applySyncToLocalStores(snap);
}

describe('PlayGameScreen online', () => {
  beforeEach(() => {
    mockedSendMove.mockClear();
    mockedSendNextRound.mockClear();
    mockedSendRematch.mockClear();
    mockedLeave.mockClear();
    useOnlineSessionStore.getState().reset();
    useMatchStore.getState().initNewMatch();
    useRoundStore.getState().initNewRound();
  });

  it('sends move on my turn when PLAYING and applies opponent move via sync', () => {
    enterOnlinePlay('X');
    const onExitGame = jest.fn();
    const view = render(<PlayGameScreen onExitGame={onExitGame} />);

    fireEvent.press(view.getByTestId('tile-4'));
    expect(mockedSendMove).toHaveBeenCalledWith(4);
    // Authoritative: board still empty until sync
    expect(useRoundStore.getState().boardState[4]).toBe(' ');

    act(() => {
      const next = snapshot({
        board: [' ', ' ', ' ', ' ', 'X', ' ', ' ', ' ', ' '],
        turn: 'O',
      });
      useOnlineSessionStore.getState().applySync(next);
      applySyncToLocalStores(next);
    });

    expect(useRoundStore.getState().boardState[4]).toBe('X');
    expect(useRoundStore.getState().turn).toBe('O');
  });

  it('does not send move when it is the opponent turn', () => {
    enterOnlinePlay(
      'O',
      snapshot({
        turn: 'X',
        board: Array(9).fill(' '),
      })
    );
    const view = render(<PlayGameScreen onExitGame={jest.fn()} />);

    fireEvent.press(view.getByTestId('tile-0'));
    expect(mockedSendMove).not.toHaveBeenCalled();
  });

  it('sends nextRound and rematch; quit leaves the room', async () => {
    enterOnlinePlay(
      'X',
      snapshot({
        phase: 'ROUND_OVER',
        isDraw: true,
        board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'],
      })
    );
    const onExitGame = jest.fn();
    const view = render(<PlayGameScreen onExitGame={onExitGame} />);

    fireEvent.press(view.getByLabelText('Next round'));
    expect(mockedSendNextRound).toHaveBeenCalled();

    act(() => {
      const matchOver = snapshot({
        phase: 'MATCH_OVER',
        matchWinner: 'X',
        rounds: [{ winner: { player: 'X', line: [0, 1, 2] } }],
      });
      useOnlineSessionStore.getState().applySync(matchOver);
      applySyncToLocalStores(matchOver);
    });

    fireEvent.press(view.getByLabelText('Play again'));
    expect(mockedSendRematch).toHaveBeenCalled();

    fireEvent.press(view.getByLabelText('Quit game'));
    await waitFor(() => {
      expect(mockedLeave).toHaveBeenCalled();
      expect(onExitGame).toHaveBeenCalled();
    });
  });

  it('shows opponent disconnected overlay and clears on reconnect', () => {
    const deadline = Date.now() + 30_000;
    enterOnlinePlay(
      'X',
      snapshot({
        guestConnected: false,
        reclaimDeadlineMs: deadline,
      })
    );
    useOnlineSessionStore.setState({
      status: 'disconnected',
      guestConnected: false,
      reclaimDeadlineMs: deadline,
    });

    const view = render(<PlayGameScreen onExitGame={jest.fn()} />);
    expect(view.getByTestId('opponent-disconnected-overlay')).toBeTruthy();
    expect(view.getByText(/Opponent disconnected/i)).toBeTruthy();

    act(() => {
      const reconnected = snapshot({ guestConnected: true, reclaimDeadlineMs: null });
      useOnlineSessionStore.getState().applySync(reconnected);
      applySyncToLocalStores(reconnected);
    });

    expect(view.queryByTestId('opponent-disconnected-overlay')).toBeNull();
  });

  it('does not run CPU moves in an online match', () => {
    jest.useFakeTimers();
    enterOnlinePlay(
      'X',
      snapshot({
        turn: 'O',
        board: ['X', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      })
    );
    // Even if CPU flags were wrongly set, online must not auto-move
    useMatchStore.setState({ isCPU: { X: false, O: true } });

    render(<PlayGameScreen onExitGame={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockedSendMove).not.toHaveBeenCalled();
    expect(useRoundStore.getState().boardState.filter((t) => t !== ' ').length).toBe(1);
    jest.useRealTimers();
  });
});
