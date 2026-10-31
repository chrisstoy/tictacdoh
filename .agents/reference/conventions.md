---
name: conventions
description: Path aliases, test placement, formatting/import order, web SSR safety, and store patterns.
---

# Conventions

- **Path aliases:** `@/*` → `src/*`, `@/assets/*` → `assets/*` (tsconfig + jest `moduleNameMapper`). Jest maps `*.mp3` to `jest/fileMock.js` so audio modules load without parsing binary files.
- **Tests:** live beside source in `__test__` directories, `.spec.ts` / `.spec.tsx` extension (e.g. `src/services/__test__/game.spec.ts`). Covered: `game`, `matchState`, `nativeShell`, `nativeStatusBar`, `nativeChrome` (portrait lock and splash/status-bar config), `webViewport`, `registerServiceWorker`, `PWAInstallPrompt`, `useFrameMaxWidth`, `RootLayout` (`src/app/__test__/layout.spec.tsx`: renders before the font loads, splash hides on load or failure), `audioBackend`, `audioService`, `scripts/generate-native-assets`, and `scripts/expoNativeTooling` (web scripts and Capacitor scripts stay; Expo native run/deploy scripts, the dev client dependency, and the Expo `ios`/`android` config blocks are absent; web base path and splash/audio plugins stay). No e2e runner is configured.
- **Formatting (Prettier):** semicolons, single quotes, 2-space tabs, print width 100, es5 trailing commas; imports auto-sorted (react, react-native, expo, `@/`, relative) by `@trivago/prettier-plugin-sort-imports`. Run `npm run format`.
- **Stores:** new Zustand stores follow state → actions → selectors → action hooks and use `withZustandDevtools`.
- **Web/SSR:** web export is static, so guard browser-only APIs with `typeof window !== 'undefined'` (AsyncStorage init, service worker registration).
- **Colors:** use the semantic Tailwind names (`background`, `border`, `text`, `highlight`) — see `ui-patterns.md`.
