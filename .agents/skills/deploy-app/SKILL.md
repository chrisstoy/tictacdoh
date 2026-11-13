---
name: deploy-app
description: Build and deploy Tic-Tac-Doh to a chosen target (GitHub Pages web/PWA, App Store Connect, Google Play internal testing, or the multiplayer Cloudflare Worker). Use when the user asks to deploy, ship, release, promote, or push a build of this project — including "deploy to production", "cut a build", "deploy the Worker". Do NOT use for running the app locally; that's the dev server, see .agents/reference/commands.md.
references:
  - production-web
  - ios
  - android
  - multiplayer-worker
---

# Deploy Tic-Tac-Doh

Deployment is deliberately **not** part of the per-issue loop. `work-issue` and
`run-issue-autonomously` both stop at merge. This skill runs when a human
decides some batch of merged work is ready for a real-infrastructure check.
Nothing invokes it automatically.

Facts (bundle id, signing gotchas, version rules) live in
`.agents/reference/deployment.md` and ADR 0002. This file is the router;
platform procedure lives in the referenced subskills. Do not deploy by
improvising around them.

## How to use

1. Identify the target from the user's request (or ask once if ambiguous).
2. Run **Preflight — every target** below.
3. Open and follow the matching subskill under `references/`:

| Target | Subskill |
| ------ | -------- |
| `production-web` (GitHub Pages, https://chrisstoy.github.io/tictacdoh/) | [references/production-web.md](references/production-web.md) |
| `ios` (`com.chrisstoy.tictacdoh`, App Store Connect app `6826927007`) | [references/ios.md](references/ios.md) |
| `android` (`com.chrisstoy.tictacdoh`) | [references/android.md](references/android.md) |
| `multiplayer-worker` (`tictacdoh-multiplayer`) | [references/multiplayer-worker.md](references/multiplayer-worker.md) |

4. Do not load every subskill — only the target being deployed.

## Targets (summary)

| Target | Deploys from | Mechanism |
| ------ | ------------ | --------- |
| `production-web` | `main` | `.github/workflows/main.yml`, `workflow_dispatch` only. Merging to `main` does **not** deploy |
| `ios` | `main`, clean tree | `scripts/release-ios.sh` archives and uploads |
| `android` | `main`, clean tree | `scripts/release-android.sh`, then `scripts/upload-android.py` |
| `multiplayer-worker` | any clean tree | Manual `npx wrangler deploy` from `workers/multiplayer/` — **no** GitHub Actions |

No preview/staging target exists. Web hosting is GitHub Pages only. There is
no EAS, no fastlane, and no store workflow in CI. Play Console has no app yet.
Do **not** create a Worker deploy workflow unless the human explicitly approves
Actions changes (AGENTS.md).

## Preflight — every target

- [ ] On `main`, up to date with `origin/main`. The native scripts enforce this (`ALLOW_NON_MAIN=1` is an emergency override and must be in the report).
- [ ] Working tree clean. `git status --short` is empty.
- [ ] Full clone. A shallow clone makes the store build number wrong.
- [ ] Full verification suite green locally — see `.agents/reference/commands.md` (`npm run lint`, `npx tsc --noEmit`, `npm test`). CI does **not** run these.
- [ ] Then complete any extra checklist items in the target subskill.

## Manual steps (policy)

A required manual _action_ with no judgment in it (a click in a vendor UI that
has no API) is not a blocker — do everything up to it, then report the remaining
step clearly. A manual _decision_ (a release window, submitting for review,
promoting past internal testing) is a stop-and-ask.

Platform-specific manual requirements are listed in each subskill.
