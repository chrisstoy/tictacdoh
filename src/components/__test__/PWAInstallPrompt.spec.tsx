import { act, render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { isNativeShell } from '@/services/nativeShell';
import { PWAInstallPrompt } from '../PWAInstallPrompt';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@/services/nativeShell', () => ({
  isNativeShell: jest.fn(),
}));

const mockedIsNativeShell = isNativeShell as jest.Mock;

function installWindowEvents() {
  const listeners = new Map<string, Set<EventListener>>();

  window.addEventListener = ((type: string, listener: EventListener) => {
    const set = listeners.get(type) ?? new Set<EventListener>();
    set.add(listener);
    listeners.set(type, set);
  }) as typeof window.addEventListener;

  window.removeEventListener = ((type: string, listener: EventListener) => {
    listeners.get(type)?.delete(listener);
  }) as typeof window.removeEventListener;

  window.dispatchEvent = ((event: Event) => {
    listeners.get(event.type)?.forEach((listener) => listener(event));
    return true;
  }) as typeof window.dispatchEvent;

  return listeners;
}

describe('PWAInstallPrompt', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.useFakeTimers();
    mockedIsNativeShell.mockReset();
    Platform.OS = 'web';
  });

  afterEach(() => {
    jest.useRealTimers();
    Platform.OS = originalOS;
  });

  it('renders nothing and does not listen for install events in the native shell', () => {
    mockedIsNativeShell.mockReturnValue(true);
    const listeners = installWindowEvents();

    const view = render(<PWAInstallPrompt />);

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
      jest.advanceTimersByTime(30000);
    });

    expect(view.queryByText('Install Tic-Tac-Doh')).toBeNull();
    expect(listeners.has('beforeinstallprompt')).toBe(false);
  });

  it('still offers install on the web after the prompt delay', () => {
    mockedIsNativeShell.mockReturnValue(false);
    installWindowEvents();

    const view = render(<PWAInstallPrompt />);
    const event = new Event('beforeinstallprompt', { cancelable: true });

    act(() => {
      window.dispatchEvent(event);
    });
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(view.getByText('Install Tic-Tac-Doh')).toBeTruthy();
    expect(view.getByText('Not Now')).toBeTruthy();
  });
});
