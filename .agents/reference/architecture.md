---
name: architecture
description: Stack, directory layout, Zustand stores and PlayMode state machine, screen flow, CPU AI, and audio.
---

# Architecture

Tic-Tac-Doh: React Native tic-tac-toe on Expo SDK 54 (expo-router 6, React 19, RN 0.81, new arch enabled). The shipping web artifact is a static export and an installable PWA. iOS and Android apps are a Capacitor 8 shell (`capacitor.config.ts`, committed `ios/` and `android/`) that loads that same bundle from `webDir: dist` — not a remote URL. Expo stays the web toolchain (`expo start --web`, `scripts/build-pwa.js`, expo-router). Native apps are the Capacitor shell only: `app.config.js` has no `ios` or `android` block, and `package.json` has no native Expo run or deploy script. Modes: human vs human, human vs CPU, CPU vs CPU, with configurable match length (3/5/7/9/infinite rounds).

## Layout
- `src/app/` — expo-router entry (`_layout.tsx`, `index.tsx`, `globals.css`)
- `src/screens/{setup,play,options}/` — one screen each, with `components/`
- `src/components/` — shared UI; `components/images/` wraps each PNG in `assets/`
- `src/services/` — stores, game logic, audio, service-worker registration, `nativeShell.ts` (`isNativeShell()`)
- `capacitor.config.ts` — `appId` `com.chrisstoy.tictacdoh` (the App Store Connect app, not `com.stoyco.tictacdoh`), `appName` `Tic-Tac-Doh`, `webDir` `dist`
- `ios/`, `android/` — Capacitor native projects (generated web assets, Pods, and `local.properties` stay gitignored)
- `src/animations/` — reanimated helpers (jiggle, push)
- `scripts/` — PWA build pipeline; `public/icons/` generated icons
- `design/game-state.md` — mermaid diagram + per-state behavior of the PlayMode machine
- `ralph/`, `docs/plans/` — prd/ralph autonomous-loop scaffolding, not app code

## State (Zustand v5)
Three stores, each wrapped in `withZustandDevtools` (`zustandDevtools.ts`; real devtools only when `__DEV__` on web, otherwise a no-op) and following state → actions → selectors → action hooks:
- `matchState.ts` — rounds in match, `isCPU` per player, round history, match winner, and `playMode`: `SETUP_MATCH` → `SETUP_ROUND` → `PLAYING` → `ROUND_OVER` → `MATCH_OVER` (loops back to `SETUP_MATCH`/`SETUP_ROUND`).
- `roundState.ts` — 9-tile board, current turn, round winner/draw.
- `optionsState.ts` — sound, music, auto-replay; persisted to AsyncStorage key `@tic-tac-doh:options`. The web bundle's AsyncStorage uses the webview's localStorage, so the same store survives an app restart inside the Capacitor shell. No separate native store.

## Screen flow
Single page, mode-based (`src/app/index.tsx`): `NEW` → SetupGameScreen, `OPTIONS` → OptionsScreen, `PLAY` → PlayGameScreen. Setup/options screens play looping setup music; play stops it.

## CPU AI (`src/services/game.ts`)
- `determineWinner()` checks the 8 winning lines.
- `solveBoard()` builds the game tree recursively.
- `pickMove()`: random tile on an empty board → immediate win → block opponent's win next turn → random valid move. (A "setup a future win" step is a comment only, not implemented.)
- `pickNextMoveOnBoardForPlayer()` is the entry used by the play screen (CPU move delay `CPU_MOVE_DELAY_MS` = 500ms in `PlayGameScreen.tsx`; `design/game-state.md` still says 200ms and is stale).

## Audio
`audioService.tsx` exposes `playSound`, `playMusic`, and `stopMusic`. `selectAudioBackend` in `audioBackend.ts` picks the implementation. The only music key is `setup` (`setup-music.mp3`). `assets/sounds/game-setup-music.mp3` is not a track.

