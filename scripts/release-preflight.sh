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
