import fs from 'fs';
import path from 'path';
import config from '../../../capacitor.config';

const root = path.join(__dirname, '../../..');

function orientationValues(plist: string, key: string): string[] {
  const keyIndex = plist.indexOf(`<key>${key}</key>`);
  if (keyIndex < 0) {
    return [];
  }

  const arrayStart = plist.indexOf('<array>', keyIndex);
  const arrayEnd = plist.indexOf('</array>', arrayStart);
  const body = plist.slice(arrayStart, arrayEnd);
  return [...body.matchAll(/<string>([^<]+)<\/string>/g)].map((match) => match[1]);
}

describe('native chrome', () => {
  it('locks iPhone and iPad to portrait', () => {
    const plist = fs.readFileSync(path.join(root, 'ios/App/App/Info.plist'), 'utf8');

    expect(orientationValues(plist, 'UISupportedInterfaceOrientations')).toEqual([
      'UIInterfaceOrientationPortrait',
    ]);
    expect(orientationValues(plist, 'UISupportedInterfaceOrientations~ipad')).toEqual([
      'UIInterfaceOrientationPortrait',
    ]);
  });

  it('declares exempt-only encryption so uploads skip the export compliance prompt', () => {
    const plist = fs.readFileSync(path.join(root, 'ios/App/App/Info.plist'), 'utf8');

    expect(plist).toMatch(/<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/);
  });

  it('locks the Android activity to portrait', () => {
    const manifest = fs.readFileSync(
      path.join(root, 'android/app/src/main/AndroidManifest.xml'),
      'utf8'
    );

    expect(manifest).toContain('android:screenOrientation="portrait"');
  });

  it('uses the app background for the Capacitor splash and status bar', () => {
    expect(config.plugins?.SplashScreen?.backgroundColor).toBe('#fdde97');
    expect(config.plugins?.StatusBar).toMatchObject({
      backgroundColor: '#fdde97',
      style: 'LIGHT',
      overlaysWebView: true,
    });
  });

  it('paints the WebView the app background so no white flash follows the splash', () => {
    expect(config.backgroundColor).toBe('#fdde97');
  });

  it('paints the Android launch splash yellow and uses the splash icon', () => {
    const styles = fs.readFileSync(
      path.join(root, 'android/app/src/main/res/values/styles.xml'),
      'utf8'
    );

    expect(styles).toContain('#fdde97');
    expect(styles).toContain('@drawable/splash_icon');
  });
});
