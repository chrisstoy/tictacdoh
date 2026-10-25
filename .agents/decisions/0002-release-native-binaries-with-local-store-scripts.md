---
name: release-native-binaries-with-local-store-scripts
description: Release native binaries with local store scripts
---

# 0002. Release native binaries with local store scripts

## Status

Accepted

<!-- Proposed | Accepted | Deprecated | Superseded by NNNN
     Recorded 2026-10-25. Never rewrite a decision that turned out wrong —
     supersede it. The record of having been wrong is the point. -->

## Context

ADR 0001 already ships iOS and Android by wrapping the web build in Capacitor
and rejected EAS. What it left open was how a binary actually reaches the
stores. Habit and ShopN both do that from the developer's Mac: `xcodebuild
archive` plus `xcodebuild -exportArchive` with `destination: upload`, and a
locally signed Android App Bundle uploaded with the Play Developer API. Neither
project uses EAS, fastlane, or a GitHub Actions store workflow.

Two signing facts from those repos apply here. Habit passes an App Store
Connect API key into `xcodebuild` because it uses manual profiles. ShopN uses
automatic signing, and the same flags made Xcode manage profiles with that key
instead of the signed-in Xcode account. The key (`8LQQQ646C6`) does not have
Cloud signing permission, so the archive failed with "No profiles for
'<bundle id>' were found" even though a Distribution certificate was already in
the keychain. Dropping the flags is what worked.

App Store Connect already has Tic-Tac-DOH! as app `6826927007`, bundle id
`com.chrisstoy.tictacdoh`, version `1.0` in `PREPARE_FOR_SUBMISSION`, and no
builds. The Capacitor projects were generated with `com.stoyco.tictacdoh`,
which is a different app. There is no Play Console app yet. The Apple team is
`J866FQ2YZ9`, the same team Habit and ShopN sign with. `ios/` and `android/`
are committed, so a release must not regenerate them with `expo prebuild
--clean` the way ShopN does.

## Decision

We will cut store binaries with local scripts. `scripts/release-ios.sh` builds
the native web bundle, runs `cap sync`, archives the shared `App` scheme, and
uploads with `scripts/ExportOptions.plist` (`method: app-store-connect`,
`destination: upload`, `signingStyle: automatic`, team `J866FQ2YZ9`).
`xcodebuild` gets `-allowProvisioningUpdates` and no
`-authenticationKeyID` / `-authenticationKeyPath` flags. The API key is used
only beforehand, to refuse a build number App Store Connect already has.

The marketing version is `package.json` `"version"` and must equal the App
Store Connect version string (`1.0` for the version that exists today). The
build number is `git rev-list --count HEAD`, passed as `CURRENT_PROJECT_VERSION`
on the archive command so no source file is edited. `ExportOptions.plist` sets
`manageAppVersionAndBuildNumber` to false so Xcode does not replace that build
number at upload.

Android keeps the committed Gradle signing block that reads gitignored
`android/keystore.properties`. `scripts/release-android.sh` writes that file
from gitignored `credentials.json` and runs `bundleRelease`. It does not patch
`build.gradle` after a prebuild. The upload key is PKCS12 with `SHA256withRSA`
(ShopN's `SHA384withRSA` default makes `signReleaseBundle` throw a
NullPointerException). `scripts/upload-android.py` talks to the Play Developer
API, posts the `.aab` to the `/upload/androidpublisher/` host, and commits only
the `internal` track when `--apply` is passed. A run without `--apply` uploads
nothing.

Rejected: leaving upload as a manual Xcode Organizer and Play Console click,
which is what the previous deploy skill stopped at. Rejected: passing the App
Store Connect API key into `xcodebuild` for this automatic-signing project.
Rejected: EAS Build/Submit (ADR 0001) and a GitHub Actions store workflow.
Rejected: fastlane. Rejected: ShopN's `expo prebuild --clean` plus a Gradle
patch, because these native projects are source, not generated output.

## Consequences

A release is one script per platform, and the build number cannot be reused
for the same commit. The working tree must be clean, the clone must not be
shallow, and `HEAD` must be `origin/main` unless `ALLOW_NON_MAIN=1`.

iOS still needs Xcode signed into an Apple ID that can manage profiles for
team `J866FQ2YZ9`. Android needs the upload keystore outside the repo
(`scripts/setup-android-signing.sh` creates it once). Play Console app
creation, Play App Signing enrollment, and the service-account grant do not
exist yet and stay manual; the upload script cannot invent them.

Changing the bundle id means an install of `com.stoyco.tictacdoh` is a
different app from the store app. Submitting an iOS build for review, and
promoting an Android release past the internal track, stay human decisions.
