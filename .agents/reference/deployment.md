---
name: deployment
description: Web/PWA build pipeline, GitHub Pages CI deploy, EAS hosting script, and native build identifiers.
---

# Deployment

## Targets
| Target | How | Notes |
|---|---|---|
| Production web (GitHub Pages) | Push to `main` triggers `.github/workflows/main.yml` | Serves at https://chrisstoy.github.io/tictacdoh/ |
| Local web build | `npm run build` | Base path `/` |
| EAS Hosting | `npm run deploy` (`expo export -p web` + `eas-cli deploy`) | Manual; not used by CI |
| iOS / Android | `npx eas-cli build` | Bundle id / package `com.stoyco.tictacdoh`; no eas.json committed, no store pipeline documented |

No preview/staging environment exists.

## Build pipeline (`npm run build` → `scripts/build-pwa.js`)
1. Generate icons (`generate-icons.js`, uses sharp) → `public/icons`
2. `expo export --platform web` → `dist/`
3. Copy icons to `dist/icons`
4. Inject PWA meta tags into `dist/index.html`
5. Generate `manifest.json`
6. Generate Workbox service worker `sw.js` (precaches static assets; excludes the two large setup music files)
Verifies `index.html`, `manifest.json`, `sw.js`, `icons/` exist at the end.

## Env vars
- `GITHUB_PAGES=true` — sets base path `/tictacdoh/` (in `app.config.js` `publicPath`/`baseUrl`, `build-pwa.js`, `generate-sw.js`). Must be set for the Pages build; CI sets it in the Build step. Omit locally.

## CI (`main.yml`)
Build job: checkout → configure-pages → Node 20 + npm cache → `npm ci` → `npm run build` (GITHUB_PAGES) → upload `./dist`. Deploy job: `actions/deploy-pages@v4` into environment `github-pages`. Also runnable via `workflow_dispatch`. CI does **not** run lint or tests.

## Gotchas
- Base path is hard-coded in several places (`/tictacdoh/`); renaming the repo/Pages path means updating all of them plus `registerServiceWorker.ts`.
- Web builds must be SSR-safe (see `conventions.md`).
