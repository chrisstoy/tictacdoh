import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('store release', () => {
  it('uses the App Store Connect bundle id on both platforms', () => {
    expect(read('capacitor.config.ts')).toContain("appId: 'com.chrisstoy.tictacdoh'");
    const project = read('ios/App/App.xcodeproj/project.pbxproj');
    expect(project).not.toContain('com.stoyco.tictacdoh');
    expect(project).toContain('PRODUCT_BUNDLE_IDENTIFIER = com.chrisstoy.tictacdoh;');
    expect(project).toContain('DEVELOPMENT_TEAM = J866FQ2YZ9;');
    const gradle = read('android/app/build.gradle');
    expect(gradle).toContain('namespace = "com.chrisstoy.tictacdoh"');
    expect(gradle).toContain('applicationId "com.chrisstoy.tictacdoh"');
    expect(gradle).toContain('"rev-list", "--count", "HEAD"');
    expect(gradle).toContain('TICTACDOH_VERSION_CODE');
    expect(read('android/app/src/main/java/com/chrisstoy/tictacdoh/MainActivity.java')).toContain(
      'package com.chrisstoy.tictacdoh;'
    );
    expect(
      fs.existsSync(
        path.join(root, 'android/app/src/main/java/com/stoyco/tictacdoh/MainActivity.java')
      )
    ).toBe(false);
  });

  it('uploads iOS with automatic signing and keeps the git build number', () => {
    const script = read('scripts/release-ios.sh');
    const options = read('scripts/ExportOptions.plist');
    const archive = script.slice(script.indexOf('xcodebuild archive'));
    expect(archive).not.toContain('authenticationKey');
    expect(script).toContain('MARKETING_VERSION="$VERSION"');
    expect(script).toContain('CURRENT_PROJECT_VERSION="$BUILD"');
    expect(script).toContain('npm run build:native');
    expect(script).toContain('-scheme App');
    expect(script).not.toContain('expo prebuild');
    expect(options).toContain('<string>app-store-connect</string>');
    expect(options).toContain('<string>upload</string>');
    expect(options).toContain('<string>automatic</string>');
    expect(options).toContain('<string>J866FQ2YZ9</string>');
    expect(options).toContain('<key>manageAppVersionAndBuildNumber</key>');
    expect(options).toContain('<false/>');
    expect(options).not.toContain('provisioningProfiles');
    expect(read('scripts/release-preflight.sh')).toContain("require('$root/package.json').version");
  });

  it('signs Android from the committed Gradle file and uploads only on --apply', () => {
    const release = read('scripts/release-android.sh');
    const upload = read('scripts/upload-android.py');
    const setup = read('scripts/setup-android-signing.sh');
    expect(release).not.toContain('expo prebuild --');
    expect(release).not.toContain('build.gradle');
    expect(release).toContain('keystore.properties');
    expect(release).toContain('jarsigner -verify');
    expect(release).toContain('-PTICTACDOH_VERSION_CODE="$BUILD"');
    expect(setup).toContain('-sigalg SHA256withRSA');
    expect(upload).toContain('com.chrisstoy.tictacdoh');
    expect(upload).toContain('/upload/androidpublisher/v3/');
    expect(upload).toContain('add_argument("--apply"');
    expect(upload).toContain('Nothing was uploaded');
    expect(read('.gitignore')).toMatch(/^credentials\.json$/m);
    expect(read('.gitignore')).toMatch(/^\/build\/$/m);
  });
});
