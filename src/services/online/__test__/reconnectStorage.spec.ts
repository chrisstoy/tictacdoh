import { Capacitor } from '@capacitor/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  ONLINE_SESSION_STORAGE_KEY,
  clearOnlineReconnectCreds,
  loadOnlineReconnectCreds,
  saveOnlineReconnectCreds,
} from '../reconnectStorage';

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('reconnectStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('saves and loads roomCode, reconnectToken, and seat', async () => {
    await saveOnlineReconnectCreds({
      roomCode: 'ABCD12',
      reconnectToken: 'tok-1',
      seat: 'X',
    });
    expect(await loadOnlineReconnectCreds()).toEqual({
      roomCode: 'ABCD12',
      reconnectToken: 'tok-1',
      seat: 'X',
    });
    const raw = await AsyncStorage.getItem(ONLINE_SESSION_STORAGE_KEY);
    expect(raw).toContain('ABCD12');
  });

  it('returns null for missing or corrupt data', async () => {
    expect(await loadOnlineReconnectCreds()).toBeNull();
    await AsyncStorage.setItem(ONLINE_SESSION_STORAGE_KEY, '{bad');
    expect(await loadOnlineReconnectCreds()).toBeNull();
  });

  it('clears stored credentials', async () => {
    await saveOnlineReconnectCreds({
      roomCode: 'ABCD12',
      reconnectToken: 'tok-1',
      seat: 'O',
    });
    await clearOnlineReconnectCreds();
    expect(await loadOnlineReconnectCreds()).toBeNull();
  });

  it('keeps each browser tab’s seat in sessionStorage', async () => {
    const originalOS = Platform.OS;
    const memory = new Map<string, string>();
    const sessionStorage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    };
    const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
    Platform.OS = 'web';
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { sessionStorage },
    });

    try {
      await saveOnlineReconnectCreds({
        roomCode: 'TABSE1',
        reconnectToken: 'tab-token',
        seat: 'O',
      });
      expect(await AsyncStorage.getItem(ONLINE_SESSION_STORAGE_KEY)).toBeNull();
      expect(sessionStorage.getItem(ONLINE_SESSION_STORAGE_KEY)).toContain('TABSE1');
      expect(await loadOnlineReconnectCreds()).toEqual({
        roomCode: 'TABSE1',
        reconnectToken: 'tab-token',
        seat: 'O',
      });
      await clearOnlineReconnectCreds();
      expect(sessionStorage.getItem(ONLINE_SESSION_STORAGE_KEY)).toBeNull();
    } finally {
      Platform.OS = originalOS;
      if (windowDescriptor) {
        Object.defineProperty(globalThis, 'window', windowDescriptor);
      } else {
        Reflect.deleteProperty(globalThis, 'window');
      }
    }
  });
});
