# Deploy: ios (App Store Connect)

Bundle id `com.chrisstoy.tictacdoh`. App Store Connect app `6826927007`.
Deploys from `main` with a clean tree via `scripts/release-ios.sh`.

## Extra preflight

- [ ] `package.json` `"version"` equals the App Store Connect version string you
  are shipping. Today that version is `1.0` (`PREPARE_FOR_SUBMISSION`).
  `1.0.0` is a different string and will not attach to version `1.0`.
- [ ] Xcode is signed into an Apple ID that can manage profiles for team
  `J866FQ2YZ9`. The API key at
  `~/.appstoreconnect/private_keys/AuthKey_8LQQQ646C6.p8` is only the
  duplicate-build check. `pip install pyjwt cryptography` once.

## Deploy

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

## Verify after deploying

App Store Connect shows the build processing, then available. Wait for
processing before treating the upload as done. TestFlight:
https://appstoreconnect.apple.com/apps/6826927007/testflight/ios

## Rollback

No automated store rollback. Ship a newer build (a new commit, so the build
number changes) through the same script. Expiring a TestFlight build is a
console action.

## Manual steps

- Xcode → Settings → Accounts stays signed in for iOS signing.
- After the iOS upload finishes processing: add the build to a TestFlight
  group, select it on version `1.0`, and submit for review. Submitting for
  review is a human step.
