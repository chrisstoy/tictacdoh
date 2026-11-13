import { acceptDeepLinkJoin } from '../acceptDeepLinkJoin';
import { joinOnlineSession, leaveOnlineSession } from '../onlineSession';
import { useOnlineSessionStore } from '../sessionStore';

jest.mock('../onlineSession', () => ({
  joinOnlineSession: jest.fn(() => Promise.resolve()),
  leaveOnlineSession: jest.fn(() => Promise.resolve()),
}));

const mockedJoin = joinOnlineSession as jest.Mock;
const mockedLeave = leaveOnlineSession as jest.Mock;

describe('acceptDeepLinkJoin', () => {
  beforeEach(() => {
    mockedJoin.mockClear();
    mockedLeave.mockClear();
    useOnlineSessionStore.getState().reset();
  });

  it('joins when no online session is active', async () => {
    await acceptDeepLinkJoin('ABCD12');
    expect(mockedLeave).not.toHaveBeenCalled();
    expect(mockedJoin).toHaveBeenCalledWith('ABCD12');
  });

  it('leaves an existing session before joining a new code', async () => {
    useOnlineSessionStore.setState({
      status: 'connected',
      roomCode: 'OLD123',
      seat: 'X',
    });

    await acceptDeepLinkJoin('NEW456');

    expect(mockedLeave).toHaveBeenCalled();
    expect(mockedJoin).toHaveBeenCalledWith('NEW456');
    expect(mockedLeave.mock.invocationCallOrder[0]).toBeLessThan(
      mockedJoin.mock.invocationCallOrder[0]
    );
  });

  it('propagates join failures after leave', async () => {
    useOnlineSessionStore.setState({
      status: 'connected',
      roomCode: 'OLD123',
      seat: 'O',
    });
    mockedJoin.mockRejectedValueOnce(new Error('room full'));

    await expect(acceptDeepLinkJoin('NEW456')).rejects.toThrow(/room full/i);
    expect(mockedLeave).toHaveBeenCalled();
  });
});
