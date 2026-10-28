---
name: deploy-app
description: Build and deploy Tic-Tac-Doh to a chosen target (GitHub Pages web/PWA, App Store Connect, or Google Play internal testing). Use when the user asks to deploy, ship, release, promote, or push a build of this project — including "deploy to production", "cut a build". Do NOT use for running the app locally; that's the dev server, see .agents/reference/commands.md.
---

# Deploy Tic-Tac-Doh

Deployment is deliberately **not** part of the per-issue loop. `work-issue` and
`run-issue-autonomously` both stop at merge. This skill runs when a human
decides some batch of merged work is ready for a real-infrastructure check.
Nothing invokes it automatically.

Facts (bundle id, signing gotchas, version rules) live in
`.agents/reference/deployment.md` and ADR 0002. This file is the procedure.
Do not deploy by improvising around it.

## Targets

| Target                                                                  | Deploys from       | Mechanism                                                                                     |
| ----------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `production-web` (GitHub Pages, https://chrisstoy.github.io/tictacdoh/) | `main`             | `.github/workflows/main.yml`, `workflow_dispatch` only. Merging to `main` does **not** deploy |
| `ios` (`com.chrisstoy.tictacdoh`, App Store Connect app `6826927007`)   | `main`, clean tree | `scripts/release-ios.sh` archives and uploads                                                 |
| `android` (`com.chrisstoy.tictacdoh`)                                   | `main`, clean tree | `scripts/release-android.sh`, then `scripts/upload-android.py`                                |

No preview/staging target exists. Web hosting is GitHub Pages only. There is
no EAS, no fastlane, and no store workflow in CI. Play Console has no app yet.

## Preflight — every target

- [ ] On `main`, up to date with `origin/main`. The native scripts enforce this (`ALLOW_NON_MAIN=1` is an emergency override and must be in the report).
- [ ] Working tree clean. `git status --short` is empty.
- [ ] Full clone. A shallow clone makes the store build number wrong.
- [ ] Full verification suite green locally — see `.agents/reference/commands.md` (`npm run lint`, `npx tsc --noEmit`, `npm test`). CI does **not** run these.
- [ ] `production-web` needs `GITHUB_PAGES=true` (the workflow sets it). Native scripts run `npm run build:native`, which forces `GITHUB_PAGES` unset so `start_url` is `/`.
- [ ] `package.json` `"version"` equals the App Store Connect version string you are shipping. Today that version is `1.0` (`PREPARE_FOR_SUBMISSION`). `1.0.0` is a different string and will not attach to version `1.0`.
- [ ] iOS: Xcode is signed into an Apple ID that can manage profiles for team `J866FQ2YZ9`. The API key at `~/.appstoreconnect/private_keys/AuthKey_8LQQQ646C6.p8` is only the duplicate-build check. `pip install pyjwt cryptography` once.
- [ ] Android: `credentials.json` exists (gitignored). Create it once with `scripts/setup-android-signing.sh`. Do not print passwords.

## Deploy

**production-web**

1. Optionally dry-run the artifact locally: `GITHUB_PAGES=true npm run build` and confirm `dist/` contains `index.html`, `manifest.json`, `sw.js`, `icons/`. `dist/manifest.json` `start_url` is `/tictacdoh/`.
2. Trigger the workflow from `main`: `gh workflow run "Build and Deploy to Pages" --ref main`, then `gh run watch`. It builds (Node 20, `npm ci`, `npm run build`) and deploys `./dist` via `actions/deploy-pages@v4`. This skill is the only sanctioned way to publish the web build; do not re-add a push trigger or deploy any other way.

**ios**

```bash
npm run release:ios
# same thing: bash scripts/release-ios.sh
```

The script checks App Store Connect for this commit's build number, builds the
web bundle, runs `cap sync`, archives scheme `App`, and uploads. The export
step is the upload. There is no Transporter or altool step.

Scheme `App` embeds the watchOS app (`com.chrisstoy.tictacdoh.watchkitapp`).
The archive contains `Watch/TicTacDohWatch.app`. After upload, installing that
watch app from TestFlight and adding watch screenshots in App Store Connect are
human steps. Do not upload, and do not let automatic signing register the watch
bundle id, unless this run was asked to release.

Do **not** pass App Store Connect API-key flags to `xcodebuild`. That path
failed on ShopN with this same key. Details in `deployment.md`.

**android**

```bash
bash scripts/setup-android-signing.sh   # once, if credentials.json is missing
npm run release:android                 # signed .aab under build/release/
python3 scripts/upload-android.py       # dry run: prints the bundle, uploads nothing
python3 scripts/upload-android.py --apply   # internal track, only after a human agrees
```

`--apply` is the only upload. The track argument only accepts `internal`.
Promoting past internal testing is a Play Console action a human approves;
this skill does not do it.

The first `--apply` cannot succeed until a human has created the Play app,
enrolled Play App Signing, and saved a service-account JSON at the path in
`credentials.json` (`~/.android/release-keys/tictacdoh-play-service-account.json`).
Say that and stop. Do not invent a Play app from this script.

## Verify after deploying

- Open https://chrisstoy.github.io/tictacdoh/ — setup screen loads with music/fonts/images, no 404s in the network tab (base path `/tictacdoh/`).
- Start a match vs CPU and play a round to the end.
- In DevTools → Application: manifest is valid and the service worker `sw.js` is registered with scope `/tictacdoh/`. After a deploy, a hard refresh (or closing all tabs) may be needed to pick up the new worker.
- iOS: App Store Connect shows the build processing, then available. Wait for processing before treating the upload as done. TestFlight: https://appstoreconnect.apple.com/apps/6826927007/testflight/ios
- Android: after `--apply`, the script prints the versionCode on the internal track. There is nothing to verify until the Play app exists.

## Rollback

- production-web: revert the bad commit on `main`, then run the workflow again; or run it with `--ref <last-good-commit>`.
- ios / android: there is no automated store rollback. Ship a newer build (a new commit, so the build number changes) through the same scripts. Expiring a TestFlight build or halting a Play release is a console action.

## Manual steps this project genuinely requires

- GitHub Pages must be configured to deploy from "GitHub Actions" (already so if the current site is live).
- Xcode → Settings → Accounts stays signed in for iOS signing.
- After the iOS upload finishes processing: add the build to a TestFlight group, select it on version `1.0`, and submit for review. Submitting for review is a human step.
- Create the Play Console app for `com.chrisstoy.tictacdoh`, enroll Play App Signing, and grant a service account testing-track access. Then `--apply` can upload.
- Back up `~/.android/release-keys/tictacdoh-upload.keystore` and `tictacdoh-upload-keystore-passwords.txt`. That keystore is the only upload key.

A required manual _action_ with no judgment in it (a click in a vendor UI that
has no API) is not a blocker — do everything up to it, then report the remaining
step clearly. A manual _decision_ (a release window, submitting for review,
promoting past internal testing) is a stop-and-ask.
