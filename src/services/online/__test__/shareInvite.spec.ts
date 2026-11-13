import { Share } from '@capacitor/share';
import { isNativeShell } from '@/services/nativeShell';
import { buildInviteShareText, shareOnlineInvite } from '../shareInvite';

jest.mock('@capacitor/share', () => ({
  Share: { share: jest.fn(() => Promise.resolve()) },
}));

jest.mock('@/services/nativeShell', () => ({
  isNativeShell: jest.fn(),
}));

const mockedShare = Share.share as jest.Mock;
const mockedNative = isNativeShell as jest.Mock;

describe('shareInvite', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    mockedShare.mockClear();
    mockedNative.mockReset();
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it('builds SMS-friendly text with room code and invite URL', () => {
    expect(buildInviteShareText('ab12cd', 'https://mp.example.com/join/AB12CD')).toBe(
      'Join my Tic-Tac-Doh game! Code: AB12CD\nhttps://mp.example.com/join/AB12CD'
    );
  });

  it('shares via Capacitor Share on native shell', async () => {
    mockedNative.mockReturnValue(true);

    await shareOnlineInvite({
      code: 'xy99zz',
      inviteUrl: 'https://mp.example.com/join/XY99ZZ',
    });

    expect(mockedShare).toHaveBeenCalledWith({
      title: 'Tic-Tac-Doh invite',
      text: 'Join my Tic-Tac-Doh game! Code: XY99ZZ\nhttps://mp.example.com/join/XY99ZZ',
      url: 'https://mp.example.com/join/XY99ZZ',
      dialogTitle: 'Share game invite',
    });
  });

  it('uses navigator.share on web when available', async () => {
    mockedNative.mockReturnValue(false);
    const share = jest.fn(() => Promise.resolve());
    Object.defineProperty(global, 'navigator', {
      value: { share },
      configurable: true,
      writable: true,
    });

    await shareOnlineInvite({
      code: 'ab12cd',
      inviteUrl: 'https://mp.example.com/join/AB12CD',
    });

    expect(share).toHaveBeenCalledWith({
      title: 'Tic-Tac-Doh invite',
      text: 'Join my Tic-Tac-Doh game! Code: AB12CD\nhttps://mp.example.com/join/AB12CD',
      url: 'https://mp.example.com/join/AB12CD',
    });
    expect(mockedShare).not.toHaveBeenCalled();
  });

  it('falls back to clipboard on web when share is unavailable', async () => {
    mockedNative.mockReturnValue(false);
    const writeText = jest.fn(() => Promise.resolve());
    Object.defineProperty(global, 'navigator', {
      value: { clipboard: { writeText } },
      configurable: true,
      writable: true,
    });

    await shareOnlineInvite({
      code: 'ab12cd',
      inviteUrl: 'https://mp.example.com/join/AB12CD',
    });

    expect(writeText).toHaveBeenCalledWith(
      'Join my Tic-Tac-Doh game! Code: AB12CD\nhttps://mp.example.com/join/AB12CD'
    );
    expect(mockedShare).not.toHaveBeenCalled();
  });

  it('rejects when code or inviteUrl is missing', async () => {
    mockedNative.mockReturnValue(true);
    await expect(shareOnlineInvite({ code: '', inviteUrl: 'https://x' })).rejects.toThrow(
      /code/i
    );
    await expect(shareOnlineInvite({ code: 'ABCD12', inviteUrl: '' })).rejects.toThrow(/url/i);
    expect(mockedShare).not.toHaveBeenCalled();
  });
});
