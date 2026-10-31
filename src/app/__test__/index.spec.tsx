import { fireEvent, render } from '@testing-library/react-native';
import { useAudioService } from '@/services/audioService';
import Index from '../index';

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

jest.mock('@/components/PWAInstallPrompt', () => ({
  PWAInstallPrompt: () => null,
}));

jest.mock('@/screens/setup/SetupGameScreen', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text } = require('react-native');
  return {
    SetupGameScreen: ({ onStartGame }: { onStartGame: () => void }) => (
      <Pressable accessibilityLabel="Start match" onPress={onStartGame}>
        <Text>setup screen</Text>
      </Pressable>
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
  const { Text } = require('react-native');
  return {
    OptionsScreen: () => <Text>options screen</Text>,
  };
});

describe('Index', () => {
  beforeEach(() => {
    useAudioService().playMusic.mockClear();
    useAudioService().stopMusic.mockClear();
    useAudioService().playSound.mockClear();
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
});
