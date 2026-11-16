import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { isNativeShell } from '@/services/nativeShell';
import type { PlayerId } from '@/types';

export const ONLINE_SESSION_STORAGE_KEY = '@tic-tac-doh:online-session';

export type OnlineReconnectCreds = {
  roomCode: string;
  reconnectToken: string;
  seat: PlayerId;
};

/**
 * Browser tabs share localStorage, so two web players in one browser would
 * overwrite each other's seat. sessionStorage is per tab and still survives
 * a refresh. The Capacitor shell keeps AsyncStorage so a killed app can reclaim.
 */
function webTabStorage(): Storage | null {
  if (Platform.OS !== 'web' || isNativeShell()) return null;
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

async function readCredsRaw(): Promise<string | null> {
  const tab = webTabStorage();
  if (tab) return tab.getItem(ONLINE_SESSION_STORAGE_KEY);
  return AsyncStorage.getItem(ONLINE_SESSION_STORAGE_KEY);
}

export async function saveOnlineReconnectCreds(creds: OnlineReconnectCreds): Promise<void> {
  const raw = JSON.stringify(creds);
  const tab = webTabStorage();
  if (tab) {
    tab.setItem(ONLINE_SESSION_STORAGE_KEY, raw);
    return;
  }
  await AsyncStorage.setItem(ONLINE_SESSION_STORAGE_KEY, raw);
}

export async function loadOnlineReconnectCreds(): Promise<OnlineReconnectCreds | null> {
  try {
    const raw = await readCredsRaw();
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<OnlineReconnectCreds>;
    if (
      typeof data.roomCode !== 'string' ||
      typeof data.reconnectToken !== 'string' ||
      (data.seat !== 'X' && data.seat !== 'O')
    ) {
      return null;
    }
    return {
      roomCode: data.roomCode,
      reconnectToken: data.reconnectToken,
      seat: data.seat,
    };
  } catch {
    return null;
  }
}

export async function clearOnlineReconnectCreds(): Promise<void> {
  const tab = webTabStorage();
  if (tab) {
    tab.removeItem(ONLINE_SESSION_STORAGE_KEY);
    return;
  }
  await AsyncStorage.removeItem(ONLINE_SESSION_STORAGE_KEY);
}
