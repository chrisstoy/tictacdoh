import { App } from '@capacitor/app';
import { useEffect, useState } from 'react';
import { version as packageVersion } from '../../package.json';
import { isNativeShell } from './nativeShell';

/** `v1.0 (60)`, or `v1.0` when there is no build number. */
export function formatVersion(version: string, build?: string): string {
  return build ? `v${version} (${build})` : `v${version}`;
}

/**
 * The version to show the player. Inside the Capacitor shell it is the
 * installed app's version and build number; on web, the package version.
 * The first render is always the package version, so it matches the
 * prerendered HTML.
 */
export function useAppVersion(): string {
  const [text, setText] = useState(formatVersion(packageVersion));

  useEffect(() => {
    if (!isNativeShell()) {
      return;
    }

    let cancelled = false;
    App.getInfo()
      .then(({ version, build }) => {
        if (!cancelled) {
          setText(formatVersion(version, build));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return text;
}
