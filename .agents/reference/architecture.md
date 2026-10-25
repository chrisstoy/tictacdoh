---
name: architecture
description: Stack, directory layout, Zustand stores and PlayMode state machine, screen flow, CPU AI, and audio.
---

# Architecture

Tic-Tac-Doh: React Native tic-tac-toe on Expo SDK 54 (expo-router 6, React 19, RN 0.81, new arch enabled). The shipping web artifact is a static export and an installable PWA. iOS and Android apps are a Capacitor 8 shell (`capacitor.config.ts`, committed `ios/` and `android/`) that loads that same bundle from `webDir: dist` — not a remote URL. Expo's `ios` / `android` dev-client scripts are still in `package.json` until #9 removes them. Modes: human vs human, human vs CPU, CPU vs CPU, with configurable match length (3/5/7/9/infinite rounds).

## Layout
- `src/app/` — expo-router entry (`_layout.tsx`, `index.tsx`, `globals.css`)
- `src/screens/{setup,play,options}/` — one screen each, with `components/`
- `src/components/` — shared UI; `components/images/` wraps each PNG in `assets/`
- `src/services/` — stores, game logic, audio, service-worker registration, `nativeShell.ts` (`isNativeShell()`)
- `capacitor.config.ts` — `appId` `com.stoyco.tictacdoh`, `appName` `Tic-Tac-Doh`, `webDir` `dist`
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
`audioService.tsx`: React context for effects + music via `expo-audio`, gated by options state. Large music files are excluded from the service-worker precache.

## PWA
`registerServiceWorker.ts` registers `sw.js` (scope `/tictacdoh/` on GitHub Pages, `/` otherwise). Both registration and `PWAInstallPrompt` return immediately when `isNativeShell()` is true (false when `window` is missing, otherwise `Capacitor.isNativePlatform()`), so the shell does not register a worker or show an install prompt. Browser behavior is unchanged. Generation details in `deployment.md`.
