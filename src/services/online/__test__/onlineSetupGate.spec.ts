import { isOnlineMultiplayerConfigured } from '../config';
import { isOnlineSetupAvailable } from '../onlineSetupGate';

jest.mock('../config', () => ({
  isOnlineMultiplayerConfigured: jest.fn(),
}));

const mockedConfigured = isOnlineMultiplayerConfigured as jest.Mock;

describe('isOnlineSetupAvailable', () => {
  afterEach(() => {
    mockedConfigured.mockReset();
  });

  it('is true when Worker URL is set (web or native)', () => {
    mockedConfigured.mockReturnValue(true);
    expect(isOnlineSetupAvailable()).toBe(true);
  });

  it('is false when Worker URL is missing', () => {
    mockedConfigured.mockReturnValue(false);
    expect(isOnlineSetupAvailable()).toBe(false);
  });
});
