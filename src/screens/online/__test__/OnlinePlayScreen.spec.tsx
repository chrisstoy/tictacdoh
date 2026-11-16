import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { createOnlineSession, joinOnlineSession } from '@/services/online';
import { OnlinePlayScreen } from '../OnlinePlayScreen';

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

jest.mock('@/services/online', () => {
  const actual = jest.requireActual('@/services/online');
  return {
    ...actual,
    createOnlineSession: jest.fn(),
    joinOnlineSession: jest.fn(),
  };
});

const mockedCreate = createOnlineSession as jest.Mock;
const mockedJoin = joinOnlineSession as jest.Mock;

describe('OnlinePlayScreen', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    mockedCreate.mockReset();
    mockedJoin.mockReset();
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('creates a room and enters the lobby', async () => {
    mockedCreate.mockResolvedValue({ code: 'ABCD12', inviteUrl: 'https://mp.example/join/ABCD12' });
    const onEnterLobby = jest.fn();

    const view = render(<OnlinePlayScreen onEnterLobby={onEnterLobby} onBack={jest.fn()} />);

    expect(view.getByRole('header')).toHaveStyle({
      fontFamily: 'PoppinsBlack',
      color: '#f06c1c',
      fontSize: 56,
    });
    expect(view.getByLabelText('Create Game')).toBeTruthy();
    expect(view.getByLabelText('Join Game')).toBeTruthy();

    fireEvent.press(view.getByLabelText('Create Game'));

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalled();
      expect(onEnterLobby).toHaveBeenCalledTimes(1);
    });
  });

  it('join flow validates code then enters lobby', async () => {
    mockedJoin.mockResolvedValue(undefined);
    const onEnterLobby = jest.fn();

    const view = render(<OnlinePlayScreen onEnterLobby={onEnterLobby} onBack={jest.fn()} />);

    fireEvent.press(view.getByLabelText('Join Game'));
    expect(view.getByLabelText('Room code')).toHaveStyle({ fontFamily: 'Komigo' });
    fireEvent.changeText(view.getByLabelText('Room code'), 'ab12cd');
    fireEvent.press(view.getByLabelText('Join room'));

    await waitFor(() => {
      expect(mockedJoin).toHaveBeenCalledWith('AB12CD');
      expect(onEnterLobby).toHaveBeenCalledTimes(1);
    });
  });

  it('tells the user the game is not available when the room cannot be joined', async () => {
    mockedJoin.mockRejectedValue(new Error('The game is not available'));
    const onEnterLobby = jest.fn();
    const view = render(<OnlinePlayScreen onEnterLobby={onEnterLobby} onBack={jest.fn()} />);

    fireEvent.press(view.getByLabelText('Join Game'));
    fireEvent.changeText(view.getByLabelText('Room code'), 'ABCD12');
    fireEvent.press(view.getByLabelText('Join room'));

    await waitFor(() => {
      expect(view.getByText('The game is not available')).toBeTruthy();
    });
    expect(onEnterLobby).not.toHaveBeenCalled();
  });

  it('shows an error when join code is invalid', () => {
    const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={jest.fn()} />);

    fireEvent.press(view.getByLabelText('Join Game'));
    fireEvent.changeText(view.getByLabelText('Room code'), 'ab');
    fireEvent.press(view.getByLabelText('Join room'));

    expect(mockedJoin).not.toHaveBeenCalled();
    expect(view.getByText(/valid 6-character/i)).toBeTruthy();
  });

  it('keeps the orange fill inside a dark outline on web', () => {
    Platform.OS = 'web';

    const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={jest.fn()} />);
    const style = JSON.stringify(view.getByRole('header').props.style);

    expect(style).toContain('#f06c1c');
    expect(style).toContain('8px #582008');
    expect(style).toContain('stroke fill');
  });

  it('goes back to the menu', () => {
    const onBack = jest.fn();
    const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={onBack} />);

    fireEvent.press(view.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
