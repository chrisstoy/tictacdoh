import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useAudioService } from '@/services/audioService';
import { acceptDeepLinkJoin, startDeepLinkListener } from '@/services/online';
import Index from '../../../app/index';

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.useReducedMotion = jest.fn(() => false);
  Reanimated.withRepeat = jest.fn((animation: unknown) => animation);
  return Reanimated;
});

jest.mock('@/services/audioService', () => {
  const playMusic = jest.fn();
  const stopMusic = jest.fn();
  const playSound = jest.fn();
  return {
    useAudioService: () => ({ playMusic, stopMusic, playSound }),
  };
});

jest.mock('@/services/online', () => ({
  acceptDeepLinkJoin: jest.fn(() => Promise.resolve()),
  startDeepLinkListener: jest.fn(() => Promise.resolve(() => undefined)),
}));

jest.mock('@/services/online/sessionStore', () => ({
  useOnlineSessionStore: {
    getState: () => ({ applyError: jest.fn() }),
  },
}));

const mockedStartDeepLinkListener = startDeepLinkListener as jest.Mock;
const mockedAcceptDeepLinkJoin = acceptDeepLinkJoin as jest.Mock;

jest.mock('@/components/PWAInstallPrompt', () => ({
  PWAInstallPrompt: () => null,
}));

jest.mock('@/screens/setup/SetupGameScreen', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text, View } = require('react-native');
  return {
    SetupGameScreen: ({
      onStartGame,
      onOptions,
      onEnterLobby,
    }: {
      onStartGame: () => void;
      onOptions?: () => void;
      onEnterLobby?: () => void;
    }) => (
      <View>
        <Pressable accessibilityLabel="Start match" onPress={onStartGame}>
          <Text>setup screen</Text>
        </Pressable>
        {onOptions ? (
          <Pressable accessibilityLabel="Open options" onPress={onOptions}>
            <Text>open options</Text>
          </Pressable>
        ) : null}
        {onEnterLobby ? (
          <Pressable accessibilityLabel="Enter lobby" onPress={onEnterLobby}>
            <Text>enter lobby</Text>
          </Pressable>
        ) : null}
      </View>
    ),
  };
});

jest.mock('@/screens/play/PlayGameScreen', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text } = require('react-native');
  return {
    PlayGameScreen: ({ onExitGame }: { onExitGame: () => void }) => (
      <Pressable accessibilityLabel="Quit match" onPress={onExitGame}>
        <Text>play screen</Text>
      </Pressable>
    ),
  };
});

jest.mock('@/screens/options/OptionsScreen', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text } = require('react-native');
  return {
    OptionsScreen: ({ onExit }: { onExit: () => void }) => (
      <Pressable accessibilityLabel="Exit options" onPress={onExit}>
        <Text>options screen</Text>
      </Pressable>
    ),
  };
});

jest.mock('@/screens/lobby/OnlineLobbyScreen', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text, View } = require('react-native');
  return {
    OnlineLobbyScreen: ({
      onReadyToPlay,
      onLeave,
    }: {
      onReadyToPlay: () => void;
      onLeave: () => void;
    }) => (
      <View>
        <Text>lobby screen</Text>
        <Pressable accessibilityLabel="Ready to play" onPress={onReadyToPlay}>
          <Text>ready</Text>
        </Pressable>
        <Pressable accessibilityLabel="Leave lobby" onPress={onLeave}>
          <Text>leave lobby</Text>
        </Pressable>
      </View>
    ),
  };
});

