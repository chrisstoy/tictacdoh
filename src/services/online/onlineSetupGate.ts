import { isOnlineMultiplayerConfigured } from './config';

/** Configured Worker URL — gates Play Online on setup (web/PWA and native). */
export function isOnlineSetupAvailable(): boolean {
  return isOnlineMultiplayerConfigured();
}
