import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { leaveOnlineSession, useOnlineSessionStore } from '@/services/online';
import { shareOnlineInvite } from '@/services/online/shareInvite';
import { OnlineLobbyScreen } from '../OnlineLobbyScreen';

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
  shareOnlineInvite: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/services/online', () => {
  const actual = jest.requireActual('@/services/online');
  return {
    ...actual,
    leaveOnlineSession: jest.fn(() => Promise.resolve()),
  };
});

const mockedShare = shareOnlineInvite as jest.Mock;
const mockedLeave = leaveOnlineSession as jest.Mock;

describe('OnlineLobbyScreen', () => {
  beforeEach(() => {
    mockedShare.mockClear();
    mockedLeave.mockClear();
    useOnlineSessionStore.getState().reset();
    useOnlineSessionStore.setState({
      status: 'connected',
      roomCode: 'ABCD12',
      inviteUrl: 'https://mp.example.com/join/ABCD12',
      hostConnected: true,
      guestConnected: false,
    });
  });

  it('shows room code and waiting copy until both seats connect', () => {
    const view = render(
      <OnlineLobbyScreen onReadyToPlay={jest.fn()} onLeave={jest.fn()} />
    );

    expect(view.getByTestId('lobby-room-code')).toHaveTextContent('ABCD12');
    expect(view.getByTestId('lobby-waiting')).toHaveTextContent(/Waiting for opponent/i);
  });

  it('shares invite text via shareOnlineInvite', () => {
    const view = render(
      <OnlineLobbyScreen onReadyToPlay={jest.fn()} onLeave={jest.fn()} />
    );

    fireEvent.press(view.getByLabelText('Share invite'));
    expect(mockedShare).toHaveBeenCalledWith({
      code: 'ABCD12',
      inviteUrl: 'https://mp.example.com/join/ABCD12',
    });
  });

  it('advances to play when both host and guest are connected', async () => {
    const onReadyToPlay = jest.fn();
    render(<OnlineLobbyScreen onReadyToPlay={onReadyToPlay} onLeave={jest.fn()} />);

    act(() => {
      useOnlineSessionStore.setState({ guestConnected: true });
    });

    await waitFor(() => {
      expect(onReadyToPlay).toHaveBeenCalled();
    });
  });

  it('leaves the session and returns on Cancel', async () => {
    const onLeave = jest.fn();
    const view = render(<OnlineLobbyScreen onReadyToPlay={jest.fn()} onLeave={onLeave} />);

    fireEvent.press(view.getByLabelText('Leave lobby'));

    await waitFor(() => {
      expect(mockedLeave).toHaveBeenCalled();
      expect(onLeave).toHaveBeenCalled();
    });
  });
});
