#!/usr/bin/env bash
# Archives Tic-Tac-Doh and uploads it to App Store Connect.
#
# Signing is automatic (Xcode account + -allowProvisioningUpdates). Do not pass
# -authenticationKeyID / -authenticationKeyPath / -authenticationKeyIssuerID.
# ShopN tried that with this team's API key and Xcode stopped using the
# signed-in account for profiles. The key has no Cloud signing permission, so
# the archive failed with "No profiles were found" even though a Distribution
# cert was in the keychain. The key is used only for the duplicate-build check.
#
# Usage: scripts/release-ios.sh
# Override the main-branch check with ALLOW_NON_MAIN=1 (say so in the report).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=release-preflight.sh
source "$ROOT/scripts/release-preflight.sh"
release_preflight "$ROOT"

APP_ID="6826927007"
KEY_ID="8LQQQ646C6"
ISSUER_ID="4ec14bd3-9f76-44d0-9386-ba48dd531d1f"
KEY_PATH="$HOME/.appstoreconnect/private_keys/AuthKey_${KEY_ID}.p8"
ARCHIVE_PATH="$ROOT/build/TicTacDoh.xcarchive"
EXPORT_PATH="$ROOT/build/export"
EXPORT_OPTIONS="$ROOT/scripts/ExportOptions.plist"

if [[ ! -f "$KEY_PATH" ]]; then
    echo "Error: App Store Connect API key not found at $KEY_PATH" >&2
    echo "The key is only used to refuse a build number that was already uploaded." >&2
    exit 1
fi

echo "Releasing v$VERSION (build $BUILD)"
echo "Checking App Store Connect for an existing build $BUILD..."

TOKEN="$(python3 - "$KEY_PATH" "$KEY_ID" "$ISSUER_ID" <<'PY'
import sys, time
try:
    import jwt
except ImportError:
    print("ERROR: pip install pyjwt cryptography", file=sys.stderr)
    sys.exit(1)
key_path, key_id, issuer_id = sys.argv[1], sys.argv[2], sys.argv[3]
with open(key_path) as f:
    private_key = f.read()
token = jwt.encode(
    {"iss": issuer_id, "iat": int(time.time()), "exp": int(time.time()) + 1200, "aud": "appstoreconnect-v1"},
    private_key, algorithm="ES256", headers={"kid": key_id},
)
print(token)
PY
)"

EXISTING_BUILD="$(python3 - "$TOKEN" "$APP_ID" "$BUILD" <<'PY'
import json, sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError
token, app_id, build = sys.argv[1], sys.argv[2], sys.argv[3]
url = f"https://api.appstoreconnect.apple.com/v1/builds?filter[app]={app_id}&filter[version]={build}&limit=1"
try:
    req = Request(url, headers={"Authorization": f"Bearer {token}"})
    with urlopen(req, timeout=30) as response:
        data = json.load(response).get("data", [])
    if data:
        print(data[0]["id"])
except HTTPError as error:
    body = error.read().decode(errors="replace")
    print(f"ERROR: App Store Connect API returned HTTP {error.code} — {body}", file=sys.stderr)
    sys.exit(1)
PY
)"

# The check and the upload are not atomic. A build still uploading can be missed.
# The script is human-invoked, not retried in a loop. Habit accepted the same gap.
if [[ -n "$EXISTING_BUILD" ]]; then
    echo "Error: build $BUILD already exists in App Store Connect (id: $EXISTING_BUILD)." >&2
    echo "Commit something new so the build number changes, then run this again." >&2
    exit 1
fi

echo "Building web bundle (base path /)..."
(cd "$ROOT" && npm run build:native && npm run cap:sync)

if [[ -n "$(git -C "$ROOT" status --porcelain)" ]]; then
    echo "Error: cap sync changed tracked files. Commit that drift, then release." >&2
    git -C "$ROOT" status --short >&2
    exit 1
fi

rm -rf "$ROOT/build"
mkdir -p "$ROOT/build"

echo "Archiving v$VERSION (build $BUILD)..."
xcodebuild archive \
    -project "$ROOT/ios/App/App.xcodeproj" \
    -scheme App \
    -configuration Release \
    -archivePath "$ARCHIVE_PATH" \
    -destination 'generic/platform=iOS' \
    -allowProvisioningUpdates \
    MARKETING_VERSION="$VERSION" \
    CURRENT_PROJECT_VERSION="$BUILD"

echo "Uploading to App Store Connect..."
xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$EXPORT_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS" \
    -allowProvisioningUpdates

echo ""
echo "Done. v$VERSION (build $BUILD) uploaded to App Store Connect."
echo "TestFlight: https://appstoreconnect.apple.com/apps/${APP_ID}/testflight/ios"
echo "Version 1.0 (prepare for submission): https://appstoreconnect.apple.com/apps/${APP_ID}/appstore/ios/version/inflight"
