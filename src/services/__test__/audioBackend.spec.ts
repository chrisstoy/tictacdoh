import {
  NATIVE_MUSIC_ASSET_ID,
  musicAssetIdForTransport,
  nativeMusicControl,
  nextMusicTransport,
  selectAudioBackend,
} from '../audioBackend';

describe('selectAudioBackend', () => {
  it('selects the native plugin inside the Capacitor shell', () => {
    expect(selectAudioBackend(true)).toBe('native');
  });

  it('selects expo-audio on the web', () => {
    expect(selectAudioBackend(false)).toBe('web');
  });
});

describe('nativeMusicControl', () => {
  it('uses stop and play on Android so pause/resume cannot arm the plugin resume list', () => {
    expect(nativeMusicControl('android')).toEqual({ silence: 'stop', resume: 'play' });
  });

  it('uses pause and resume on iOS', () => {
    expect(nativeMusicControl('ios')).toEqual({ silence: 'pause', resume: 'resume' });
  });
});

describe('nextMusicTransport', () => {
  it('pauses the one music instance when the app is inactive', () => {
    expect(nextMusicTransport({ musicEnabled: true, wasPlaying: true, isActive: false })).toBe(
      'pause'
    );
  });

  it('pauses even when music is already disabled, so a second instance is not started', () => {
    expect(nextMusicTransport({ musicEnabled: false, wasPlaying: false, isActive: false })).toBe(
      'pause'
    );
  });

  it('resumes on foreground only when music is enabled and it was playing', () => {
    expect(nextMusicTransport({ musicEnabled: true, wasPlaying: true, isActive: true })).toBe(
      'resume'
    );
  });

  it('does not resume on foreground when music is disabled', () => {
    expect(nextMusicTransport({ musicEnabled: false, wasPlaying: true, isActive: true })).toBe(
      'noop'
    );
  });

  it('does not resume on foreground when music was not playing', () => {
    expect(nextMusicTransport({ musicEnabled: true, wasPlaying: false, isActive: true })).toBe(
      'noop'
    );
  });

  it('rapid inactive/active toggles only pause and resume the same music asset', () => {
    const transports = [false, true, false, true].map((isActive) =>
      nextMusicTransport({ musicEnabled: true, wasPlaying: true, isActive })
    );
    const assetIds = transports.map((transport) => musicAssetIdForTransport(transport));

    expect(transports).toEqual(['pause', 'resume', 'pause', 'resume']);
    expect(assetIds).toEqual([
      NATIVE_MUSIC_ASSET_ID,
      NATIVE_MUSIC_ASSET_ID,
      NATIVE_MUSIC_ASSET_ID,
      NATIVE_MUSIC_ASSET_ID,
    ]);
    expect(new Set(assetIds).size).toBe(1);
  });
});
