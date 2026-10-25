---
name: deployment
description: Web/PWA build pipeline, GitHub Pages CI deploy, and the Capacitor release path.
---

# Deployment

## Targets
| Target | How | Notes |
|---|---|---|
| Production web (GitHub Pages) | Push to `main` triggers `.github/workflows/main.yml` | Serves at https://chrisstoy.github.io/tictacdoh/ |
| Local web build | `npm run build` | Base path `/` unless `GITHUB_PAGES` is set |
| Native shell web bundle | `npm run build:native` | Forces `GITHUB_PAGES` unset so the base path is `/` even if the variable is set in the environment |
| iOS / Android | Capacitor (`ios/`, `android/`) | App id `com.stoyco.tictacdoh`. `npm run build:native && npm run cap:sync` copies `dist/` in. `npm run cap:ios` / `cap:android` open the native IDEs. Signed release is local; see below. No store pipeline in CI |

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

## Native release
Not run by CI. Start from a web bundle whose base path is `/`:

1. `npm run build:native && npm run cap:sync`
2. iOS: `npm run cap:ios`. Signing input is an Apple Developer team on bundle id `com.stoyco.tictacdoh` (Xcode automatic signing; no team id is committed). Archive with Product → Archive. Uploading to App Store Connect / TestFlight stays a manual store step and is not performed from this repo.
3. Android: write gitignored `android/keystore.properties` (`storeFile` relative to `android/`, plus `storePassword`, `keyAlias`, `keyPassword`) and only then run `./gradlew bundleRelease` from `android/`. The release build type signs only when that file exists; otherwise the AAB is unsigned and must not be uploaded. The keystore stays outside git (`*.keystore` / `*.jks` at the repo root, `keystore.properties` in `android/.gitignore`). Play Console upload stays manual and is not performed from this repo.

Full steps live in `.agents/skills/deploy-app/SKILL.md`.

## CI (`main.yml`)
Build job: checkout → configure-pages → Node 20 + npm cache → `npm ci` → `npm run build` (GITHUB_PAGES) → upload `./dist`. Deploy job: `actions/deploy-pages@v4` into environment `github-pages`. Also runnable via `workflow_dispatch`. CI does **not** run lint or tests.

## Gotchas
- Base path is hard-coded in several places (`/tictacdoh/`); renaming the repo/Pages path means updating all of them plus `registerServiceWorker.ts`.
- Web builds must be SSR-safe (see `conventions.md`).
