import fs from 'fs';
import path from 'path';
import { applyNativeAudioAndroidPatch, isNativeAudioAndroidPatched } from '../patch-native-audio-android';

const root = path.join(__dirname, '../..');
const pluginJava = path.join(
  root,
  'node_modules/@capacitor-community/native-audio/android/src/main/java/com/getcapacitor/community/audio/NativeAudio.java'
);

const UNPATCHED_FIXTURE = `public class NativeAudio extends Plugin {
    private static ArrayList<AudioAsset> resumeList;

    public void stop(PluginCall call) {
        try {
            initSoundPool();
            String audioId = call.getString(ASSET_ID);

            if (audioAssetList.containsKey(audioId)) {
                AudioAsset asset = audioAssetList.get(audioId);
                if (asset != null) {
                    asset.stop();
                    call.resolve();
                }
            } else {
                call.reject(ERROR_ASSET_NOT_LOADED + " - " + audioId);
            }
        } catch (Exception ex) {
            call.reject(ex.getMessage());
        }
    }

    public void unload(PluginCall call) {
        try {
            if (audioAssetList.containsKey(audioId)) {
                AudioAsset asset = audioAssetList.get(audioId);
                if (asset != null) {
                    asset.unload();
                    audioAssetList.remove(audioId);

                    status = new JSObject();
                    status.put("status", "OK");
                    call.resolve(status);
                }
            }
        } catch (Exception ex) {
            call.reject(ex.getMessage());
        }
    }
}
`;

describe('patch-native-audio-android', () => {
  it('clears resumeList on stop and unload so a paused-before-stop race cannot restart music', () => {
    expect(isNativeAudioAndroidPatched(UNPATCHED_FIXTURE)).toBe(false);

    const patched = applyNativeAudioAndroidPatch(UNPATCHED_FIXTURE);
    expect(isNativeAudioAndroidPatched(patched)).toBe(true);
    expect(patched).toContain('resumeList.remove(asset);');
    expect(patched).toMatch(/asset\.stop\(\);[\s\S]*?resumeList\.remove\(asset\);/);
    expect(patched).toMatch(/asset\.unload\(\);[\s\S]*?resumeList\.remove\(asset\);/);

    expect(applyNativeAudioAndroidPatch(patched)).toBe(patched);
  });

  it('keeps the installed plugin Java patched after postinstall', () => {
    expect(fs.existsSync(pluginJava)).toBe(true);
    const source = fs.readFileSync(pluginJava, 'utf8');
    expect(isNativeAudioAndroidPatched(source)).toBe(true);
  });

  it('package.json runs the patch on postinstall', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    expect(pkg.scripts.postinstall).toBe('node scripts/patch-native-audio-android.js');
  });
});
