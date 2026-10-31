import { render } from '@testing-library/react-native';
import RootLayout from '../_layout';

jest.mock('../globals.css', () => ({}));
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

describe('RootLayout', () => {
  // The static export prerenders the full tree (expo-font reports loaded on the
  // server). Returning null while the font loads makes the first client render
  // differ from that HTML: React error #418 on hydration.
  it('renders the route before the font has loaded so hydration matches the prerender', () => {
    const { getByText } = render(<RootLayout>{null}</RootLayout>);

    expect(getByText('slot content')).toBeTruthy();
  });
});
