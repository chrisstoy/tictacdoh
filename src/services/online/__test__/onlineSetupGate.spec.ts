import { isNativeShell } from '@/services/nativeShell';
import { isOnlineMultiplayerConfigured } from '../config';
import { isOnlineSetupAvailable } from '../onlineSetupGate';

jest.mock('@/services/nativeShell', () => ({
  isNativeShell: jest.fn(),
}));

jest.mock('../config', () => ({
  isOnlineMultiplayerConfigured: jest.fn(),
}));

const mockedNative = isNativeShell as jest.Mock;
const mockedConfigured = isOnlineMultiplayerConfigured as jest.Mock;

describe('isOnlineSetupAvailable', () => {
  afterEach(() => {
    mockedNative.mockReset();
    mockedConfigured.mockReset();
  });

  it('is true only when native shell and Worker URL are both set', () => {
    mockedNative.mockReturnValue(true);
    mockedConfigured.mockReturnValue(true);
    expect(isOnlineSetupAvailable()).toBe(true);
  });

  it('is false on web even when Worker URL is set', () => {
    mockedNative.mockReturnValue(false);
    mockedConfigured.mockReturnValue(true);
    expect(isOnlineSetupAvailable()).toBe(false);
  });

  it('is false on native when Worker URL is missing', () => {
    mockedNative.mockReturnValue(true);
    mockedConfigured.mockReturnValue(false);
    expect(isOnlineSetupAvailable()).toBe(false);
  });
});
