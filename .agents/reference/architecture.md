---
name: architecture
description: Stack, directory layout, shared gameRules, multiplayer Worker/DO, Zustand stores and PlayMode state machine, screen flow, CPU AI, and audio.
---

# Architecture

Tic-Tac-Doh: React Native tic-tac-toe on Expo SDK 54 (expo-router 6, React 19, RN 0.81, new arch enabled). The shipping web artifact is a static export and an installable PWA. iOS and Android apps are a Capacitor 8 shell (`capacitor.config.ts`, committed `ios/` and `android/`) that loads that same bundle from `webDir: dist` — not a remote URL. Expo stays the web toolchain (`expo start --web`, `scripts/build-pwa.js`, expo-router). The iPhone and Android apps are the Capacitor shell: `app.config.js` has no `ios` or `android` block, and `package.json` has no native Expo run or deploy script. The Apple Watch app is not that shell. It is a SwiftUI target embedded in the iOS app (ADR 0003). Modes on the phone: human vs human, human vs CPU, CPU vs CPU, with configurable match length (3/5/7/9/infinite rounds). The watch app has the same lengths and the same choices, including CPU vs CPU. Online multiplayer (native shell only; client UI lands in later issues) is authoritative on a Cloudflare Worker + `GameRoom` Durable Object under `workers/multiplayer/`, sharing RN-free rules from `shared/gameRules`.

## Layout

- `src/app/` — expo-router entry (`_layout.tsx`, `index.tsx`, `globals.css`)
- `src/screens/{title,setup,play,options}/` — one screen each; setup and play keep subcomponents in `components/`
- `src/components/` — shared UI; `components/images/` wraps each PNG in `assets/`
- `src/services/` — stores, game logic, audio, service-worker registration, `nativeShell.ts` (`isNativeShell()`), online multiplayer client (`online/`)
- `src/services/online/` — Capacitor client session layer: HTTP create-room, WebSocket protocol client, Zustand `sessionStore`, AsyncStorage reconnect tokens, `applySyncToLocalStores` hydration into match/round stores (UI for create/join/play is later issues)
- `shared/` — RN-free `gameRules` + types used by the app and the multiplayer Worker (`determineWinner`, move validation, match-majority)
- `workers/multiplayer/` — Cloudflare Worker package (`wrangler.jsonc`, hibernatable `GameRoom` DO, Vitest via `@cloudflare/vitest-plugin`)
- `capacitor.config.ts` — `appId` `com.chrisstoy.tictacdoh` (the App Store Connect app, not `com.stoyco.tictacdoh`), `appName` `Tic-Tac-Doh`, `webDir` `dist`
- `ios/`, `android/` — Capacitor native projects (generated web assets, Pods, and `local.properties` stay gitignored)
- `src/animations/` — reanimated helpers (jiggle, push)
- `scripts/` — PWA build pipeline; `public/icons/` generated icons
- `design/game-state.md` — mermaid diagram + per-state behavior of the PlayMode machine
- `ralph/`, `docs/plans/` — prd/ralph autonomous-loop scaffolding, not app code

## Online multiplayer Worker (`workers/multiplayer/`)

