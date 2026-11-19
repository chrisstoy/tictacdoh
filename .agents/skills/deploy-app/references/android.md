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

The Play app exists (Play App Signing enrolled; versionCode 100 is on the
internal track). `--apply` needs the service-account JSON at the path in
`credentials.json` (`~/.android/release-keys/tictacdoh-play-service-account.json`);
if it is missing, say so and stop.

## Verify after deploying

After `--apply`, the script prints the versionCode on the internal track.
Install it from the internal testing link and confirm Play Online is visible.

## Rollback

No automated store rollback. Ship a newer build (a new commit, so the build
number changes) through the same scripts. Halting a Play release is a console
action.

## Manual steps

- Before the first production release: data safety, content rating, target
  audience, ads declaration, app access, pricing/countries, and (personal
  accounts created after Nov 2023) a 12-tester / 14-day closed test.
- Back up `~/.android/release-keys/tictacdoh-upload.keystore` and
  `tictacdoh-upload-keystore-passwords.txt`. That keystore is the only upload
  key.
