export const DEFAULT_WEB_JOIN_BASE = 'https://chrisstoy.github.io/tictacdoh';

/** Normalize a Pages/PWA base URL (no trailing slash) for `?join=` links. */
export function resolveWebJoinBase(envValue: string | undefined): string {
  const raw = (envValue ?? '').trim() || DEFAULT_WEB_JOIN_BASE;
  return raw.replace(/\/+$/, '');
}

export function webJoinUrl(code: string, webJoinBase: string = DEFAULT_WEB_JOIN_BASE): string {
  const safeCode = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const base = resolveWebJoinBase(webJoinBase);
  return `${base}/?join=${encodeURIComponent(safeCode)}`;
}

export function joinLandingHtml(
  code: string,
  webJoinBase: string = DEFAULT_WEB_JOIN_BASE
): string {
  const safeCode = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const deepLink = `tictacdoh://join/${encodeURIComponent(safeCode)}`;
  const browserLink = webJoinUrl(safeCode, webJoinBase);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Join Tic-Tac-Doh ${safeCode}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #fdde97; color: #1a1a1a;
      display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; }
    main { text-align: center; padding: 2rem; max-width: 28rem; }
    a { color: #c45c26; font-weight: 700; display: inline-block; margin: 0.35rem 0; }
    code { font-size: 1.5rem; letter-spacing: 0.15em; }
  </style>
</head>
<body>
  <main>
    <h1>Tic-Tac-Doh</h1>
    <p>Room code</p>
    <p><code>${safeCode}</code></p>
    <p><a id="open-app" href="${deepLink}">Open in app</a></p>
    <p><a id="open-browser" href="${browserLink}">Open in browser</a></p>
    <p>If the app did not open, use Open in browser or type the code in the game.</p>
  </main>
  <script>
    // Prefer the native app when installed; browser link remains for web/PWA.
    setTimeout(function () { location.href = ${JSON.stringify(deepLink)}; }, 50);
  </script>
</body>
</html>`;
}
