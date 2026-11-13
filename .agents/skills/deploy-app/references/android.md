# Deploy: android (Play internal testing)

Package `com.chrisstoy.tictacdoh`. Deploys from `main` with a clean tree via
`scripts/release-android.sh`, then `scripts/upload-android.py`.

## Extra preflight

- [ ] `package.json` `"version"` equals the store version string you are
  shipping (same rule as iOS — see root skill / `deployment.md`).
- [ ] `credentials.json` exists (gitignored). Create it once with
  `scripts/setup-android-signing.sh`. Do not print passwords.

## Deploy

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

After `--apply`, the script prints the versionCode on the internal track.
There is nothing to verify until the Play app exists.

## Rollback

No automated store rollback. Ship a newer build (a new commit, so the build
number changes) through the same scripts. Halting a Play release is a console
action.

## Manual steps

- Create the Play Console app for `com.chrisstoy.tictacdoh`, enroll Play App
  Signing, and grant a service account testing-track access. Then `--apply`
  can upload.
- Back up `~/.android/release-keys/tictacdoh-upload.keystore` and
  `tictacdoh-upload-keystore-passwords.txt`. That keystore is the only upload
  key.
