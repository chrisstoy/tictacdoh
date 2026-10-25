#!/usr/bin/env python3
"""Upload a signed .aab to Google Play internal testing.

Dry run by default: prints the bundle and track, and does not call Play.
--apply creates an edit, uploads, assigns the internal track, and commits.

There is no Play Console app yet. --apply will fail until a human creates
the app (package com.chrisstoy.tictacdoh), enrolls Play App Signing, and
grants a service account access. The JSON key path is
credentials.json android.playServiceAccountKeyPath.

Media upload uses /upload/androidpublisher/v3/..., not /androidpublisher/v3/...
The non-upload host tries to parse the .aab as JSON.

Requires: pip install pyjwt cryptography
"""
import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_NAME = "com.chrisstoy.tictacdoh"
CREDS_PATH = REPO_ROOT / "credentials.json"


def get_access_token(service_account_path: Path) -> str:
    try:
        import jwt
    except ImportError as error:
        raise SystemExit("pip install pyjwt cryptography") from error
    sa = json.loads(service_account_path.read_text())
    now = int(time.time())
    assertion = jwt.encode(
        {
            "iss": sa["client_email"],
            "scope": "https://www.googleapis.com/auth/androidpublisher",
            "aud": "https://oauth2.googleapis.com/token",
            "iat": now,
            "exp": now + 3600,
        },
        sa["private_key"],
        algorithm="RS256",
    )
    data = urllib.parse.urlencode(
        {"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": assertion}
    ).encode()
    request = urllib.request.Request("https://oauth2.googleapis.com/token", data=data, method="POST")
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)["access_token"]


def call(access_token, url, method="GET", body=None, content_type="application/json"):
    headers = {"Authorization": f"Bearer {access_token}"}
    data = None
    if body is not None:
        data = json.dumps(body).encode() if content_type == "application/json" else body
        headers["Content-Type"] = content_type
        headers["Content-Length"] = str(len(data))
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            raw = response.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        print(f"HTTP ERROR {error.code} on {method} {url}", file=sys.stderr)
        print(error.read().decode(errors="replace"), file=sys.stderr)
        raise


def resolve_aab(explicit):
    if explicit:
        return Path(explicit).resolve()
    matches = sorted((REPO_ROOT / "build/release").glob("tictacdoh-*.aab"))
    if len(matches) == 1:
        return matches[0].resolve()
    if not matches:
        raise SystemExit("No build/release/tictacdoh-*.aab. Run scripts/release-android.sh first, or pass --aab.")
    raise SystemExit("More than one bundle in build/release. Pass --aab.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--aab", help="Signed bundle. Default: the only build/release/tictacdoh-*.aab")
    parser.add_argument("--track", default="internal", choices=["internal"])
    parser.add_argument("--apply", action="store_true", help="Upload and commit. Without this, nothing is sent.")
    args = parser.parse_args()

    aab = resolve_aab(args.aab)
    release_dir = (REPO_ROOT / "build/release").resolve()
    if release_dir not in aab.parents or not aab.name.startswith("tictacdoh-") or aab.suffix != ".aab":
        raise SystemExit(f"Refusing {aab}. Upload only a tictacdoh-*.aab printed by release-android.sh.")
    if not aab.exists():
        raise SystemExit(f"No .aab at {aab}")

    print(f"Bundle: {aab} ({aab.stat().st_size // 1_000_000}MB)")
    print(f"Package: {PACKAGE_NAME}")
    print(f"Track: {args.track}")
    if not args.apply:
        print("Dry run. Nothing was uploaded. Re-run with --apply after a human agrees.")
        return

    if not CREDS_PATH.exists():
        raise SystemExit(f"{CREDS_PATH} is missing. Run scripts/setup-android-signing.sh first.")
    creds = json.loads(CREDS_PATH.read_text())
    sa_path = Path(creds["android"]["playServiceAccountKeyPath"]).expanduser()
    if not sa_path.exists():
        raise SystemExit(
            "Play service account JSON is missing at "
            f"{sa_path}. Create the Play Console app for {PACKAGE_NAME}, enroll Play App "
            "Signing, invite a service account with testing-track access, and save its key there. "
            "Nothing was uploaded."
        )

    print("Authenticating...")
    access_token = get_access_token(sa_path)
    base = f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PACKAGE_NAME}"
    upload_base = f"https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/{PACKAGE_NAME}"

    print("Creating edit...")
    edit_id = call(access_token, f"{base}/edits", method="POST", body={})["id"]
    try:
        print(f"Uploading {aab.name}...")
        bundle = call(
            access_token,
            f"{upload_base}/edits/{edit_id}/bundles?uploadType=media",
            method="POST",
            body=aab.read_bytes(),
            content_type="application/octet-stream",
        )
        version_code = bundle["versionCode"]
        print(f"Uploaded. versionCode: {version_code}")
        call(
            access_token,
            f"{base}/edits/{edit_id}/tracks/{args.track}",
            method="PUT",
            body={"releases": [{"versionCodes": [str(version_code)], "status": "completed"}]},
        )
        call(access_token, f"{base}/edits/{edit_id}:commit", method="POST", body={})
    except Exception:
        print("Edit was not committed. Deleting it.", file=sys.stderr)
        try:
            call(access_token, f"{base}/edits/{edit_id}", method="DELETE")
        except Exception as cleanup_error:
            print(f"Could not delete the edit: {cleanup_error}", file=sys.stderr)
        raise

    print(f"Done. versionCode {version_code} is on the {args.track} track.")
    print("Play Console: https://play.google.com/console")


if __name__ == "__main__":
    main()
