---
name: enable-durable-object-multiplayer-on-the-web-pwa
description: Enable Durable Object multiplayer on the web PWA
---

# 0005. Enable Durable Object multiplayer on the web PWA

## Status

Accepted

Supersedes the web/PWA exclusion in
[0004](0004-use-authoritative-durable-object-rooms-for-native-multiplaye.md).
WatchOS multiplayer remains out of scope (ADR 0003 / 0004).

## Context

Recorded 2026-11-13. ADR 0004 shipped authoritative Durable Object rooms for
**native** Capacitor clients only (`isOnlineSetupAvailable` required
`isNativeShell()`). The GitHub Pages PWA
(https://chrisstoy.github.io/tictacdoh/) shares the same React bundle and can
speak the same Worker protocol over HTTPS/WSS. Product wants web Create/Join,
SMS invite parity, and web↔iOS↔Android cross-play without a second stack.
Blocked previously by: native-only gate, Pages Origin missing from Worker CORS,
Pages build not baking `EXPO_PUBLIC_MULTIPLAYER_URL`, Capacitor-only Share, and
`/join` landing that only opened `tictacdoh://`.

## Decision

We will expose Online multiplayer on the **web/PWA** using the **same** Worker,
protocol, lobby, and play path as native:

- Gate Online on Worker URL only (`isOnlineMultiplayerConfigured()`).
- Allowlist Pages Origin `https://chrisstoy.github.io` in Worker CORS defaults;
  bake `EXPO_PUBLIC_MULTIPLAYER_URL` into the Pages workflow Build step (explicit
  permission granted for that workflow edit).
- `/join/:code` landing tries the app scheme, then falls back to
  `WEB_JOIN_BASE/?join=<CODE>` (default Pages base); the PWA consumes `?join=`
  on cold start.
- Share uses Capacitor on native and Web Share / clipboard on the browser.

Rejected: keeping web offline-only (would force two clients for cross-play and
block browser testing of rooms). Rejected: a separate web-only signaling path
(duplicates ADR 0004’s DO authority).

## Consequences

Easier: one room model for all three clients; invite links work for friends
without the store app; local web QA against the same Worker.

Harder: Pages deploys must keep the Worker URL env in CI; CORS must stay
aligned with the Pages Origin; join landing must not strand desktop browsers on
a failed custom-scheme navigation. WatchOS stays offline-only until a future
ADR.
