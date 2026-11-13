import { getMultiplayerBaseUrl, isOnlineMultiplayerConfigured } from '../config';

describe('online multiplayer config', () => {
  const original = process.env.EXPO_PUBLIC_MULTIPLAYER_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.EXPO_PUBLIC_MULTIPLAYER_URL;
    } else {
      process.env.EXPO_PUBLIC_MULTIPLAYER_URL = original;
    }
  });

  it('is not configured when env is unset or blank', () => {
    delete process.env.EXPO_PUBLIC_MULTIPLAYER_URL;
    expect(isOnlineMultiplayerConfigured()).toBe(false);
    expect(getMultiplayerBaseUrl()).toBeNull();

    process.env.EXPO_PUBLIC_MULTIPLAYER_URL = '   ';
    expect(isOnlineMultiplayerConfigured()).toBe(false);
    expect(getMultiplayerBaseUrl()).toBeNull();
  });

  it('returns trimmed base URL without trailing slash', () => {
    process.env.EXPO_PUBLIC_MULTIPLAYER_URL = ' https://mp.example.com/ ';
    expect(isOnlineMultiplayerConfigured()).toBe(true);
    expect(getMultiplayerBaseUrl()).toBe('https://mp.example.com');
  });
});