Server-authoritative rooms (epic #38). One SQLite-backed `GameRoom` Durable Object per room code (`idFromName(code)`), WebSocket hibernation.

- **HTTP:** `POST /rooms` `{ roundsInMatch }` → `{ code, hostToken, wsUrl, joinPath }`; `GET /join/:code` HTML landing that deep-links `tictacdoh://join/<code>` (native scheme registration is a later issue); `GET /health`
- **WS:** `GET /rooms/:code/ws` — client messages `join` / `move` / `nextRound` / `rematch` / `quit`; server `welcome` / `sync` / `disconnect` / `error` / `roomClosed`. Host seat = X, guest = O. Reconnect with seat token within 60s reclaim; idle empty-room TTL 30 minutes.
- **Local:** `npm run test:multiplayer` (or `npm test` inside `workers/multiplayer/`). `npx wrangler dev` from that package for a local Worker. No CI deploy workflow yet (manual `wrangler deploy` later).
- **CORS:** Worker responses currently omit CORS headers (#46). Capacitor native WebView fetches to `EXPO_PUBLIC_MULTIPLAYER_URL` may need that fix; the client assumes the configured base URL is reachable from the shell and does not work around missing CORS.

## Online client session (`src/services/online/`)

Gated by `EXPO_PUBLIC_MULTIPLAYER_URL` via `isOnlineMultiplayerConfigured()` / `getMultiplayerBaseUrl()` (unset/empty ⇒ online entry stays hidden for later UI). Protocol message types are mirrored in `protocol.ts` (not imported from `workers/`).

- **HTTP:** `createRoom(roundsInMatch)` → builds `inviteUrl` as `${base}${joinPath}`.
- **Session API:** `createOnlineSession` / `joinOnlineSession` / `reconnectOnlineSession` / `sendMove` / `sendNextRound` / `sendRematch` / `leaveOnlineSession`.
- **Zustand `useOnlineSessionStore`:** connection status, seat, room code, inviteUrl, reconnect token, reclaim deadline, last snapshot / error, host/guest connected flags.
- **AsyncStorage** key `@tic-tac-doh:online-session` persists `{ roomCode, reconnectToken, seat }` for reclaim within the Worker disconnect window; cleared on leave / `roomClosed`.
- **`applySyncToLocalStores(snapshot)`:** maps Worker phase → local `playMode` (`WAITING`→`SETUP_ROUND`, `PLAYING`→`PLAYING`, `ROUND_OVER`→`ROUND_OVER`, `MATCH_OVER`|`CLOSED`→`MATCH_OVER`), hydrates board/turn/round winner/draw and match rounds/winner/roundsInMatch, forces both `isCPU` false, and sets options `autoReplay` to false. Authoritative — does not replay local `applyMove`/`recordRound`.

## State (Zustand v5)

Four stores, each wrapped in `withZustandDevtools` (`zustandDevtools.ts`; real devtools only when `__DEV__` on web, otherwise a no-op) and following state → actions → selectors → action hooks:

- `matchState.ts` — rounds in match, `isCPU` per player, round history, match winner, and `playMode`: `SETUP_MATCH` → `SETUP_ROUND` → `PLAYING` → `ROUND_OVER` → `MATCH_OVER` (loops back to `SETUP_MATCH`/`SETUP_ROUND`).
- `roundState.ts` — 9-tile board, current turn, round winner/draw.
- `optionsState.ts` — sound, music, auto-replay; persisted to AsyncStorage key `@tic-tac-doh:options`. The web bundle's AsyncStorage uses the webview's localStorage, so the same store survives an app restart inside the Capacitor shell. No separate native store.
- `online/sessionStore.ts` — online connection status, seat, room code, inviteUrl, reclaim deadline, last sync (not persisted beyond reconnect creds in AsyncStorage).
- `appVersion.ts` — `useAppVersion()` for the Options screen footer. Inside the Capacitor shell it is `App.getInfo()` from `@capacitor/app`: the installed marketing version and build number, shown as `v1.0 (60)`. On web, and until the native lookup resolves or if it fails, it is `v<package.json version>` with no build, so the first render matches the prerendered HTML.

## Screen flow

Single page, mode-based (`src/app/index.tsx`): cold start is `TITLE` → `TitleScreen`. Play opens `NEW` → `SetupGameScreen`. `OPTIONS` → `OptionsScreen`. `PLAY` → `PlayGameScreen`. Quitting a match still returns to setup (`NEW`), not the title. Title, setup, and options play looping setup music via `playMusic('setup', { loop: true })`, which stays silent when the music option is off. Play stops it.

`TitleScreen` shows `assets/splash-screen.png` contained (not cropped) on `#fdde97`, through `MascotImage`, with a Play control under the artwork. Play is `assets/play.png` via `PlayImage`, the `start-game.png` pill with PLAY drawn in Arial Black. The control's accessibility label is Play. While reduce motion is off it idles with a repeating scale pulse; a press plays the existing `push` sound and opens setup. The artwork shown is `assets/mascot/base.png`: the splash with the eyes, brows, and mouth painted out from nearby fur. `assets/mascot/{eye-left,eye-right,brow-left,brow-right,mouth}.png` are those features cut out with transparency. `scripts/build-mascot-assets.py` (Pillow only) regenerates all six from `assets/splash-screen.png` and prints each part's box; those boxes are `PART_BOXES` in `faceLayout.ts`, as fractions of the base image. `MascotFace` places each part at its box and animates it with Reanimated: eyes blink (vertical squash) and look left or right, each brow lifts or furrows (rotates, dropping its inner end), and the mouth shrinks to a small "oh" or crossfades to a flat bar. `faceMotion.ts` gives each feature its own looping timeline (`EYES_TIMELINE` 6.1 s, `BROWS_TIMELINE` 8.3 s, `MOUTH_TIMELINE` 11.7 s, no shared factor, so the combinations keep changing); `facePoseAt(elapsedMs)` samples all three, and the screen re-renders only when `poseKey` changes. `useReducedMotion` holds the face at rest and skips the Play pulse. Rest is the original expression, so the first frame matches the launch splash. The watch splash is a separate SwiftUI screen and is unchanged. The native launch splash is the original `splash-screen.png` (with features), so it hands off onto this screen.

## watchOS app

ADR 0003. `ios/App/TicTacDohWatch` is a single-target SwiftUI app (`com.chrisstoy.tictacdoh.watchkitapp`, watchOS 10.0) embedded in the iOS `App` target via an Embed Watch Content phase. `scripts/add-watchos-target.py` is idempotent if a Capacitor sync rewrites `project.pbxproj` and drops the target. There is no WatchConnectivity and no web bundle on the watch.

Rules, `pickMove`, and the match/round machine are a Swift copy of `src/services/game.ts` and `src/services/matchState.ts`, not a shared library. `pickMove` is still random opening, immediate win, block, random continuation. `test-fixtures/game-cases.json` (regenerated by `scripts/generate-game-fixtures.mjs`) is loaded by `gameFixtures.spec.ts` and by `TicTacDohWatchTests`. Cold start shows a splash (`SplashScreen` art + **Play**); Play opens setup. Setup defaults to X Meatbag, O Clanker, 3 rounds. Either or both players can be Clanker (CPU). When it is a CPU's turn, that side moves after 500 ms, including when both players are CPU, until the round ends. The board stays up at round end and match end, with the winning line highlighted, and the result banner sits with Next Round or New Match (`WordmarkText` + `WatchActionChrome`); round/match result lines are `WordmarkText` too (winner mark + `WINS` / `WINS THE MATCH`, or draw wording). X and O use `MarkX`/`MarkO` asset images (setup, score bar, tiles) on `#fdde97`. Setup player rows show the mark plus outlined orange `WordmarkText` (`MEATBAG`/`CLANKER`); Start Game is the same `WordmarkText` on an orange pill colored from `start-game.png`. The rounds row uses the same `WordmarkText` (`N ROUNDS` / `ENDLESS`). Haptics use `WKInterfaceDevice` (click, success, failure, retry). No sound.

## CPU AI (`src/services/game.ts`)

- `determineWinner()` lives in `shared/gameRules` (8 winning lines) and is re-exported from `game.ts` so Jest fixtures keep importing from `game.ts`.
- `solveBoard()` builds the game tree recursively.
- `pickMove()`: random tile on an empty board → immediate win → block opponent's win next turn → random valid move. (A "setup a future win" step is a comment only, not implemented.)
- `pickNextMoveOnBoardForPlayer()` is the entry used by the play screen (CPU move delay `CPU_MOVE_DELAY_MS` = 500ms in `PlayGameScreen.tsx`).

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
- `assets/splash-screen.png` and `assets/splash-icon.png` have their artwork background recolored to `#fdde97` (flood fill from the edges, shadows kept), so the splash matches the app and the splash bands are invisible. `capacitor.config.ts` `backgroundColor` `#fdde97` paints the WebView so no white frame appears between the launch screen and the first paint. `src/app/+html.tsx` also paints `html,body` `#fdde97`, because the page canvas is white until the bundle styles it. On Android, `AppTheme.NoActionBar` sets `android:windowBackground` `#fdde97`; without it the status and navigation bar areas showed light gray for about a second after the splash.
- `assets/splash-screen.png` (1024×1536, below the documented 2732×2732 square) → launch splash. It is contained, not cropped, on a `#fdde97` 2732 canvas before generation. `LaunchScreen.storyboard` uses `scaleAspectFit`, so an iPhone shows that whole square instead of aspect-filling the sides off.
- `assets/splash-icon.png` → Android 12 splash icon at `android/app/src/main/res/drawable-nodpi/splash_icon.png`, fit inside the inner two-thirds circle Android actually masks, on `#fdde97`. The portrait `splash-screen` artwork is the full-bleed launch drawable. The iOS launch images are resized to 1366 after generation so the storyboard can draw them.

Portrait is locked to `UIInterfaceOrientationPortrait` for both iPhone and iPad in `Info.plist`, and `android:screenOrientation="portrait"` on the Android activity. iPad stays supported (`TARGETED_DEVICE_FAMILY` 1,2). The centered column's width is capped at 0.62 × window height (see `ui-patterns.md`), so iPad fills the screen.

`src/app/+html.tsx` sets `viewport-fit=cover` on the shared web document (Pages and the native bundle). The existing `SafeAreaView` is the only inset, so the browser PWA is not padded twice. `applyNativeStatusBar()` in `nativeStatusBar.ts` calls `@capacitor/status-bar` 8.0.4 only when `isNativeShell()` is true: background `#fdde97` and `Style.Light` (dark icons on the yellow background). `capacitor.config.ts` sets the same splash and status-bar values so they apply before JavaScript. The status bar overlays the webview.

## Hydration

The static export prerenders the whole route tree, and `expo-font` reports fonts as loaded on the server (`useStaticFonts` in `expo-font/build/FontHooks.js`, selected when `window` is undefined). `RootLayout` therefore renders its tree on the first client render even while the Komigo font is still loading (text swaps when it arrives). Returning `null` until `useFonts` resolved made the first client render differ from the prerendered HTML and threw React error #418 on every load, web and Capacitor alike. Do not gate `RootLayout` on font state.

## PWA

`registerServiceWorker.ts` registers `sw.js` (scope `/tictacdoh/` on GitHub Pages, `/` otherwise). Both registration and `PWAInstallPrompt` return immediately when `isNativeShell()` is true (false when `window` is missing, otherwise `Capacitor.isNativePlatform()`), so the shell does not register a worker or show an install prompt. Browser behavior is unchanged. Generation details in `deployment.md`.
