import { App } from '@capacitor/app';
import { isNativeShell } from '@/services/nativeShell';
import { parseJoinDeepLink } from './deepLink';

export type DeepLinkJoinHandler = (code: string) => void;

type StartOptions = {
  onJoinCode: DeepLinkJoinHandler;
};

/**
 * Register Capacitor deep-link handling for `tictacdoh://join/<code>`.
 * Cold start uses `App.getLaunchUrl()`; warm opens use `appUrlOpen`.
 * The same URL is delivered at most once per listener lifetime.
 * No-op outside the native Capacitor shell.
 */
export async function startDeepLinkListener({
  onJoinCode,
}: StartOptions): Promise<() => void> {
  if (!isNativeShell()) {
    return () => undefined;
  }

  const seen = new Set<string>();

  const handleUrl = (url: string | undefined) => {
    if (!url || seen.has(url)) {
      return;
    }
    const code = parseJoinDeepLink(url);
    if (!code) {
      return;
    }
    seen.add(url);
    onJoinCode(code);
  };

  const launch = await App.getLaunchUrl();
  handleUrl(launch?.url);

  const handle = await App.addListener('appUrlOpen', ({ url }) => {
    handleUrl(url);
  });

  return () => {
    void handle.remove();
  };
}
