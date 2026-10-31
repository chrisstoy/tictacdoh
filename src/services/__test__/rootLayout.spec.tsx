import { render } from '@testing-library/react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import RootLayout from '../../app/_layout';

jest.mock('../../app/globals.css', () => ({}));
jest.mock('@/assets/fonts/komigo-font/Komigo3DRegular-rg1lK.ttf', () => 1);
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaProvider: View, SafeAreaView: View };
});
jest.mock('expo-font', () => ({ useFonts: jest.fn(() => [false, null]) }));
jest.mock('expo-router', () => {
  const { Text: MockText } = jest.requireActual('react-native');
  return { Slot: () => <MockText>slot content</MockText> };
});
jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn() }));
jest.mock('@/services/audioService', () => ({
  AudioServiceProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/services/nativeStatusBar', () => ({ applyNativeStatusBar: jest.fn() }));
jest.mock('@/services/registerServiceWorker', () => ({ registerServiceWorker: jest.fn() }));

const mockedUseFonts = useFonts as jest.Mock;

describe('RootLayout', () => {
  beforeEach(() => {
    mockedUseFonts.mockReturnValue([false, null]);
    (SplashScreen.hideAsync as jest.Mock).mockClear();
  });

  // The static export prerenders the full tree (expo-font reports loaded on the
  // server). Returning null while the font loads makes the first client render
  // differ from that HTML: React error #418 on hydration.
  it('renders the route before the font has loaded so hydration matches the prerender', () => {
    const { getByText } = render(<RootLayout>{null}</RootLayout>);

    expect(getByText('slot content')).toBeTruthy();
  });

  it('keeps the splash up until the font loads', () => {
    render(<RootLayout>{null}</RootLayout>);

    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it.each([
    ['loaded', [true, null]],
    ['failed', [false, new Error('font failed')]],
  ])('hides the splash once the font has %s', (_label, result) => {
    mockedUseFonts.mockReturnValue(result);
    render(<RootLayout>{null}</RootLayout>);

    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });
});
