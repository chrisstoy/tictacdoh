import { isNativeShell } from '@/services/nativeShell';
import { isOnlineMultiplayerConfigured } from './config';

/** Native shell + configured Worker URL — gates Online Create/Join on setup. */
export function isOnlineSetupAvailable(): boolean {
  return isNativeShell() && isOnlineMultiplayerConfigured();
}
