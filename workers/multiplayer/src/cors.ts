/** Native Capacitor / Ionic WebView origins used by local and device shells. */
export const DEFAULT_CORS_ORIGINS = [
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  'ionic://localhost',
  // GitHub Pages PWA (path is not part of Origin)
  'https://chrisstoy.github.io',
] as const;

/** Merge optional comma-separated `CORS_ORIGINS` env onto the native-safe defaults. */
export function parseCorsOrigins(envValue: string | undefined): string[] {
  const extras = (envValue ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...DEFAULT_CORS_ORIGINS, ...extras];
}

/**
 * Expo web (`localhost:8081`) and other local dev servers. Origin is
 * scheme + host + port, so the portless `http://localhost` default does not
 * match them. Remote sites cannot send a loopback Origin.
 */
export function isLoopbackDevOrigin(origin: string): boolean {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.username || url.password || url.search || url.hash) return false;
  if (url.pathname !== '/' && url.pathname !== '') return false;
  const host = url.hostname.replace(/^\[|\]$/g, '');
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

export function resolveAllowedOrigin(origin: string | null, allowlist: string[]): string | null {
  if (!origin) return null;
  if (allowlist.includes(origin)) return origin;
  return isLoopbackDevOrigin(origin) ? origin : null;
}

export type CorsHeaderMap = Record<string, string>;

/** Build CORS response headers. Omits ACAO when Origin is missing or not allowlisted. */
export function corsHeaders(origin: string | null, allowlist: string[]): CorsHeaderMap {
  const headers: CorsHeaderMap = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    // Accept is often included in browser preflights alongside Content-Type.
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
  };
  const allowed = resolveAllowedOrigin(origin, allowlist);
  if (allowed) {
    headers['Access-Control-Allow-Origin'] = allowed;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

export function handlePreflight(request: Request, allowlist: string[]): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('Origin'), allowlist),
  });
}

/** Attach CORS headers onto an existing HTTP response (does not consume body eagerly). */
export function withCors(response: Response, request: Request, allowlist: string[]): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(
    corsHeaders(request.headers.get('Origin'), allowlist)
  )) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
