import { App } from '@capacitor/app';
import { isNativeShell } from '@/services/nativeShell';
import { startDeepLinkListener } from '../deepLinkListener';

jest.mock('@capacitor/app', () => ({
  App: {
    addListener: jest.fn(),
    getLaunchUrl: jest.fn(),
  },
}));

jest.mock('@/services/nativeShell', () => ({
  isNativeShell: jest.fn(),
}));

const mockedIsNativeShell = isNativeShell as jest.Mock;
const mockedAddListener = App.addListener as jest.Mock;
const mockedGetLaunchUrl = App.getLaunchUrl as jest.Mock;

describe('startDeepLinkListener', () => {
  let onJoinCode: jest.Mock;
  let urlOpenHandler: ((event: { url: string }) => void) | undefined;
  const removeListener = jest.fn(() => Promise.resolve());

  beforeEach(() => {
    onJoinCode = jest.fn();
    urlOpenHandler = undefined;
    removeListener.mockClear();
    mockedIsNativeShell.mockReset();
    mockedAddListener.mockReset();
    mockedGetLaunchUrl.mockReset();

    mockedAddListener.mockImplementation((_event: string, handler: (e: { url: string }) => void) => {
      urlOpenHandler = handler;
      return Promise.resolve({ remove: removeListener });
    });
    mockedGetLaunchUrl.mockResolvedValue(undefined);
  });

  it('does nothing on web (non-native)', async () => {
    mockedIsNativeShell.mockReturnValue(false);
    const stop = await startDeepLinkListener({ onJoinCode });
    expect(mockedAddListener).not.toHaveBeenCalled();
    expect(mockedGetLaunchUrl).not.toHaveBeenCalled();
    stop();
  });

  it('handles cold-start launch URL', async () => {
    mockedIsNativeShell.mockReturnValue(true);
    mockedGetLaunchUrl.mockResolvedValue({ url: 'tictacdoh://join/abcd12' });

    await startDeepLinkListener({ onJoinCode });

    expect(onJoinCode).toHaveBeenCalledWith('ABCD12');
    expect(onJoinCode).toHaveBeenCalledTimes(1);
  });

  it('handles warm appUrlOpen', async () => {
    mockedIsNativeShell.mockReturnValue(true);

    await startDeepLinkListener({ onJoinCode });
    expect(mockedAddListener).toHaveBeenCalledWith('appUrlOpen', expect.any(Function));

    urlOpenHandler?.({ url: 'tictacdoh://join/xy99zz' });
    expect(onJoinCode).toHaveBeenCalledWith('XY99ZZ');
  });

  it('dedupes the same URL across launch and appUrlOpen', async () => {
    mockedIsNativeShell.mockReturnValue(true);
    mockedGetLaunchUrl.mockResolvedValue({ url: 'tictacdoh://join/ABCD12' });

    await startDeepLinkListener({ onJoinCode });
    urlOpenHandler?.({ url: 'tictacdoh://join/ABCD12' });

    expect(onJoinCode).toHaveBeenCalledTimes(1);
  });

  it('ignores non-join URLs', async () => {
    mockedIsNativeShell.mockReturnValue(true);

    await startDeepLinkListener({ onJoinCode });
    urlOpenHandler?.({ url: 'https://example.com/join/ABCD12' });
    urlOpenHandler?.({ url: 'tictacdoh://join/bad' });

    expect(onJoinCode).not.toHaveBeenCalled();
  });

  it('removes the listener on stop', async () => {
    mockedIsNativeShell.mockReturnValue(true);
    const stop = await startDeepLinkListener({ onJoinCode });
    stop();
    expect(removeListener).toHaveBeenCalled();
  });
});
