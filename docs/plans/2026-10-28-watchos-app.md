# Plan: Apple Watch (watchOS) app

Status: draft, not started. Written for an implementing agent. Follow `AGENTS.md` (refine → plan → TDD → reference docs → PR → manual test).
Issue: https://github.com/chrisstoy/tictacdoh/issues/22

## Goal
A native SwiftUI watchOS app: play Tic-Tac-Doh on the wrist, human vs CPU and human vs human (pass-the-wrist is silly but free), best-of-N matches. Ships inside the existing iOS app record in App Store Connect (`com.chrisstoy.tictacdoh`, app `6826927007`).

## Why not reuse the current app
The iOS/Android apps are a Capacitor WebView around the Expo web bundle (ADR 0001). watchOS has no WKWebView and cannot run React Native or Capacitor. Only the **rules and AI** are portable, by rewriting in Swift. The watch app is independent code; it does not touch the web bundle.

## Non-goals
- No sync with the phone game (no WatchConnectivity, no Capacitor plugin). Standalone only.
- No CPU-vs-CPU mode, no options screen beyond what is listed below.
- No music. No web/PWA/Android changes.
- No changes under `.github/workflows/` (guardrail: needs explicit user permission). CI will not build or test the watch app; verification is local.
- Do not publish web (`deploy-app` skill rules).

## Decisions to settle first (record as ADR 0003 via `dark-factory:record-decision`)
1. **Standalone watch app embedded in the iOS app** (watchOS target added to `ios/App/App.xcodeproj`), vs a separate App Store record. Recommended: embedded, so one listing and one TestFlight build. Bundle id `com.chrisstoy.tictacdoh.watchkitapp`. Single-target "watch-only app" (`WKApplication`, no WatchKit extension) on watchOS 10+ is the modern layout.
2. **Game logic duplicated in Swift**, not shared. Rejected: embedding JS (JavaScriptCore on watchOS works but adds a bridge and bundling for ~150 lines of logic); Kotlin/C shared core (overkill). Cost: two implementations to keep in sync; mitigate with a shared fixtures file (below).
3. **Minimum watchOS**: recommend 10.0 (SwiftUI `NavigationStack`, current App Store requirement trend). Confirm against the owner's watch.

## Confirm with the user before coding (blockers)
- Apple Developer team `J866FQ2YZ9` can register the new bundle id; the user creates it or allows automatic signing to (`-allowProvisioningUpdates` already used).
- Is the Xcode installation capable of building watchOS (watchOS SDK + simulator runtime installed)? Check `xcodebuild -showsdks`.

