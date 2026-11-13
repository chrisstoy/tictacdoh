import { isNativeShell } from '@/services/nativeShell';
import { parseJoinQueryParam, stripJoinQueryFromLocation } from './webJoinQuery';

export type WebJoinHandler = (code: string) => void;

/**
 * On web/PWA, if the URL has `?join=<code>`, invoke the handler once and strip the query.
 * No-op inside the Capacitor shell (custom-scheme listener owns that path).
 */
export function consumeWebJoinQuery(onJoinCode: WebJoinHandler): boolean {
  if (typeof window === 'undefined' || isNativeShell()) {
    return false;
  }

  const href = window.location?.href;
  if (!href) {
    return false;
  }

  const code = parseJoinQueryParam(href);
  if (!code) {
    return false;
  }

  stripJoinQueryFromLocation();
  onJoinCode(code);
  return true;
}
