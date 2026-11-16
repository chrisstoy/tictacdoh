import { CapacitorHttp } from '@capacitor/core';
import { isNativeShell } from '@/services/nativeShell';
import { getMultiplayerBaseUrl } from './config';

export type CreateRoomResponse = {
  code: string;
  hostToken: string;
  roundsInMatch: number;
  wsUrl: string;
  joinPath: string;
  inviteUrl: string;
};

export class OnlineHttpError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'OnlineHttpError';
  }
}

type RoomPayload = {
  code: string;
  hostToken: string;
  roundsInMatch: number;
  wsUrl: string;
  joinPath: string;
};

function withInviteUrl(base: string, data: RoomPayload): CreateRoomResponse {
  return {
    ...data,
    inviteUrl: `${base}${data.joinPath.startsWith('/') ? data.joinPath : `/${data.joinPath}`}`,
  };
}

function errorDetailFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'error' in body) {
    const error = (body as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim()) return error;
  }
  return fallback;
}

/**
 * POST /rooms. On the Capacitor shell, use CapacitorHttp (native URLSession) —
 * WKWebView `fetch` from `capacitor://localhost` to the Worker HTTPS origin
 * commonly fails with TypeError "Load failed" even when CORS is allowlisted.
 * Web/PWA keeps browser `fetch` + Worker CORS.
 */
export async function createRoom(roundsInMatch: number): Promise<CreateRoomResponse> {
  const base = getMultiplayerBaseUrl();
  if (!base) {
    throw new OnlineHttpError('EXPO_PUBLIC_MULTIPLAYER_URL is not configured');
  }

  const url = `${base}/rooms`;

  if (isNativeShell()) {
    const response = await CapacitorHttp.post({
      url,
      headers: { 'Content-Type': 'application/json' },
      data: { roundsInMatch },
    });
    const data = response.data as RoomPayload | { error?: string } | string | null;
    if (response.status < 200 || response.status >= 300) {
      throw new OnlineHttpError(
        errorDetailFromBody(data, `Failed to create room (${response.status})`),
        response.status
      );
    }
    if (!data || typeof data !== 'object' || !('code' in data)) {
      throw new OnlineHttpError('Invalid create-room response', response.status);
    }
    return withInviteUrl(base, data as RoomPayload);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ roundsInMatch }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Online request failed';
    // Safari/WKWebView wording when CORS or network blocks the request.
    if (/load failed|failed to fetch/i.test(message)) {
      throw new OnlineHttpError('Could not reach the multiplayer server');
    }
    throw error instanceof Error ? error : new OnlineHttpError(message);
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      detail = errorDetailFromBody(body, detail || 'Failed to create room');
    } catch {
      // ignore
    }
    throw new OnlineHttpError(detail || 'Failed to create room', res.status);
  }

  const data = (await res.json()) as RoomPayload;
  return withInviteUrl(base, data);
}

export function roomWsUrl(code: string, wsUrlFromCreate?: string): string {
  if (wsUrlFromCreate) return wsUrlFromCreate;
  const base = getMultiplayerBaseUrl();
  if (!base) {
    throw new OnlineHttpError('EXPO_PUBLIC_MULTIPLAYER_URL is not configured');
  }
  const u = new URL(base);
  const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${u.host}/rooms/${code.toUpperCase()}/ws`;
}