## Behavior spec (mirror the phone game)
- Board: 9 tiles, indices 0–8; lines `[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]`.
- Setup screen: Player X and Player O each Human/CPU (default X human, O CPU), rounds 3/5/7/9/∞ (default match with the phone's default; read `src/screens/setup/` and `matchState.ts`).
- Play: tap an empty tile to place; CPU moves after 500 ms (`CPU_MOVE_DELAY_MS`). Round over → winner/draw banner + "Next round". Match over → winner + "New match". Quit returns to setup.
- Match winner = first to a majority of rounds (read `matchState.ts` for exact rule, including ∞ and draws; port it exactly).
- CPU = same `pickMove` order as `src/services/game.ts`: random tile on empty board → immediate win → block opponent's immediate win → random valid move. Note: it is *not* minimax; do not "improve" it.
- Haptics (`WKInterfaceDevice.current().play(...)`) on place/win/lose/draw. Optional short sound effects: skip in v1 (watch audio needs a speaker route and ambient-session handling).
- Digital Crown/accessibility: VoiceOver labels per tile ("Top left, empty / X / O").
- Art: reuse `assets/X.png`, `O.png`, `board.png`, `title.png` as watch asset-catalog images, or draw X/O in SwiftUI shapes (simpler, crisper at 40–49 mm; recommended). Background `#fdde97` to match the app.

## Files touched / created
- `ios/App/App.xcodeproj/project.pbxproj` — new watchOS app target + embed into App target; shared scheme committed. Prefer adding the target via Xcode UI or a scripted tool and committing the result; do not hand-edit pbxproj blindly.
- `ios/App/TicTacDohWatch/` (new):
  - `TicTacDohWatchApp.swift`
  - `Game/Board.swift`, `Game/Rules.swift` (`determineWinner`), `Game/CPU.swift` (`pickMove`), `Game/Match.swift` (match/round state machine; modes `setupMatch → setupRound → playing → roundOver → matchOver`, see `design/game-state.md`)
  - `Views/SetupView.swift`, `Views/PlayView.swift`, `Views/TileView.swift`, `Views/RoundOverView.swift`, `Views/MatchOverView.swift`
  - `Assets.xcassets` (AppIcon for watchOS, accent color)
  - `Info.plist` settings: `WKCompanionAppBundleIdentifier = com.chrisstoy.tictacdoh`, `ITSAppUsesNonExemptEncryption = false`
- `ios/App/TicTacDohWatchTests/` (new XCTest target) — unit tests for rules, CPU, match.
- `test-fixtures/game-cases.json` (new, repo root or `src/services/__test__/`) — shared board cases `{board, turn, expectedWinnerLine, expectedImmediateWinMoves, expectedBlockMoves}`. Consumed by **both** `game.spec.ts` (jest) and the XCTest target so the two implementations cannot drift silently. Add a jest test that loads it.
- `scripts/release-ios.sh` — the `xcodebuild archive` for scheme `App` should now pick up the embedded watch app automatically; verify, and change `-destination 'generic/platform=iOS'` only if the archive omits the watch app. Do not pass `-authenticationKey*` flags (see deployment.md).
- `scripts/ExportOptions.plist` — likely unchanged; verify automatic signing creates the watch provisioning profile.
- `.agents/reference/architecture.md` — add a "watchOS app" section (layout, separate Swift logic, fixtures parity). Fix the "Native apps are the Capacitor shell only" sentence.
- `.agents/reference/deployment.md` — iOS row/Native release: embedded watch target, bundle id, min watchOS, how to test on a watch/simulator, archive now contains watch app.
- `.agents/reference/commands.md` — add `xcodebuild test` command for the watch unit tests.
- `.agents/skills/deploy-app/SKILL.md` — iOS section: mention the watch app ships with the iOS archive and any extra checks.
- `.agents/decisions/0003-…md` + update `.agents/decisions/README.md` index.

## Implementation steps (small, verifiable chunks; red/green TDD)
1. **Env check + ADR.** `xcodebuild -showsdks`, list watchOS simulators. Write ADR 0003. Verify: ADR in index.
2. **Shared fixtures + jest test.** Generate cases from the existing JS logic; add a jest spec that asserts the current TS code matches. Verify: `npm test` green.
3. **Add the watchOS target + empty app + test target.** Verify: `xcodebuild -project ios/App/App.xcodeproj -scheme TicTacDohWatch -destination 'platform=watchOS Simulator,name=<Apple Watch Series 10 (46mm)>' build` succeeds, and the iOS `App` scheme still builds.
4. **Rules (`determineWinner`) — test first** against the fixtures. Verify: `xcodebuild test` on the watch test target.
5. **CPU `pickMove` — test first.** Deterministic assertions only: the returned move ∈ expected set from fixtures (random tie-breaks make exact moves unsuitable). Inject an RNG protocol for reproducibility.
6. **Match/round state machine — test first**, mirroring `matchState.spec.ts` cases (all round counts, ∞, draws, quit).
7. **Views.** Setup → Play → Round over → Match over. Verify on 41/45/49 mm simulators: nothing clipped, tiles ≥ 44 pt hit target where possible, no scrolling on play screen.
8. **Haptics + VoiceOver labels + icon + launch.** Verify on simulator (haptics need a real watch).
9. **Release path.** Run `scripts/release-ios.sh` only if the user asks (it uploads to App Store Connect and is an outward action); otherwise do `xcodebuild archive` locally to `build/` and confirm the `.xcarchive` contains `Watch/*.app`. Bump nothing manually (versions come from the script).
10. **Reference docs + PR** per `AGENTS.md`. PR "How to test" checklist below.

## Verification (definition of done)
- `npm run lint`, `npm run format:check`, `npm test` pass (fixtures spec included). Commands: `.agents/reference/commands.md`.
- Watch unit tests pass via `xcodebuild test`.
- Existing iOS `App` scheme builds and archives; app behavior unchanged.
- Local archive contains the embedded watch app; signing resolves without manual profile work.
- No e2e framework exists for watchOS; the manual checklist below substitutes. Say so in the PR.

## PR "How to test" checklist (draft)
- [ ] `npm test` and lint pass
- [ ] Watch unit tests pass (`xcodebuild test`, scheme `TicTacDohWatch`)
- [ ] Simulator 41 mm: setup → human vs CPU → play to win, lose, draw
- [ ] Simulator 49 mm: layout not clipped; match to 3 rounds completes; New match works
- [ ] Human vs human: turns alternate, win line highlighted
- [ ] CPU blocks an obvious loss and takes an immediate win
- [ ] Quit mid-round returns to setup
- [ ] VoiceOver reads tile states
- [ ] Real watch: haptics fire; app launches standalone without iPhone nearby (leave unchecked if no device — say so)
- [ ] iOS app still builds and runs (`npm run build:native && npm run cap:sync`, then Xcode run)
- [ ] Local archive contains the watch app
- [ ] TestFlight build installs the watch app (only after the user authorizes a release)

## Risks
- **Signing/profile creation** for a new bundle id and watch app is the likeliest time sink; automatic signing with the Xcode-signed-in account is the proven path here.
- **pbxproj merge conflicts / hand-editing**: let Xcode create the target; keep the diff minimal.
- **App Store requirements**: watch-specific screenshots (required when the watch app is included) and review notes are a manual App Store Connect step for the user. Capture simulator screenshots into `docs/app-store-screenshots/watch/`.
- **Capacitor `cap sync`** regenerates parts of `ios/`; confirm it does not touch the new target (release script fails on tracked drift).
- **Logic drift** between TS and Swift; mitigated by the shared fixtures.
- Hard-to-reverse/outward actions (registering the bundle id, uploading to TestFlight, App Store submission) need explicit user go-ahead each time.

## Follow-ups (separate issues, not this one)
- Phone ↔ watch sync or watch as a remote.
- Complication / Smart Stack widget showing match score.
- Sound effects on watch.
- Fix the stale `design/game-state.md` CPU delay (200 ms vs 500 ms) noted in architecture.md.
