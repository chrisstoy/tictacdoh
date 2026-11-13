---
name: use-authoritative-durable-object-rooms-for-native-multiplaye
description: Use authoritative Durable Object rooms for native multiplayer
---

# 0004. Use authoritative Durable Object rooms for native multiplayer

## Status

Accepted

## Context

Recorded 2026-11-13 after epic #38 shipped Create/Join/Lobby, in-match play, and
`tictacdoh://` deep links on the Capacitor shell (#39–#43). Offline modes already
run entirely on-device (ADR 0001). Online multiplayer needs a shared room that
both seats trust for board state, turn order, rematch, and forfeit — especially
when one client disconnects mid-match. The shipping clients are iOS and Android
Capacitor shells; the GitHub Pages PWA and the embedded watchOS app (ADR 0003)
are not online targets. The team already chose Cloudflare Workers tooling for
the room server (`workers/multiplayer/`, Worker name `tictacdoh-multiplayer`,
hibernatable `GameRoom` Durable Object) and a shared RN-free rules module under
`shared/gameRules`. CORS for Capacitor WebView fetches remains an open gap (#46).

## Decision

We will run native online multiplayer as **server-authoritative rooms** on a
Cloudflare Worker with one SQLite-backed `GameRoom` Durable Object per room code.
Clients open a WebSocket to the room, send intent messages (`join` / `move` /
`nextRound` / `rematch` / `quit`), and apply server `sync` snapshots into local
Zustand stores. Seat tokens reclaim a disconnect within a short window; empty
rooms idle out. Online UI stays behind `EXPO_PUBLIC_MULTIPLAYER_URL` and
`isNativeShell()`.

Rejected:

- **Peer-to-peer (device-to-device) rooms** — no single authority for conflict,
  reclaim, or forfeit; NAT and backgrounding make a reliable two-phone match
  harder than a small DO room.
- **Managed PartyKit hosted platform** — would outsource rooms to a separate
  hosted product and another vendor surface; the project already owns a Worker +
  DO package and wants deploy/control in-repo via Wrangler, not a second
  platform account.
- **Web/PWA and watchOS online multiplayer** — out of scope for this ADR. The
  PWA has no Create/Join gate or deep-link flow; the watch app has no network
  multiplayer path. Revisit only with a new ADR.

## Consequences

Easier: one authoritative timeline per match; reconnect/forfeit semantics live
on the server; the same `shared/gameRules` module serves app and Worker; native
clients stay thin (session + hydration).

Harder or accepted costs: production needs a manual `wrangler deploy` of
`workers/multiplayer` and a baked `EXPO_PUBLIC_MULTIPLAYER_URL` in the native
bundle; Worker availability and CORS (#46) become runtime dependencies; web and
watch remain offline-only until a later decision; agents must not add a Worker
CI/deploy GitHub Action without explicit permission (see AGENTS.md guardrail).
