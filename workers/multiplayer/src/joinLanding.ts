export function joinLandingHtml(code: string): string {
  const deepLink = `tictacdoh://join/${encodeURIComponent(code)}`;
  const safeCode = code.replace(/[^A-Z0-9]/gi, '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Join Tic-Tac-Doh ${safeCode}</title>
  <meta http-equiv="refresh" content="0;url=${deepLink}" />
  <style>
    body { font-family: system-ui, sans-serif; background: #fdde97; color: #1a1a1a;
      display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; }
    main { text-align: center; padding: 2rem; }
    a { color: #c45c26; font-weight: 700; }
    code { font-size: 1.5rem; letter-spacing: 0.15em; }
  </style>
</head>
<body>
  <main>
    <h1>Tic-Tac-Doh</h1>
    <p>Room code</p>
    <p><code>${safeCode}</code></p>
    <p><a href="${deepLink}">Open in Tic-Tac-Doh</a></p>
    <p>If the app did not open, install Tic-Tac-Doh and tap the link again.</p>
  </main>
  <script>location.replace(${JSON.stringify(deepLink)});</script>
</body>
</html>`;
}
