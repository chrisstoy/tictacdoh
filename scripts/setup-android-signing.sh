#!/usr/bin/env bash
# One-time upload key for Play App Signing. Writes secrets outside the repo
# and a gitignored credentials.json. Refuses to overwrite an existing keystore.
# Does not print the password.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY_DIR="$HOME/.android/release-keys"
KEYSTORE="$KEY_DIR/tictacdoh-upload.keystore"
PASS_FILE="$KEY_DIR/tictacdoh-upload-keystore-passwords.txt"
CREDS="$ROOT/credentials.json"
ALIAS="tictacdoh-upload"

if [[ -f "$KEYSTORE" || -f "$CREDS" ]]; then
    echo "Error: signing material already exists. Refusing to overwrite." >&2
    echo "  keystore: $KEYSTORE" >&2
    echo "  credentials: $CREDS" >&2
    exit 1
fi

if ! command -v keytool >/dev/null 2>&1; then
    echo "Error: keytool is not on PATH. Install a JDK, then re-run." >&2
    exit 1
fi

mkdir -p "$KEY_DIR"
chmod 700 "$KEY_DIR"
PASS="$(openssl rand -hex 24)"

# SHA256withRSA is required. keytool's default SHA384withRSA makes
# signReleaseBundle throw a NullPointerException.
keytool -genkeypair -v \
    -storetype PKCS12 \
    -keystore "$KEYSTORE" \
    -alias "$ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -sigalg SHA256withRSA \
    -storepass "$PASS" -keypass "$PASS" \
    -dname "CN=Tic-Tac-Doh, O=Christopher Stoy, C=US"

umask 077
cat >"$PASS_FILE" <<EOF
keystore=$KEYSTORE
alias=$ALIAS
storePassword=$PASS
keyPassword=$PASS
EOF
chmod 600 "$PASS_FILE" "$KEYSTORE"

node - "$CREDS" "$KEYSTORE" "$ALIAS" "$PASS" <<'JS'
const fs = require('fs');
const [credsPath, keystorePath, alias, password] = process.argv.slice(2);
const body = {
  android: {
    keystore: {
      keystorePath,
      keystorePassword: password,
      keyAlias: alias,
      keyPassword: password,
    },
    playServiceAccountKeyPath: `${process.env.HOME}/.android/release-keys/tictacdoh-play-service-account.json`,
  },
};
fs.writeFileSync(credsPath, `${JSON.stringify(body, null, 2)}\n`, { mode: 0o600 });
JS
chmod 600 "$CREDS"
unset PASS

SIGALG="$(keytool -list -v -keystore "$KEYSTORE" -storepass "$(node -e "process.stdout.write(require('$CREDS').android.keystore.keystorePassword)")" | awk -F': ' '/Signature algorithm name/{print $2; exit}')"
if [[ "$SIGALG" != "SHA256withRSA" ]]; then
    echo "Error: keystore signature algorithm is '$SIGALG', expected SHA256withRSA." >&2
    exit 1
fi

echo "Created upload keystore: $KEYSTORE"
echo "Password file (chmod 600): $PASS_FILE"
echo "credentials.json written (gitignored). Back both up. This is the only copy of the upload key."
echo "Play Console does not have this app yet. upload-android.py cannot run until that app and a service account exist."