describe('Index', () => {
  beforeEach(() => {
    (useAudioService().playMusic as jest.Mock).mockClear();
    (useAudioService().stopMusic as jest.Mock).mockClear();
    (useAudioService().playSound as jest.Mock).mockClear();
    mockedAcceptDeepLinkJoin.mockClear();
    mockedAcceptDeepLinkJoin.mockResolvedValue(undefined);
    mockedStartDeepLinkListener.mockReset();
    mockedStartDeepLinkListener.mockResolvedValue(() => undefined);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts on the title screen and requests looping setup music', () => {
    const view = render(<Index />);

    expect(view.getByLabelText('Play')).toBeTruthy();
    expect(view.queryByText('setup screen')).toBeNull();
    expect(useAudioService().playMusic).toHaveBeenCalledWith('setup', { loop: true });
  });

  it('opens setup from Play and keeps requesting setup music', () => {
    const view = render(<Index />);

    fireEvent.press(view.getByLabelText('Play'));

    expect(view.getByText('setup screen')).toBeTruthy();
    expect(view.queryByLabelText('Play')).toBeNull();
    expect(useAudioService().playMusic).toHaveBeenLastCalledWith('setup', { loop: true });
  });

  it('does not stop or restart setup music when moving among title, setup, and options', () => {
    const playMusic = useAudioService().playMusic as jest.Mock;
    const stopMusic = useAudioService().stopMusic as jest.Mock;
    const view = render(<Index />);

    expect(playMusic).toHaveBeenCalledTimes(1);
    expect(playMusic).toHaveBeenCalledWith('setup', { loop: true });

    fireEvent.press(view.getByLabelText('Play'));
    expect(view.getByText('setup screen')).toBeTruthy();
    expect(stopMusic).not.toHaveBeenCalled();
    expect(playMusic).toHaveBeenCalledTimes(1);

    fireEvent.press(view.getByLabelText('Open options'));
    expect(view.getByText('options screen')).toBeTruthy();
    expect(stopMusic).not.toHaveBeenCalled();
    expect(playMusic).toHaveBeenCalledTimes(1);

    fireEvent.press(view.getByLabelText('Exit options'));
    expect(view.getByText('setup screen')).toBeTruthy();
    expect(stopMusic).not.toHaveBeenCalled();
    expect(playMusic).toHaveBeenCalledTimes(1);
  });

  it('does not stop or restart setup music when entering the lobby from setup', () => {
    const playMusic = useAudioService().playMusic as jest.Mock;
    const stopMusic = useAudioService().stopMusic as jest.Mock;
    const view = render(<Index />);

    fireEvent.press(view.getByLabelText('Play'));
    playMusic.mockClear();
    stopMusic.mockClear();

    fireEvent.press(view.getByLabelText('Enter lobby'));
    expect(view.getByText('lobby screen')).toBeTruthy();
    expect(stopMusic).not.toHaveBeenCalled();
    expect(playMusic).not.toHaveBeenCalled();
  });

  it('returns to setup, not the title, when a match is quit', () => {
    const view = render(<Index />);

    fireEvent.press(view.getByLabelText('Play'));
    fireEvent.press(view.getByLabelText('Start match'));
    expect(view.getByText('play screen')).toBeTruthy();
    expect(useAudioService().stopMusic).toHaveBeenCalled();

    fireEvent.press(view.getByLabelText('Quit match'));

    expect(view.getByText('setup screen')).toBeTruthy();
    expect(view.queryByLabelText('Play')).toBeNull();
    expect(useAudioService().playMusic).toHaveBeenLastCalledWith('setup', { loop: true });
  });

  it('routes setup → lobby → play and lobby cancel back to setup', () => {
    const view = render(<Index />);

    fireEvent.press(view.getByLabelText('Play'));
    fireEvent.press(view.getByLabelText('Enter lobby'));
    expect(view.getByText('lobby screen')).toBeTruthy();
    expect(useAudioService().playMusic).toHaveBeenLastCalledWith('setup', { loop: true });

    fireEvent.press(view.getByLabelText('Ready to play'));
    expect(view.getByText('play screen')).toBeTruthy();
    expect(useAudioService().stopMusic).toHaveBeenCalled();

    fireEvent.press(view.getByLabelText('Quit match'));
    fireEvent.press(view.getByLabelText('Enter lobby'));
    fireEvent.press(view.getByLabelText('Leave lobby'));
    expect(view.getByText('setup screen')).toBeTruthy();
  });

  it('joins from a deep-link code and opens the lobby', async () => {
    let onJoinCode: ((code: string) => void) | undefined;
    mockedStartDeepLinkListener.mockImplementation(async ({ onJoinCode: handler }) => {
      onJoinCode = handler;
      return () => undefined;
    });

    const view = render(<Index />);
    await waitFor(() => expect(onJoinCode).toBeDefined());

    await act(async () => {
      onJoinCode?.('ABCD12');
    });

    await waitFor(() => {
      expect(mockedAcceptDeepLinkJoin).toHaveBeenCalledWith('ABCD12');
      expect(view.getByText('lobby screen')).toBeTruthy();
    });
  });
});
