export type AudioBackend = 'native' | 'web';

export function selectAudioBackend(isNative: boolean): AudioBackend {
  return isNative ? 'native' : 'web';
}

export type MusicTransport = 'pause' | 'resume' | 'noop';

export interface MusicTransportInput {
  musicEnabled: boolean;
  wasPlaying: boolean;
  isActive: boolean;
}

/**
 * Background (and any inactive state, including a phone call) pauses the one
 * music instance. Foreground resumes it only when music is still enabled and
 * it was playing before the interruption. Anything else leaves it alone.
 */
export function nextMusicTransport(input: MusicTransportInput): MusicTransport {
  if (!input.isActive) {
    return 'pause';
  }

  if (input.musicEnabled && input.wasPlaying) {
    return 'resume';
  }

  return 'noop';
}

/**
 * Android `@capacitor-community/native-audio` adds an asset to an activity
 * resume list from both `pause()` and `resume()`. The next foreground then
 * starts that asset even after music was turned off. `stop()` and `play()` do
 * not join the list. iOS pause/resume does not have the list.
 */
export function nativeMusicControl(platform: string): {
  silence: 'stop' | 'pause';
  resume: 'play' | 'resume';
} {
  if (platform === 'android') {
    return { silence: 'stop', resume: 'play' };
  }
  return { silence: 'pause', resume: 'resume' };
}

/** Single preloaded music asset. Lifecycle never allocates another. */
export const NATIVE_MUSIC_ASSET_ID = 'music';

export function musicAssetIdForTransport(_transport: MusicTransport): typeof NATIVE_MUSIC_ASSET_ID {
  return NATIVE_MUSIC_ASSET_ID;
}
