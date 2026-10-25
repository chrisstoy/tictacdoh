#!/usr/bin/env bash
# Builds a signed Android App Bundle. Does not upload.
#
# The android/ project is committed Capacitor source, not expo prebuild output,
# so this script does not regenerate it and does not patch the Gradle project.
# Signing stays the keystore.properties block already in the app module.
# credentials.json (gitignored) is the only password file; this script copies
# those values into android/keystore.properties for Gradle.
#
# The upload key must be SHA256withRSA. keytool's current default, SHA384withRSA,
# makes :app:signReleaseBundle throw a NullPointerException (ShopN).
# Create the key once with scripts/setup-android-signing.sh.
#
# Usage: scripts/release-android.sh
# Then:  python3 scripts/upload-android.py          # dry run
#        python3 scripts/upload-android.py --apply  # internal track, after a human agrees
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=release-preflight.sh
source "$ROOT/scripts/release-preflight.sh"
release_preflight "$ROOT"

CREDS="$ROOT/credentials.json"
if [[ ! -f "$CREDS" ]]; then
    echo "Error: $CREDS is missing. Run scripts/setup-android-signing.sh once." >&2
    exit 1
fi

echo "Releasing v$VERSION (build $BUILD)"
node - "$CREDS" "$ROOT/android/keystore.properties" <<'JS'
const fs = require('fs');
const credsPath = process.argv[2];
const propsPath = process.argv[3];
const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8')).android.keystore;
for (const key of ['keystorePath', 'keystorePassword', 'keyAlias', 'keyPassword']) {
  if (!creds[key]) {
    console.error(`Error: credentials.json android.keystore.${key} is empty.`);
    process.exit(1);
  }
}
if (!fs.existsSync(creds.keystorePath)) {
  console.error(`Error: keystore not found at ${creds.keystorePath}`);
  process.exit(1);
}
const escape = (value) => String(value).replace(/\\/g, '\\\\');
fs.writeFileSync(propsPath, [
  `storeFile=${escape(creds.keystorePath)}`,
  `storePassword=${escape(creds.keystorePassword)}`,
  `keyAlias=${escape(creds.keyAlias)}`,
  `keyPassword=${escape(creds.keyPassword)}`,
  '',
].join('\n'));
JS

echo "Building web bundle (base path /)..."
(cd "$ROOT" && npm run build:native && npm run cap:sync)

if [[ -n "$(git -C "$ROOT" status --porcelain)" ]]; then
    echo "Error: the release build changed tracked files. Commit that drift, then release." >&2
    git -C "$ROOT" status --short >&2
    exit 1
fi

echo "Building signed release .aab..."
(cd "$ROOT/android" && ./gradlew :app:bundleRelease -PTICTACDOH_VERSION_CODE="$BUILD")

AAB_SRC="$ROOT/android/app/build/outputs/bundle/release/app-release.aab"
if [[ ! -f "$AAB_SRC" ]]; then
    echo "Error: Gradle did not write $AAB_SRC" >&2
    exit 1
fi

echo "Verifying the bundle is signed..."
jarsigner -verify "$AAB_SRC" >/dev/null

DEST_DIR="$ROOT/build/release"
mkdir -p "$DEST_DIR"
AAB_DEST="$DEST_DIR/tictacdoh-${VERSION}-${BUILD}.aab"
cp "$AAB_SRC" "$AAB_DEST"

echo ""
echo "Done. v$VERSION (build $BUILD)"
echo "  $AAB_DEST"
echo "Dry run: python3 scripts/upload-android.py --aab $AAB_DEST"
echo "Upload:  python3 scripts/upload-android.py --aab $AAB_DEST --apply"
