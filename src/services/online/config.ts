/**
 * Online multiplayer is available only when EXPO_PUBLIC_MULTIPLAYER_URL is set.
 * UI entry points (#41+) should gate on `isOnlineMultiplayerConfigured()`.
 */
export function getMultiplayerBaseUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_MULTIPLAYER_URL;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : null;
}

export function isOnlineMultiplayerConfigured(): boolean {
  return getMultiplayerBaseUrl() !== null;
}
