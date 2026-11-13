import { isValidJoinCode, normalizeJoinCode } from './joinCode';

/**
 * Parse `?join=<code>` from a URL or search string (PWA / GitHub Pages invite).
 * Returns a normalized 6-char code, or null when missing/invalid.
 */
export function parseJoinQueryParam(hrefOrSearch: string): string | null {
  if (!hrefOrSearch || typeof hrefOrSearch !== 'string') {
    return null;
  }

  let search = hrefOrSearch.trim();
  if (!search.startsWith('?') && !search.includes('://')) {
    search = search.startsWith('join=') ? `?${search}` : `?${search}`;
  }

  let params: URLSearchParams;
  try {
    if (search.includes('://')) {
      params = new URL(search).searchParams;
    } else {
      params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    }
  } catch {
    return null;
  }

  const raw = params.get('join');
  if (!raw || !isValidJoinCode(raw)) {
    return null;
  }
  return normalizeJoinCode(raw);
}

/** Remove `join` from the current browser URL without reloading (web only). */
export function stripJoinQueryFromLocation(
  loc: { href: string; search: string } = typeof window !== 'undefined' ? window.location : { href: '', search: '' },
  historyApi: { replaceState: (data: unknown, unused: string, url?: string) => void } | undefined =
    typeof window !== 'undefined' ? window.history : undefined
): void {
  if (!historyApi || !loc.search) {
    return;
  }
  const params = new URLSearchParams(loc.search.startsWith('?') ? loc.search.slice(1) : loc.search);
  if (!params.has('join')) {
    return;
  }
  params.delete('join');
  const next = params.toString();
  try {
    const url = new URL(loc.href);
    url.search = next ? `?${next}` : '';
    historyApi.replaceState(historyApi, '', url.pathname + url.search + url.hash);
  } catch {
    // ignore
  }
}
