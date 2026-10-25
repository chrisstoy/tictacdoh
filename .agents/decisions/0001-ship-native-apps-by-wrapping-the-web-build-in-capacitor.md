---
name: ship-native-apps-by-wrapping-the-web-build-in-capacitor
description: Ship native apps by wrapping the web build in Capacitor
---

# 0001. Ship native apps by wrapping the web build in Capacitor

## Status

Accepted

## Context

Recorded 2026-10-25. The game began as a Vite web app and was converted to Expo
(SDK 54, expo-router, react-native-web) on 2025-12-15 for cross-platform reach
(commit `d4f665e`). The web build ships today as an installable PWA on GitHub
Pages. The goal is now iOS and Android store releases, with the web app embedded
in the native apps. No native release pipeline exists: there is no `eas.json`,
and `npm run ios`/`android` only run the Expo dev client. The game is simple
(no backend, no native-only features beyond audio), so the web build already
covers everything the app does.

## Decision

We will ship iOS and Android builds by wrapping the existing static web export
(`dist/`) in Capacitor, with the web build bundled in the app (not loaded from a
URL). Capacitor's `ios/` and `android/` projects are committed. Expo remains only
as the toolchain that produces the web build; Expo native tooling
(`expo-dev-client`, Expo `ios`/`android` scripts and config, EAS deploy script)
is removed. On native platforms, audio uses a Capacitor audio plugin because
webviews restrict autoplay; the web build keeps `expo-audio` and its current
behavior.

Rejected: finishing the Expo-native path (EAS builds with the React Native
runtime). It would run the app as true React Native, but it needs EAS setup and
credentials, and it leaves the web build as a separate target that already works.
Capacitor reuses that web build as the single source of truth for all three
platforms, which is the stated goal.

## Consequences

Easier: one codebase and one build artifact for web, iOS and Android; the proven
web build and PWA work are reused; native config is plain Xcode/Android Studio
projects.

Harder or accepted costs: the app runs in a webview, so performance and audio
behavior depend on the platform webview rather than native React Native
rendering; `react-native-reanimated` animations run via web equivalents and need
verifying on devices; audio needs a platform-specific code path; committed
`ios/` and `android/` folders add native config to maintain and review; the
service worker and PWA install prompt must be disabled inside the native shell;
reversing this later means reintroducing Expo native tooling.
