import { fireEvent, render } from '@testing-library/react-native';
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

const mockedGate = isOnlineSetupAvailable as jest.Mock;

describe('SetupGameScreen online entry', () => {
  beforeEach(() => {
    mockedGate.mockReturnValue(false);
  });

  it('hides Play Online when online setup is unavailable', () => {
    const view = render(
      <SetupGameScreen onStartGame={jest.fn()} onOptions={jest.fn()} onPlayOnline={jest.fn()} />
    );

    expect(view.queryByLabelText('Play Online')).toBeNull();
    expect(view.queryByLabelText('Create Game')).toBeNull();
    expect(view.queryByLabelText('Join Game')).toBeNull();
  });

  it('shows Play Online and leaves create/join off this screen', () => {
    mockedGate.mockReturnValue(true);
    const onPlayOnline = jest.fn();

    const view = render(
      <SetupGameScreen onStartGame={jest.fn()} onOptions={jest.fn()} onPlayOnline={onPlayOnline} />
    );

    expect(view.queryByLabelText('Create Game')).toBeNull();
    expect(view.queryByLabelText('Join Game')).toBeNull();
    fireEvent.press(view.getByLabelText('Play Online'));
    expect(onPlayOnline).toHaveBeenCalledTimes(1);
  });
});
