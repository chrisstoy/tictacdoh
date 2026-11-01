import { App } from '@capacitor/app';
import { act, renderHook } from '@testing-library/react-native';
import { formatVersion, useAppVersion } from '../appVersion';
import { isNativeShell } from '../nativeShell';

jest.mock('@capacitor/app', () => ({ App: { getInfo: jest.fn() } }));
jest.mock('../nativeShell', () => ({ isNativeShell: jest.fn(() => false) }));

const mockedNative = isNativeShell as jest.Mock;
const mockedGetInfo = App.getInfo as jest.Mock;

describe('formatVersion', () => {
  it('shows version and build when both are known', () => {
    expect(formatVersion('1.0', '60')).toBe('v1.0 (60)');
  });

  it('shows only the version when there is no build', () => {
    expect(formatVersion('1.0')).toBe('v1.0');
    expect(formatVersion('1.0', '')).toBe('v1.0');
  });
});

describe('useAppVersion', () => {
  beforeEach(() => {
    mockedNative.mockReturnValue(false);
    mockedGetInfo.mockReset();
  });

  it('shows the package version on web, without asking the native shell', () => {
    const { result } = renderHook(() => useAppVersion());

    expect(result.current).toBe(`v${require('../../../package.json').version}`);
    expect(mockedGetInfo).not.toHaveBeenCalled();
  });

  it('shows the installed app version and build inside the native shell', async () => {
    mockedNative.mockReturnValue(true);
    mockedGetInfo.mockResolvedValue({ version: '1.0', build: '61' });

    const { result } = renderHook(() => useAppVersion());
    await act(async () => {});

    expect(result.current).toBe('v1.0 (61)');
  });

  it('keeps the package version when the native lookup fails', async () => {
    mockedNative.mockReturnValue(true);
    mockedGetInfo.mockRejectedValue(new Error('no plugin'));

    const { result } = renderHook(() => useAppVersion());
    await act(async () => {});

    expect(result.current).toBe(`v${require('../../../package.json').version}`);
  });
});
