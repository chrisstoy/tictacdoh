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

export async function createRoom(roundsInMatch: number): Promise<CreateRoomResponse> {
  const base = getMultiplayerBaseUrl();
  if (!base) {
    throw new OnlineHttpError('EXPO_PUBLIC_MULTIPLAYER_URL is not configured');
  }

  const res = await fetch(`${base}/rooms`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ roundsInMatch }),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      // ignore
    }
    throw new OnlineHttpError(detail || 'Failed to create room', res.status);
  }

  const data = (await res.json()) as {
    code: string;
    hostToken: string;
    roundsInMatch: number;
    wsUrl: string;
    joinPath: string;
  };

  return {
    ...data,
    inviteUrl: `${base}${data.joinPath.startsWith('/') ? data.joinPath : `/${data.joinPath}`}`,
  };
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
