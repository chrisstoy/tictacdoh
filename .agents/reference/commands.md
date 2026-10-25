---
name: commands
description: Every npm command for dev, test, lint, format, build, and deploy in this Expo project.
---

# Commands

All via npm (`package-lock.json`). No monorepo tooling.

## Development
```bash
npm start              # Expo dev server (platform menu)
npm run ios            # Expo dev client, iOS simulator (not the Capacitor shell)
npm run android        # Expo dev client, Android emulator (not the Capacitor shell)
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
npm run deploy         # expo export -p web + eas-cli deploy (EAS Hosting)
npm run generate:icons | generate:manifest | generate:sw   # individual PWA steps
```
See `deployment.md` for targets and env vars.

## Capacitor shell
`build:native` then `cap:sync` copies `dist/` into the native projects. `npm run ios` / `npm run android` are still the Expo dev client (#9).
```bash
npm run cap:sync       # cap sync
npm run cap:ios        # cap open ios (Xcode)
npm run cap:android    # cap open android (Android Studio)
```
