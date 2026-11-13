import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ONLINE_SESSION_STORAGE_KEY,
  clearOnlineReconnectCreds,
  loadOnlineReconnectCreds,
  saveOnlineReconnectCreds,
} from '../reconnectStorage';

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
});
