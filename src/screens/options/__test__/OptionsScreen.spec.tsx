import { fireEvent, render } from '@testing-library/react-native';
import { OptionsScreen } from '../OptionsScreen';

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-reanimated/mock');
});

// The real push animation calls onPress when it finishes; run it right away.
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

jest.mock('@/services/appVersion', () => ({ useAppVersion: () => 'v9.9 (123)' }));

describe('OptionsScreen', () => {
  it('shows the app version at the bottom, below the Return button', () => {
    const view = render(<OptionsScreen onExit={jest.fn()} />);

    expect(view.getByTestId('app-version')).toHaveTextContent('v9.9 (123)');
    const order = view.toJSON();
    expect(JSON.stringify(order).indexOf('app-version')).toBeGreaterThan(
      JSON.stringify(order).indexOf('Return')
    );
  });

  it('still lists the toggles and exits when Return is pressed', () => {
    const onExit = jest.fn();
    const view = render(<OptionsScreen onExit={onExit} />);

    expect(view.getByText('Auto-Play')).toBeTruthy();
    expect(view.getByText('Sound')).toBeTruthy();
    expect(view.getByText('Music')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Return'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
