import { isNativeShell } from '../nativeShell';
import { registerServiceWorker } from '../registerServiceWorker';

jest.mock('../nativeShell', () => ({
  isNativeShell: jest.fn(),
}));

const mockedIsNativeShell = isNativeShell as jest.Mock;

function setPathname(pathname: string) {
  if (window.location) {
    Object.defineProperty(window.location, 'pathname', {
      configurable: true,
      value: pathname,
    });
    return;
  }

  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { pathname },
  });
}

describe('registerServiceWorker', () => {
  const register = jest.fn();
  const serviceWorkerDescriptor = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');

  beforeEach(() => {
    mockedIsNativeShell.mockReset();
    register.mockReset();
    register.mockResolvedValue({
      scope: '/',
      addEventListener: jest.fn(),
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register, controller: null },
    });
    setPathname('/');
  });

  afterEach(() => {
    if (serviceWorkerDescriptor) {
      Object.defineProperty(navigator, 'serviceWorker', serviceWorkerDescriptor);
    } else {
      Reflect.deleteProperty(navigator, 'serviceWorker');
    }
  });

  it('does not register a service worker inside the native shell', async () => {
    mockedIsNativeShell.mockReturnValue(true);

    await registerServiceWorker();

    expect(register).not.toHaveBeenCalled();
  });

  it('registers sw.js at the site root on web', async () => {
    mockedIsNativeShell.mockReturnValue(false);
    setPathname('/');

    await registerServiceWorker();

    expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
  });

  it('registers under /tictacdoh/ when served from GitHub Pages', async () => {
    mockedIsNativeShell.mockReturnValue(false);
    setPathname('/tictacdoh/');

    await registerServiceWorker();

    expect(register).toHaveBeenCalledWith('/tictacdoh/sw.js', { scope: '/tictacdoh/' });
  });

  it('returns without registering when window is undefined', async () => {
    const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    try {
      mockedIsNativeShell.mockReturnValue(false);
      await registerServiceWorker();
      expect(register).not.toHaveBeenCalled();
    } finally {
      if (windowDescriptor) {
        Object.defineProperty(globalThis, 'window', windowDescriptor);
      }
    }
  });
});
