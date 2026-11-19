import { Capacitor } from '@capacitor/core';

/**
 * True when the bundled web build is running inside the Capacitor iOS or
 * Android shell. False during static export (no `window`) and in the browser.
 */
export function isNativeShell(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return Capacitor.isNativePlatform();
}

/** True only inside the Capacitor Android shell (not iOS, not the browser). */
export function isAndroidNativeShell(): boolean {
  return isNativeShell() && Capacitor.getPlatform() === 'android';
}
