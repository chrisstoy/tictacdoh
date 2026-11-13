import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { createOnlineSession, joinOnlineSession } from '@/services/online';
import { isOnlineSetupAvailable } from '@/services/online/onlineSetupGate';
import { SetupGameScreen } from '../SetupGameScreen';

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-reanimated/mock');
});

jest.mock('@/animations/jiggleAnim', () => ({
  createJiggleAnim: (done: () => void) => {
    done();
    return 0;
  },
}));

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

jest.mock('@/services/online/onlineSetupGate', () => ({
  isOnlineSetupAvailable: jest.fn(() => false),
}));

jest.mock('@/services/online', () => {
  const actual = jest.requireActual('@/services/online');
  return {
    ...actual,
    createOnlineSession: jest.fn(),
    joinOnlineSession: jest.fn(),
  };
});

const mockedGate = isOnlineSetupAvailable as jest.Mock;
const mockedCreate = createOnlineSession as jest.Mock;
const mockedJoin = joinOnlineSession as jest.Mock;

describe('SetupGameScreen online entry', () => {
  beforeEach(() => {
    mockedGate.mockReturnValue(false);
    mockedCreate.mockReset();
    mockedJoin.mockReset();
  });

  it('hides Online Create/Join when online setup is unavailable', () => {
    const view = render(
      <SetupGameScreen onStartGame={jest.fn()} onOptions={jest.fn()} onEnterLobby={jest.fn()} />
    );

    expect(view.queryByLabelText('Online Create')).toBeNull();
    expect(view.queryByLabelText('Online Join')).toBeNull();
    expect(view.queryByTestId('online-setup-panel')).toBeNull();
  });

  it('shows Online Create/Join when available and create enters lobby', async () => {
    mockedGate.mockReturnValue(true);
    mockedCreate.mockResolvedValue({ code: 'ABCD12', inviteUrl: 'https://mp.example/join/ABCD12' });
    const onEnterLobby = jest.fn();

    const view = render(
      <SetupGameScreen onStartGame={jest.fn()} onOptions={jest.fn()} onEnterLobby={onEnterLobby} />
    );

    expect(view.getByLabelText('Online Create')).toBeTruthy();
    expect(view.getByLabelText('Online Join')).toBeTruthy();

    fireEvent.press(view.getByLabelText('Online Create'));

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalled();
      expect(onEnterLobby).toHaveBeenCalledTimes(1);
    });
  });

  it('join flow validates code then enters lobby', async () => {
    mockedGate.mockReturnValue(true);
    mockedJoin.mockResolvedValue(undefined);
    const onEnterLobby = jest.fn();

    const view = render(
      <SetupGameScreen onStartGame={jest.fn()} onOptions={jest.fn()} onEnterLobby={onEnterLobby} />
    );

    fireEvent.press(view.getByLabelText('Online Join'));
    fireEvent.changeText(view.getByLabelText('Room code'), 'ab12cd');
    fireEvent.press(view.getByLabelText('Join room'));

    await waitFor(() => {
      expect(mockedJoin).toHaveBeenCalledWith('AB12CD');
      expect(onEnterLobby).toHaveBeenCalledTimes(1);
    });
  });

  it('shows an error when join code is invalid', () => {
    mockedGate.mockReturnValue(true);
    const view = render(
      <SetupGameScreen onStartGame={jest.fn()} onOptions={jest.fn()} onEnterLobby={jest.fn()} />
    );

    fireEvent.press(view.getByLabelText('Online Join'));
    fireEvent.changeText(view.getByLabelText('Room code'), 'ab');
    fireEvent.press(view.getByLabelText('Join room'));

    expect(mockedJoin).not.toHaveBeenCalled();
    expect(view.getByText(/valid 6-character/i)).toBeTruthy();
  });
});
