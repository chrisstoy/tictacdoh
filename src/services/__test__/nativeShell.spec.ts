import { Capacitor } from '@capacitor/core';
import { isNativeShell } from '../nativeShell';

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
  },
}));

const isNativePlatform = Capacitor.isNativePlatform as jest.Mock;

describe('isNativeShell', () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');

  afterEach(() => {
    if (windowDescriptor) {
      Object.defineProperty(globalThis, 'window', windowDescriptor);
    }
    isNativePlatform.mockReset();
  });

  it('returns false when window is undefined', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    expect(isNativeShell()).toBe(false);
    expect(isNativePlatform).not.toHaveBeenCalled();
  });

  it('returns false on web when Capacitor is not a native platform', () => {
    isNativePlatform.mockReturnValue(false);

    expect(isNativeShell()).toBe(false);
    expect(isNativePlatform).toHaveBeenCalled();
  });

  it('returns true when Capacitor reports a native platform', () => {
    isNativePlatform.mockReturnValue(true);

    expect(isNativeShell()).toBe(true);
    expect(isNativePlatform).toHaveBeenCalled();
  });
});
