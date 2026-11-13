import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CORS_ORIGINS,
  corsHeaders,
  parseCorsOrigins,
  resolveAllowedOrigin,
} from '../src/cors';

describe('cors helpers', () => {
  it('includes Capacitor/native-safe defaults and merges CORS_ORIGINS', () => {
    expect(DEFAULT_CORS_ORIGINS).toEqual([
      'capacitor://localhost',
      'http://localhost',
      'https://localhost',
      'ionic://localhost',
    ]);
    expect(parseCorsOrigins(undefined)).toEqual([...DEFAULT_CORS_ORIGINS]);
    expect(parseCorsOrigins('')).toEqual([...DEFAULT_CORS_ORIGINS]);
    expect(parseCorsOrigins(' https://app.example.com , https://other.example ')).toEqual([
      ...DEFAULT_CORS_ORIGINS,
      'https://app.example.com',
      'https://other.example',
    ]);
  });

  it('echoes only allowlisted origins and sets Vary', () => {
    const allowlist = parseCorsOrigins('https://app.example.com');
    expect(resolveAllowedOrigin('capacitor://localhost', allowlist)).toBe(
      'capacitor://localhost'
    );
    expect(resolveAllowedOrigin('https://evil.example', allowlist)).toBeNull();
    expect(resolveAllowedOrigin(null, allowlist)).toBeNull();

    const allowed = corsHeaders('http://localhost', allowlist);
    expect(allowed['Access-Control-Allow-Origin']).toBe('http://localhost');
    expect(allowed['Vary']).toBe('Origin');
    expect(allowed['Access-Control-Allow-Methods']).toContain('POST');
    expect(allowed['Access-Control-Allow-Headers']).toMatch(/content-type/i);
    expect(allowed['Access-Control-Allow-Credentials']).toBeUndefined();

    const denied = corsHeaders('https://evil.example', allowlist);
    expect(denied['Access-Control-Allow-Origin']).toBeUndefined();
  });
});

describe('multiplayer worker CORS (HTTP routes)', () => {
  const capacitorOrigin = 'capacitor://localhost';

  it('OPTIONS preflight on /rooms echoes allowlisted Origin', async () => {
    const res = await SELF.fetch('https://example.com/rooms', {
      method: 'OPTIONS',
      headers: {
        Origin: capacitorOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(capacitorOrigin);
    expect(res.headers.get('Access-Control-Allow-Methods')).toMatch(/POST/i);
    expect(res.headers.get('Access-Control-Allow-Headers')).toMatch(/content-type/i);
    expect(res.headers.get('Vary')).toBe('Origin');
  });

  it('OPTIONS preflight omits ACAO for unmatched Origin', async () => {
    const res = await SELF.fetch('https://example.com/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil.example',
        'Access-Control-Request-Method': 'GET',
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('GET /health includes CORS headers for allowlisted Origin', async () => {
    const res = await SELF.fetch('https://example.com/health', {
      headers: { Origin: 'http://localhost' },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost');
    expect(res.headers.get('Vary')).toBe('Origin');
    expect(await res.json()).toEqual({ ok: true });
  });

  it('POST /rooms includes CORS headers for allowlisted Origin', async () => {
    const res = await SELF.fetch('https://example.com/rooms', {
      method: 'POST',
      headers: {
        Origin: capacitorOrigin,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ roundsInMatch: 3 }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(capacitorOrigin);
    const body = (await res.json()) as { code: string };
    expect(body.code).toMatch(/^[A-Z2-9]{6}$/);
  });

  it('GET /join/:code includes CORS headers for allowlisted Origin', async () => {
    const create = await SELF.fetch('https://example.com/rooms', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ roundsInMatch: 3 }),
    });
    const { code } = (await create.json()) as { code: string };

    const res = await SELF.fetch(`https://example.com/join/${code}`, {
      headers: { Origin: 'https://localhost' },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://localhost');
  });

  it('WebSocket upgrade path does not require CORS preflight headers', async () => {
    const create = await SELF.fetch('https://example.com/rooms', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ roundsInMatch: 3 }),
    });
    const { code } = (await create.json()) as { code: string };

    const res = await SELF.fetch(`https://example.com/rooms/${code}/ws`, {
      headers: { Upgrade: 'websocket' },
    });
    expect(res.status).toBe(101);
    expect(res.webSocket).toBeTruthy();
    res.webSocket!.accept();
    res.webSocket!.close();
  });
});
