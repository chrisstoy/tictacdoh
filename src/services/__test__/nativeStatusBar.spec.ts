import { StatusBar, Style } from '@capacitor/status-bar';
import { isNativeShell } from '../nativeShell';
import { applyNativeStatusBar } from '../nativeStatusBar';

jest.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    setBackgroundColor: jest.fn(),
    setStyle: jest.fn(),
  },
  Style: {
    Dark: 'DARK',
    Light: 'LIGHT',
    Default: 'DEFAULT',
  },
}));

jest.mock('../nativeShell', () => ({
  isNativeShell: jest.fn(),
}));

const mockedIsNativeShell = isNativeShell as jest.Mock;
const setBackgroundColor = StatusBar.setBackgroundColor as jest.Mock;
const setStyle = StatusBar.setStyle as jest.Mock;

describe('applyNativeStatusBar', () => {
  beforeEach(() => {
    mockedIsNativeShell.mockReset();
    setBackgroundColor.mockReset();
    setStyle.mockReset();
    setBackgroundColor.mockResolvedValue(undefined);
    setStyle.mockResolvedValue(undefined);
  });

  it('does nothing in the browser or during static export', async () => {
    mockedIsNativeShell.mockReturnValue(false);

    await applyNativeStatusBar();

    expect(setBackgroundColor).not.toHaveBeenCalled();
    expect(setStyle).not.toHaveBeenCalled();
  });

  it('sets a #fdde97 background and dark icons inside the native shell', async () => {
    mockedIsNativeShell.mockReturnValue(true);

    await applyNativeStatusBar();

    expect(setBackgroundColor).toHaveBeenCalledWith({ color: '#fdde97' });
    // Style.Light is dark status-bar content (dark icons on a light background).
    expect(setStyle).toHaveBeenCalledWith({ style: Style.Light });
  });
});
