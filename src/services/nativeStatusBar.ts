import { StatusBar, Style } from '@capacitor/status-bar';
import { isNativeShell } from './nativeShell';

export const NATIVE_STATUS_BAR_COLOR = '#fdde97';

/**
 * Match the native status bar to the yellow app background.
 * `Style.Light` is dark status-bar content (dark icons on a light background).
 * No-op in the browser and during static export so the PWA is left alone.
 */
export async function applyNativeStatusBar(): Promise<void> {
  if (!isNativeShell()) {
    return;
  }

  await StatusBar.setBackgroundColor({ color: NATIVE_STATUS_BAR_COLOR });
  await StatusBar.setStyle({ style: Style.Light });
}
