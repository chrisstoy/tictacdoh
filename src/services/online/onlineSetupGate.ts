import { isOnlineMultiplayerConfigured } from './config';

/** Configured Worker URL — gates Online Create/Join on setup (web/PWA and native). */
export function isOnlineSetupAvailable(): boolean {
  return isOnlineMultiplayerConfigured();
}
