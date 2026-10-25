---
name: deployment
description: Web/PWA build pipeline, GitHub Pages CI deploy, EAS hosting script, and native build identifiers.
---

# Deployment

## Targets
| Target | How | Notes |
|---|---|---|
| Production web (GitHub Pages) | Push to `main` triggers `.github/workflows/main.yml` | Serves at https://chrisstoy.github.io/tictacdoh/ |
| Local web build | `npm run build` | Base path `/` unless `GITHUB_PAGES` is set |
| Native shell web bundle | `npm run build:native` | Forces `GITHUB_PAGES` unset so the base path is `/` even if the variable is set in the environment |
| EAS Hosting | `npm run deploy` (`expo export -p web` + `eas-cli deploy`) | Manual; not used by CI. Unchanged by the Capacitor shell |
| iOS / Android | Capacitor (`ios/`, `android/`) | App id `com.stoyco.tictacdoh`. `npm run cap:sync` copies `dist/` in. `npm run cap:ios` / `cap:android` open the native IDEs. No store pipeline. Expo `npm run ios` / `android` remain until #9 |

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
- `npm run build:native` assigns `GITHUB_PAGES=` (empty) for that process, so a dirty shell cannot bake `/tictacdoh/` into the Capacitor bundle. The Pages workflow is not changed.

## Capacitor
`capacitor.config.ts`: `appId` `com.stoyco.tictacdoh`, `appName` `Tic-Tac-Doh`, `webDir` `dist`. Platforms are `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, and `@capacitor/android`, pinned to 8.5.3, plus `@capacitor/app` 8.1.2, `@capacitor/status-bar` 8.0.4, and `@capacitor-community/native-audio` 8.0.0. Splash and status-bar background are `#fdde97`. `@capacitor/assets` 3.0.5 is a devDependency used by `npm run generate:native-assets`; the generated iOS and Android images are committed.

`ios/` and `android/` are committed. Their own gitignores drop copied web assets (`ios/App/App/public`, `android/app/src/main/assets/public`), `local.properties` (SDK path), Pods, and generated Capacitor config JSON. The repo root also ignores `*.keystore` and `*.jks`. Run `npm run build:native && npm run cap:sync` before launching a simulator or emulator so those ignored asset folders exist locally. Native sound and setup music are committed copies in `ios/App/App/sounds/` and `android/app/src/main/assets/sounds/`; the audio plugin cannot play the URL the web build emits. See `architecture.md`.

Inside the shell, `isNativeShell()` skips service-worker registration and the install prompt. Options still persist through AsyncStorage in the webview.

## CI (`main.yml`)
Build job: checkout → configure-pages → Node 20 + npm cache → `npm ci` → `npm run build` (GITHUB_PAGES) → upload `./dist`. Deploy job: `actions/deploy-pages@v4` into environment `github-pages`. Also runnable via `workflow_dispatch`. CI does **not** run lint or tests.

## Gotchas
- Base path is hard-coded in several places (`/tictacdoh/`); renaming the repo/Pages path means updating all of them plus `registerServiceWorker.ts`.
- Web builds must be SSR-safe (see `conventions.md`).