- **Web** keeps `expo-audio` and its current behavior: one effect player and one music player, gated by the options store. Looping setup music restarts from the playback-status listener. Large music files stay out of the service-worker precache.
- **iOS and Android** use `@capacitor-community/native-audio` 8.0.0 behind that same API. Each sound and the one music asset (`music`) are preloaded once. `@capacitor/app` 8.1.2 `appStateChange` silences that music instance when the app is inactive and continues it only when music is enabled and it was playing. Rapid inactive/active toggles reuse that same id. iOS uses `pause` / `resume`. Android uses `stop` / `play`, because that plugin's `pause()` and `resume()` put the asset on an activity resume list that would start setup music again on the next foreground after music was turned off or `stopMusic()`. On iOS, `appStateChange` follows `willResignActive` / `didBecomeActive`, so a phone call pauses and resumes the same instance. `NativeAudio.configure({ focus: false })` selects `AVAudioSession` category ambient, so the hardware silent switch mutes the game.

Metro resolves `@capacitor-community/native-audio` to `dist/esm/index.js` (`metro.config.js`). The package `main` (`dist/plugin.js`) expects a webpack `capacitorExports` global and breaks the static web export.

The plugin cannot play the web bundle's `http://localhost` or `capacitor://` URL (`isUrl: true` is a filesystem path). The mp3s the app already plays are copied to `ios/App/App/sounds/` (bundle resources, loaded by filename) and `android/app/src/main/assets/sounds/` (`sounds/<file>`, with `noCompress 'mp3'` so Android can open them). Web `require()`s are unchanged.

## Native chrome
`npm run generate:native-assets` (`scripts/generate-native-assets.js`) stages the existing artwork and runs `@capacitor/assets` for iOS and Android only. It does not regenerate PWA icons.

- `assets/icon.png` → home-screen icons (`icon-only`)
- `assets/adaptive-icon.png` → Android adaptive foreground. The art is first fit to the square inscribed in a circle, then `@capacitor/assets` insets it 16.7%. The adaptive background inset is `0%` so the mask shows `#fdde97` instead of black corners. Round and squircle masks keep the whole mark.
- `assets/splash-screen.png` and `assets/splash-icon.png` have their artwork background recolored to `#fdde97` (flood fill from the edges, shadows kept), so the splash matches the app and the splash bands are invisible. `capacitor.config.ts` `backgroundColor` `#fdde97` paints the WebView so no white frame appears between the launch screen and the first paint. `src/app/+html.tsx` also paints `html,body` `#fdde97`, because the page canvas is white until the bundle styles it.
- `assets/splash-screen.png` (1024×1536, below the documented 2732×2732 square) → launch splash. It is contained, not cropped, on a `#fdde97` 2732 canvas before generation. `LaunchScreen.storyboard` uses `scaleAspectFit`, so an iPhone shows that whole square instead of aspect-filling the sides off.
- `assets/splash-icon.png` → Android 12 splash icon at `android/app/src/main/res/drawable-nodpi/splash_icon.png`, fit inside the inner two-thirds circle Android actually masks, on `#fdde97`. The portrait `splash-screen` artwork is the full-bleed launch drawable. The iOS launch images are resized to 1366 after generation so the storyboard can draw them.

Portrait is locked to `UIInterfaceOrientationPortrait` for both iPhone and iPad in `Info.plist`, and `android:screenOrientation="portrait"` on the Android activity. iPad stays supported (`TARGETED_DEVICE_FAMILY` 1,2). The centered column's width is capped at 0.62 × window height (see `ui-patterns.md`), so iPad fills the screen.

`src/app/+html.tsx` sets `viewport-fit=cover` on the shared web document (Pages and the native bundle). The existing `SafeAreaView` is the only inset, so the browser PWA is not padded twice. `applyNativeStatusBar()` in `nativeStatusBar.ts` calls `@capacitor/status-bar` 8.0.4 only when `isNativeShell()` is true: background `#fdde97` and `Style.Light` (dark icons on the yellow background). `capacitor.config.ts` sets the same splash and status-bar values so they apply before JavaScript. The status bar overlays the webview.

## PWA
`registerServiceWorker.ts` registers `sw.js` (scope `/tictacdoh/` on GitHub Pages, `/` otherwise). Both registration and `PWAInstallPrompt` return immediately when `isNativeShell()` is true (false when `window` is missing, otherwise `Capacitor.isNativePlatform()`), so the shell does not register a worker or show an install prompt. Browser behavior is unchanged. Generation details in `deployment.md`.
