import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '../../..');
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

describe('app version sources match package.json', () => {
  it('app.config.js reads its version from package.json', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(path.join(root, 'app.config.js'));
    expect(config.expo.version).toBe(version);
  });

  it('every Xcode MARKETING_VERSION matches package.json (GUI archives and local runs)', () => {
    const pbx = fs.readFileSync(path.join(root, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');
    const versions = [...pbx.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1]);
    expect(versions.length).toBeGreaterThan(0);
    expect(new Set(versions)).toEqual(new Set([version]));
  });
});
