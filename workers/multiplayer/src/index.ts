import { isValidRoundsInMatch } from '../../../shared/gameRules';
import { GameRoom } from './GameRoom';
import { joinLandingHtml } from './joinLanding';

export { GameRoom };

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return code;
}

function newToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true });
    }

    if (request.method === 'POST' && url.pathname === '/rooms') {
      let body: { roundsInMatch?: number };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return json({ error: 'Invalid JSON' }, 400);
      }
      const roundsInMatch = body.roundsInMatch ?? 3;
      if (!isValidRoundsInMatch(roundsInMatch)) {
        return json({ error: 'invalid roundsInMatch' }, 400);
      }

      const code = generateRoomCode();
      const hostToken = newToken();
      const id = env.GAME_ROOM.idFromName(code);
      const stub = env.GAME_ROOM.get(id);
      const createRes = await stub.fetch(
        new Request('https://do/create', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code, roundsInMatch, hostToken }),
        })
      );
      if (!createRes.ok) {
        const err = await createRes.text();
        return new Response(err, { status: createRes.status });
      }

      const wsUrl = `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}/rooms/${code}/ws`;
      return json({
        code,
        hostToken,
        roundsInMatch,
        wsUrl,
        joinPath: `/join/${code}`,
      });
    }

    const joinMatch = url.pathname.match(/^\/join\/([A-Za-z0-9]+)$/);
    if (request.method === 'GET' && joinMatch) {
      const code = joinMatch[1]!.toUpperCase();
      return new Response(joinLandingHtml(code), {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

    const wsMatch = url.pathname.match(/^\/rooms\/([A-Za-z0-9]+)\/ws$/);
    if (wsMatch) {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
      }
      const code = wsMatch[1]!.toUpperCase();
      const id = env.GAME_ROOM.idFromName(code);
      const stub = env.GAME_ROOM.get(id);
      return stub.fetch(request);
    }

    return json({ error: 'Not found' }, 404);
  },
} satisfies ExportedHandler<Env>;
