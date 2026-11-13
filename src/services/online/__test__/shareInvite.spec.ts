import { Share } from '@capacitor/share';
import { buildInviteShareText, shareOnlineInvite } from '../shareInvite';

jest.mock('@capacitor/share', () => ({
  Share: { share: jest.fn(() => Promise.resolve()) },
}));

const mockedShare = Share.share as jest.Mock;

describe('shareInvite', () => {
  beforeEach(() => {
    mockedShare.mockClear();
  });

  it('builds SMS-friendly text with room code and invite URL', () => {
    expect(buildInviteShareText('ab12cd', 'https://mp.example.com/join/AB12CD')).toBe(
      'Join my Tic-Tac-Doh game! Code: AB12CD\nhttps://mp.example.com/join/AB12CD'
    );
  });

  it('shares via Capacitor Share with title, text, and url', async () => {
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

  it('rejects when code or inviteUrl is missing', async () => {
    await expect(shareOnlineInvite({ code: '', inviteUrl: 'https://x' })).rejects.toThrow(
      /code/i
    );
    await expect(shareOnlineInvite({ code: 'ABCD12', inviteUrl: '' })).rejects.toThrow(/url/i);
    expect(mockedShare).not.toHaveBeenCalled();
  });
});
