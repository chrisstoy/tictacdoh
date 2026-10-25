---
name: commands
description: Every npm command for dev, test, lint, format, build, and deploy in this Expo project.
---

# Commands

All via npm (`package-lock.json`). No monorepo tooling.

## Development
```bash
npm start              # Expo dev server (platform menu)
npm run web            # Browser
```

## Tests
Unit only (Jest, `jest-expo` preset). **No e2e runner is configured** (no Playwright/Cypress/Detox) — say so explicitly in PRs rather than assuming one.
```bash
npm test               # all tests
npm run test:watch
npm run test:coverage
```

## Code quality
```bash
npm run lint           # expo lint (ESLint 9, eslint-config-expo)
npm run format         # prettier --write .
npm run format:check
npx tsc --noEmit       # type-check (no script defined; TypeScript ~5.9)
```

## Build & deploy
```bash
npm run build          # PWA pipeline: scripts/build-pwa.js -> dist/
npm run build:native   # same pipeline with GITHUB_PAGES forced unset (base path /)
npm run generate:icons | generate:manifest | generate:sw   # individual PWA steps
npm run generate:native-assets   # iOS/Android icons and splashes via @capacitor/assets
```
See `deployment.md` for targets and env vars.

## Capacitor shell
`build:native` then `cap:sync` copies `dist/` into the native projects. `npm run generate:native-assets` regenerates committed iOS and Android icons and splashes from `assets/icon.png`, `adaptive-icon.png`, `splash-icon.png`, and `splash-screen.png`. There is no Expo `ios` or `android` script. Open the native IDEs with `cap:ios` / `cap:android`. After sync, `npx cap run ios` and `npx cap run android` launch a simulator or emulator.
```bash
npm run cap:sync       # cap sync
npm run cap:ios        # cap open ios (Xcode)
npm run cap:android    # cap open android (Android Studio)
npx cap run ios        # simulator, after build:native and cap:sync
npx cap run android    # emulator, after build:native and cap:sync
```

## Store release
See `deployment.md`. These refuse a dirty tree and upload (iOS) or build (Android) from `main`.
```bash
npm run release:ios                         # archive + App Store Connect upload
bash scripts/setup-android-signing.sh       # once
npm run release:android                     # signed .aab in build/release/
python3 scripts/upload-android.py           # dry run
python3 scripts/upload-android.py --apply   # Play internal track
```
