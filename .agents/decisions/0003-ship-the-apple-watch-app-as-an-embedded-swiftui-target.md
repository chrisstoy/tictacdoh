---
name: ship-the-apple-watch-app-as-an-embedded-swiftui-target
description: Ship the Apple Watch app as an embedded SwiftUI target
---

# 0003. Ship the Apple Watch app as an embedded SwiftUI target

## Status

Accepted

## Context

Recorded 2026-10-28. ADR 0001 ships iOS and Android by wrapping the Expo web build in Capacitor. watchOS has no WKWebView and cannot run React Native or Capacitor, so that shell cannot be the watch app. The game rules and CPU are a few hundred lines in `src/services/game.ts` and `src/services/matchState.ts`. The watch app has to ship in the existing App Store Connect record (`com.chrisstoy.tictacdoh`, app `6826927007`), and the owner's Xcode can build the watchOS 26.5 SDK.

## Decision

We will add a single-target SwiftUI watchOS app to `ios/App/App.xcodeproj` and embed it in the iOS `App` target. Bundle id `com.chrisstoy.tictacdoh.watchkitapp`. Minimum watchOS 10.0 (`NavigationStack`, and the current App Store floor the plan already chose). The watch app is standalone: it does not sync with the phone.

Game rules, `pickMove`, and the match/round state machine are duplicated in Swift. They are not a shared library. A committed `test-fixtures/game-cases.json` is loaded by both Jest and the watch XCTest target so the two copies cannot drift quietly. `pickMove` stays the current heuristic (random opening, immediate win, block, random continuation). It is not minimax, and this port does not improve it.

Rejected: a separate App Store listing. It would be a second record, a second review, and a second TestFlight train for an app that is played as part of Tic-Tac-Doh.

Rejected: running the TypeScript rules on the watch through JavaScriptCore. The logic is small, and a JS bridge plus a bundled script is more machinery than a Swift port. A Kotlin or C shared core was the same trade the other way: one implementation, and a build system the rest of this repo does not have.

Rejected: raising the floor above watchOS 10.0 just because the installed SDK is 26.5. The SDK still accepts 10.0, and 10.0 is what the watch app's navigation needs.

## Consequences

- `scripts/release-ios.sh` archives scheme `App` unchanged. The embedded watch app is a dependency of that target, so the archive contains it. Uploading still needs an explicit go-ahead; registering `com.chrisstoy.tictacdoh.watchkitapp` is an Apple Developer portal side effect of the first signed archive.
- Two implementations of the rules have to be edited together. The fixture file is the check. A change to `pickMove` that does not update the fixtures fails Jest; the same file fails XCTest if Swift was not updated.
- `cap sync` must keep the watch target. If a future Capacitor upgrade rewrites `project.pbxproj` and drops it, the iOS archive silently ships without the watch app.
- CI does not build the watch app. Verification is local `xcodebuild`.
- The phone game is unchanged. There is no WatchConnectivity.
