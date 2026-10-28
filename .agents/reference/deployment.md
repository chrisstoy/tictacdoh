---
name: deployment
description: Web/PWA build pipeline, GitHub Pages CI deploy, and the local iOS and Android store release.
---

# Deployment

## Targets
| Target | How | Notes |
|---|---|---|
| Production web (GitHub Pages) | `.github/workflows/main.yml` is `workflow_dispatch` only; merging to `main` does not deploy. Publish through the `deploy-app` skill (`gh workflow run "Build and Deploy to Pages" --ref main`) | Serves at https://chrisstoy.github.io/tictacdoh/ |
| Local web build | `npm run build` | Base path `/` unless `GITHUB_PAGES` is set |
| Native shell web bundle | `npm run build:native` | Forces `GITHUB_PAGES` unset so the base path is `/` even if the variable is set in the environment |
| iOS | `scripts/release-ios.sh` | Bundle id `com.chrisstoy.tictacdoh`. App Store Connect app `6826927007` ("Tic-Tac-DOH!"). Version `1.0` is `PREPARE_FOR_SUBMISSION`. Build 52 is on TestFlight and was confirmed working on a device. Archive + upload from this machine. No store job in CI |
| Android | `scripts/release-android.sh` then `scripts/upload-android.py` | Same package name. No Play Console app yet. Signed AAB locally; upload is the Play Developer API internal track and only runs with `--apply` |

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
`capacitor.config.ts`: `appId` `com.chrisstoy.tictacdoh`, `appName` `Tic-Tac-Doh`, `webDir` `dist`. That bundle id is the live App Store Connect app. `com.stoyco.tictacdoh` was the Capacitor default and is not registered. Platforms are `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, and `@capacitor/android`, pinned to 8.5.3, plus `@capacitor/app` 8.1.2, `@capacitor/status-bar` 8.0.4, and `@capacitor-community/native-audio` 8.0.0. Splash and status-bar background are `#fdde97`. `@capacitor/assets` 3.0.5 is a devDependency used by `npm run generate:native-assets`; the generated iOS and Android images are committed.

`ios/` and `android/` are committed. Their own gitignores drop copied web assets (`ios/App/App/public`, `android/app/src/main/assets/public`), `local.properties` (SDK path), Pods, and generated Capacitor config JSON. The repo root also ignores `*.keystore` and `*.jks`. Run `npm run build:native && npm run cap:sync` before launching a simulator or emulator so those ignored asset folders exist locally. Native sound and setup music are committed copies in `ios/App/App/sounds/` and `android/app/src/main/assets/sounds/`; the audio plugin cannot play the URL the web build emits. See `architecture.md`.

Inside the shell, `isNativeShell()` skips service-worker registration and the install prompt. Options still persist through AsyncStorage in the webview.

## Native release
Not run by CI. ADR 0002. Both scripts refuse a dirty tree, a shallow clone, and a `HEAD` that is not `origin/main` (`ALLOW_NON_MAIN=1` overrides). Marketing version is `package.json` `"version"` (`1.0`, matching the App Store Connect version string; `1.0.0` would be a different version). Build number / `versionCode` is `git rev-list --count HEAD`, passed in on the command line so the release does not edit source files.

**iOS.** `npm run release:ios` (`scripts/release-ios.sh`) runs `build:native`, `cap sync`, then `xcodebuild archive` on `ios/App/App.xcodeproj` scheme `App` (the shared scheme is committed) with `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`. `scripts/ExportOptions.plist` is `method: app-store-connect`, `destination: upload`, `signingStyle: automatic`, team `J866FQ2YZ9`, and `manageAppVersionAndBuildNumber: false`. The export uploads. Before the archive, the script asks the App Store Connect API (key `8LQQQ646C6`, issuer `4ec14bd3-9f76-44d0-9386-ba48dd531d1f`, app `6826927007`) whether that build number already exists and stops if it does.

Do not pass `-authenticationKeyID` / `-authenticationKeyPath` to `xcodebuild`. Automatic signing has to use the Apple ID signed into Xcode. Those flags make Xcode manage profiles with the API key instead, and this key cannot cloud-sign, so the archive fails with "No profiles were found" even when a Distribution certificate is in the keychain. That is what happened on ShopN with this same key. An archive made from the Xcode GUI instead of the script gets marketing version `1.0` and build `1` from the project file. The script is the release path. The first upload that reached TestFlight is version `1.0` build `52` (commit `13a3d8d`); it was installed from TestFlight and confirmed working on a device. App Store review has not been submitted.

**Android.** `scripts/setup-android-signing.sh` once: PKCS12 upload key at `~/.android/release-keys/tictacdoh-upload.keystore`, alias `tictacdoh-upload`, **`-sigalg SHA256withRSA`**. `keytool` defaults to `SHA384withRSA`, which makes `:app:signReleaseBundle` throw a NullPointerException. Password file sits next to the keystore, mode 600. `credentials.json` at the repo root is gitignored and points at the keystore. `scripts/release-android.sh` copies those values into gitignored `android/keystore.properties` and runs `./gradlew :app:bundleRelease`. The committed Gradle file signs the release build only when that properties file exists; otherwise the AAB is unsigned and must not be uploaded. `versionCode` reads `-PTICTACDOH_VERSION_CODE` or, if unset, `git rev-list --count HEAD`. The script `jarsigner -verify`s the bundle and copies it to `build/release/tictacdoh-<version>-<build>.aab` (`/build/` is gitignored).

`python3 scripts/upload-android.py` is a dry run. `--apply` commits the bundle to the Play **internal** track via the androidpublisher v3 API (service-account JWT, no fastlane, no EAS). The binary goes to `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/...`. The host without `/upload/` tries to parse the `.aab` as JSON. There is no Play Console app yet, so `--apply` cannot succeed until a human creates package `com.chrisstoy.tictacdoh`, enrolls Play App Signing, and puts the service-account JSON at `credentials.json`'s `android.playServiceAccountKeyPath` (`~/.android/release-keys/tictacdoh-play-service-account.json`).

The Android project is committed source. The release script does not run `expo prebuild --clean` and does not patch Gradle. ShopN patches Gradle because prebuild wipes `android/` every release; that does not apply here.

Full steps live in `.agents/skills/deploy-app/SKILL.md`.

## CI (`main.yml`)
Build job: checkout → configure-pages → Node 20 + npm cache → `npm ci` → `npm run build` (GITHUB_PAGES) → upload `./dist`. Deploy job: `actions/deploy-pages@v4` into environment `github-pages`. Triggered only by `workflow_dispatch` (no push trigger), via the `deploy-app` skill. CI does **not** run lint or tests.

## Gotchas
- Base path is hard-coded in several places (`/tictacdoh/`); renaming the repo/Pages path means updating all of them plus `registerServiceWorker.ts`.
- Web builds must be SSR-safe (see `conventions.md`).
- The iOS app is portrait-only and supports iPad (`TARGETED_DEVICE_FAMILY` 1,2). `Info.plist` sets `UIRequiresFullScreen` so App Store Connect accepts that. Without it, upload fails with error 90474 (iPad multitasking requires every orientation).
