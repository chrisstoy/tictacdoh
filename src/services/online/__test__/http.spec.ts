import { CapacitorHttp } from '@capacitor/core';
import { isNativeShell } from '@/services/nativeShell';
import { createRoom, OnlineHttpError } from '../http';

jest.mock('@capacitor/core', () => ({
  CapacitorHttp: {
    post: jest.fn(),
  },
}));

jest.mock('@/services/nativeShell', () => ({
  isNativeShell: jest.fn(),
}));

const mockedNative = isNativeShell as jest.Mock;
const mockedPost = CapacitorHttp.post as jest.Mock;

describe('createRoom', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.EXPO_PUBLIC_MULTIPLAYER_URL;

  beforeEach(() => {
    mockedNative.mockReset();
    mockedPost.mockReset();
    process.env.EXPO_PUBLIC_MULTIPLAYER_URL = 'https://mp.example.com';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.EXPO_PUBLIC_MULTIPLAYER_URL = originalEnv;
  });

  it('uses CapacitorHttp on the native shell so WKWebView fetch CORS cannot Load failed', async () => {
    mockedNative.mockReturnValue(true);
    mockedPost.mockResolvedValue({
      status: 200,
      data: {
        code: 'ABCD12',
        hostToken: 'host-token',
        roundsInMatch: 3,
        wsUrl: 'wss://mp.example.com/rooms/ABCD12/ws',
        joinPath: '/join/ABCD12',
      },
    });

    const room = await createRoom(3);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockedPost).toHaveBeenCalledWith({
      url: 'https://mp.example.com/rooms',
      headers: { 'Content-Type': 'application/json' },
      data: { roundsInMatch: 3 },
    });
    expect(room).toEqual({
      code: 'ABCD12',
      hostToken: 'host-token',
      roundsInMatch: 3,
      wsUrl: 'wss://mp.example.com/rooms/ABCD12/ws',
      joinPath: '/join/ABCD12',
      inviteUrl: 'https://mp.example.com/join/ABCD12',
    });
  });

  it('uses fetch on web and still builds inviteUrl', async () => {
    mockedNative.mockReturnValue(false);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 'ZZZZ99',
        hostToken: 'web-token',
        roundsInMatch: 5,
        wsUrl: 'wss://mp.example.com/rooms/ZZZZ99/ws',
        joinPath: '/join/ZZZZ99',
      }),
    });

    const room = await createRoom(5);

    expect(mockedPost).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith('https://mp.example.com/rooms', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ roundsInMatch: 5 }),
    });
    expect(room.inviteUrl).toBe('https://mp.example.com/join/ZZZZ99');
  });

  it('maps native non-2xx into OnlineHttpError', async () => {
    mockedNative.mockReturnValue(true);
    mockedPost.mockResolvedValue({
      status: 503,
      data: { error: 'Worker unavailable' },
    });

    await expect(createRoom(3)).rejects.toMatchObject({
      name: 'OnlineHttpError',
      message: 'Worker unavailable',
      status: 503,
    } satisfies Partial<OnlineHttpError>);
  });
});
