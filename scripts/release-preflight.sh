#!/usr/bin/env bash
# Shared by release-ios.sh and release-android.sh. Source it; do not execute it.
# Sets VERSION (package.json) and BUILD (git rev-list --count HEAD).
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    echo "Source this file from a release script; do not execute it." >&2
    exit 1
fi

release_preflight() {
    local root="$1"

    if [[ -n "$(git -C "$root" status --porcelain)" ]]; then
        echo "Error: working tree is not clean. Commit or stash before releasing." >&2
        git -C "$root" status --short >&2
        exit 1
    fi

    if [[ "$(git -C "$root" rev-parse --is-shallow-repository)" == "true" ]]; then
        echo "Error: shallow clone. The store build number is git rev-list --count HEAD and would be wrong." >&2
        exit 1
    fi

    local branch head origin
    branch="$(git -C "$root" rev-parse --abbrev-ref HEAD)"
    if [[ "$branch" != "main" && "${ALLOW_NON_MAIN:-}" != "1" ]]; then
        echo "Error: releases run from main (current: $branch). ALLOW_NON_MAIN=1 overrides and must be called out." >&2
        exit 1
    fi
    if git -C "$root" rev-parse --verify -q origin/main >/dev/null; then
        head="$(git -C "$root" rev-parse HEAD)"
        origin="$(git -C "$root" rev-parse origin/main)"
        if [[ "$head" != "$origin" && "${ALLOW_NON_MAIN:-}" != "1" ]]; then
            echo "Error: HEAD is not origin/main. Push first, or set ALLOW_NON_MAIN=1." >&2
            exit 1
        fi
    fi

    VERSION="$(node -p "require('$root/package.json').version")"
    BUILD="$(git -C "$root" rev-list --count HEAD)"
    if [[ -z "$VERSION" || -z "$BUILD" || "$BUILD" == "0" ]]; then
        echo "Error: could not resolve version '$VERSION' or build '$BUILD'." >&2
        exit 1
    fi
}

# Store builds must expose Online play. EXPO_PUBLIC_MULTIPLAYER_URL is baked into
# the web bundle at build time; unset, the Online entry is hidden. The Pages
# workflow sets it in main.yml; native releases default to the same Worker here.
RELEASE_MULTIPLAYER_URL_DEFAULT="https://tictacdoh-multiplayer.chrisstoy.workers.dev"

release_multiplayer_env() {
    export EXPO_PUBLIC_MULTIPLAYER_URL="${EXPO_PUBLIC_MULTIPLAYER_URL:-$RELEASE_MULTIPLAYER_URL_DEFAULT}"
    echo "Multiplayer Worker: $EXPO_PUBLIC_MULTIPLAYER_URL" >&2
}

# Fails unless the built web bundle in $1 contains EXPO_PUBLIC_MULTIPLAYER_URL.
assert_multiplayer_baked() {
    local dist="$1"
    if [[ -z "${EXPO_PUBLIC_MULTIPLAYER_URL:-}" ]] || ! grep -rqF "$EXPO_PUBLIC_MULTIPLAYER_URL" "$dist/_expo"; then
        echo "Error: $dist/_expo does not contain EXPO_PUBLIC_MULTIPLAYER_URL ('${EXPO_PUBLIC_MULTIPLAYER_URL:-}'). Online play would be hidden." >&2
        exit 1
    fi
}
