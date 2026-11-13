import { isValidJoinCode, normalizeJoinCode } from './joinCode';

/**
 * Parse a Capacitor deep-link URL of the form `tictacdoh://join/<code>`.
 * Returns a normalized 6-char code, or null when the URL is not a join link.
 */
export function parseJoinDeepLink(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'tictacdoh:') {
    return null;
  }

  // Capacitor / custom schemes: `tictacdoh://join/CODE` → host "join", pathname "/CODE"
  // Some runtimes may put the whole path in pathname as `/join/CODE` with empty host.
  const host = parsed.hostname || parsed.host;
  const pathParts = parsed.pathname
    .split('/')
    .map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    })
    .filter(Boolean);

  let code: string | undefined;
  if (host === 'join') {
    code = pathParts[0];
  } else if (!host && pathParts[0] === 'join') {
    code = pathParts[1];
  } else {
    return null;
  }

  if (!code || !isValidJoinCode(code)) {
    return null;
  }

  return normalizeJoinCode(code);
}
