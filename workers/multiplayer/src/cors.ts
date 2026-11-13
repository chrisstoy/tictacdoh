/** Native Capacitor / Ionic WebView origins used by local and device shells. */
export const DEFAULT_CORS_ORIGINS = [
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  'ionic://localhost',
] as const;

/** Merge optional comma-separated `CORS_ORIGINS` env onto the native-safe defaults. */
export function parseCorsOrigins(envValue: string | undefined): string[] {
  const extras = (envValue ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...DEFAULT_CORS_ORIGINS, ...extras];
}

export function resolveAllowedOrigin(
  origin: string | null,
  allowlist: string[]
): string | null {
  if (!origin) return null;
  return allowlist.includes(origin) ? origin : null;
}

export type CorsHeaderMap = Record<string, string>;

/** Build CORS response headers. Omits ACAO when Origin is missing or not allowlisted. */
export function corsHeaders(
  origin: string | null,
  allowlist: string[]
): CorsHeaderMap {
  const headers: CorsHeaderMap = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  const allowed = resolveAllowedOrigin(origin, allowlist);
  if (allowed) {
    headers['Access-Control-Allow-Origin'] = allowed;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

export function handlePreflight(
  request: Request,
  allowlist: string[]
): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('Origin'), allowlist),
  });
}

/** Attach CORS headers onto an existing HTTP response (does not consume body eagerly). */
export function withCors(
  response: Response,
  request: Request,
  allowlist: string[]
): Response {
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
