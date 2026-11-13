import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlayerId } from '@/types';

export const ONLINE_SESSION_STORAGE_KEY = '@tic-tac-doh:online-session';

export type OnlineReconnectCreds = {
  roomCode: string;
  reconnectToken: string;
  seat: PlayerId;
};

export async function saveOnlineReconnectCreds(creds: OnlineReconnectCreds): Promise<void> {
  await AsyncStorage.setItem(ONLINE_SESSION_STORAGE_KEY, JSON.stringify(creds));
}

export async function loadOnlineReconnectCreds(): Promise<OnlineReconnectCreds | null> {
  try {
    const raw = await AsyncStorage.getItem(ONLINE_SESSION_STORAGE_KEY);
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
  await AsyncStorage.removeItem(ONLINE_SESSION_STORAGE_KEY);
}
