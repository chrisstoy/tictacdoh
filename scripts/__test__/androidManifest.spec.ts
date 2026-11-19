import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '../..');

describe('android manifest', () => {
  it('pans the window instead of resizing it when the soft keyboard opens', () => {
    const manifest = fs.readFileSync(
      path.join(root, 'android/app/src/main/AndroidManifest.xml'),
      'utf8',
    );
    const activity = manifest.match(/<activity[\s\S]*?android:name="\.MainActivity"[\s\S]*?>/);
    expect(activity).not.toBeNull();
    expect(activity![0]).toContain('android:windowSoftInputMode="adjustPan"');
  });
});
