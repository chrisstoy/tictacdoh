import { NativeAudio } from '@capacitor-community/native-audio';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { AudioPlayer, AudioSource, createAudioPlayer } from 'expo-audio';
import { NATIVE_MUSIC_ASSET_ID, nextMusicTransport, selectAudioBackend } from './audioBackend';
import { isNativeShell } from './nativeShell';
import { selectEnableMusic, selectEnableSound, useOptionsStore } from './optionsState';

export type SoundKey =
  | 'squish'
  | 'push'
  | 'jiggle'
  | 'thump'
  | 'roundOver'
  | 'roundOverDraw'
  | 'matchOver'
  | 'matchOverDraw';

export type MusicKey = 'setup';

const audioSources: Record<SoundKey, AudioSource> = {
  squish: require('@/assets/sounds/squish-1.mp3'),
  push: require('@/assets/sounds/press-heavy-1.mp3'),
  jiggle: require('@/assets/sounds/press-1.mp3'),
  thump: require('@/assets/sounds/thump.mp3'),
  roundOver: require('@/assets/sounds/round-over.mp3'),
  roundOverDraw: require('@/assets/sounds/round-over-draw.mp3'),
  matchOver: require('@/assets/sounds/match-over.mp3'),
  matchOverDraw: require('@/assets/sounds/match-over-draw.mp3'),
};

const musicSources: Record<MusicKey, AudioSource> = {
  setup: require('@/assets/sounds/setup-music.mp3'),
};

const nativeSoundFiles: Record<SoundKey, string> = {
  squish: 'squish-1.mp3',
  push: 'press-heavy-1.mp3',
  jiggle: 'press-1.mp3',
  thump: 'thump.mp3',
  roundOver: 'round-over.mp3',
  roundOverDraw: 'round-over-draw.mp3',
  matchOver: 'match-over.mp3',
  matchOverDraw: 'match-over-draw.mp3',
};

const nativeMusicFile: Record<MusicKey, string> = {
  setup: 'setup-music.mp3',
};

interface AudioServiceContextValue {
  playSound: (soundKey: SoundKey, offset?: number) => void;

  playMusic: (musicKey: MusicKey, options?: { offset?: number; loop?: boolean }) => void;
  stopMusic: () => void;
}

const AudioServiceContext = createContext<AudioServiceContextValue | undefined>(undefined);

interface AudioServiceProviderProps {
  children: ReactNode;
}

function nativeAssetPath(fileName: string): string {
  return Capacitor.getPlatform() === 'android' ? `sounds/${fileName}` : fileName;
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

async function preloadNative(assetId: string, assetPath: string): Promise<void> {
  try {
    await NativeAudio.preload({
      assetId,
      assetPath,
      audioChannelNum: 1,
      isUrl: false,
    });
    console.info(`Native audio preloaded ${assetId} from ${assetPath}`);
  } catch (error) {
    if (!/already exists/i.test(errorText(error))) {
      console.warn(`Native audio preload failed for ${assetId} (${assetPath})`, error);
    }
  }
}

async function startNativeMusic(loop: boolean, offset: number): Promise<void> {
  console.info(`Native music start ${NATIVE_MUSIC_ASSET_ID} loop=${loop} offset=${offset}`);
  if (Capacitor.getPlatform() === 'ios') {
    if (loop) {
      await NativeAudio.loop({ assetId: NATIVE_MUSIC_ASSET_ID });
      return;
    }
    await NativeAudio.play({ assetId: NATIVE_MUSIC_ASSET_ID, time: offset });
    return;
  }

  await NativeAudio.play({ assetId: NATIVE_MUSIC_ASSET_ID, time: offset });
  if (loop) {
    await NativeAudio.loop({ assetId: NATIVE_MUSIC_ASSET_ID });
  }
}

function createReadyGate(): { promise: Promise<void>; resolve: () => void } {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function NativeAudioServiceProvider({ children }: AudioServiceProviderProps) {
  const soundEnabled = useOptionsStore(selectEnableSound);
  const musicEnabled = useOptionsStore(selectEnableMusic);
  const desiredPlaying = useRef(false);
  const loopMusic = useRef(true);
  const musicOffset = useRef(0);
  const activeMusic = useRef<MusicKey | null>(null);
  const musicStarted = useRef(false);
  const appIsActive = useRef(true);
  const sawMusicOption = useRef(false);
  const readyGate = useRef<ReturnType<typeof createReadyGate> | null>(null);
  if (readyGate.current === null) {
    readyGate.current = createReadyGate();
  }
  const ready = readyGate.current.promise;

  useEffect(() => {
    let cancelled = false;
    let removeListener: (() => Promise<void>) | undefined;

    void (async () => {
      try {
        await NativeAudio.configure({ focus: false, fade: false });
        await Promise.all([
          ...(Object.keys(nativeSoundFiles) as SoundKey[]).map((key) =>
            preloadNative(key, nativeAssetPath(nativeSoundFiles[key]))
          ),
          preloadNative(NATIVE_MUSIC_ASSET_ID, nativeAssetPath(nativeMusicFile.setup)),
        ]);
      } finally {
        readyGate.current?.resolve();
      }
    })();

    void App.addListener('appStateChange', ({ isActive }) => {
      appIsActive.current = isActive;
      const transport = nextMusicTransport({
        musicEnabled: useOptionsStore.getState().enableMusic,
        wasPlaying: desiredPlaying.current,
        isActive,
      });
      console.info(`Native music transport ${transport} active=${isActive}`);
      if (transport === 'resume') {
        void NativeAudio.resume({ assetId: NATIVE_MUSIC_ASSET_ID });
        return;
      }
      void NativeAudio.pause({ assetId: NATIVE_MUSIC_ASSET_ID });
    }).then((handle) => {
      if (cancelled) {
        void handle.remove();
        return;
      }
      removeListener = () => handle.remove();
    });

    return () => {
      cancelled = true;
      void removeListener?.();
      void NativeAudio.unload({ assetId: NATIVE_MUSIC_ASSET_ID });
      (Object.keys(nativeSoundFiles) as SoundKey[]).forEach((key) => {
        void NativeAudio.unload({ assetId: key });
      });
    };
  }, []);

  useEffect(() => {
    if (!sawMusicOption.current) {
      sawMusicOption.current = true;
      return;
    }

    if (!musicEnabled) {
      desiredPlaying.current = false;
      void ready.then(() => NativeAudio.pause({ assetId: NATIVE_MUSIC_ASSET_ID }));
      return;
    }

    if (!activeMusic.current) return;

    desiredPlaying.current = true;
    if (!appIsActive.current) return;

    void ready.then(async () => {
      if (!desiredPlaying.current || !appIsActive.current) return;
      if (musicStarted.current) {
        await NativeAudio.resume({ assetId: NATIVE_MUSIC_ASSET_ID });
        return;
      }
      musicStarted.current = true;
      await startNativeMusic(loopMusic.current, musicOffset.current);
    });
  }, [musicEnabled, ready]);

  const playSound = (soundKey: SoundKey, offset = 0) => {
    if (!soundEnabled) return;

    void ready.then(() => {
      void NativeAudio.play({ assetId: soundKey, time: offset });
    });
  };

  const playMusic = (musicKey: MusicKey, options?: { offset?: number; loop?: boolean }) => {
    activeMusic.current = musicKey;
    loopMusic.current = options?.loop ?? true;
    musicOffset.current = options?.offset ?? 0;
    desiredPlaying.current = musicEnabled;
    musicStarted.current = false;

    if (!musicEnabled || !appIsActive.current) return;

    void ready.then(async () => {
      if (!desiredPlaying.current || !appIsActive.current) return;
      musicStarted.current = true;
      await startNativeMusic(loopMusic.current, musicOffset.current);
    });
  };

  const stopMusic = () => {
    desiredPlaying.current = false;
    loopMusic.current = false;
    void NativeAudio.pause({ assetId: NATIVE_MUSIC_ASSET_ID });
  };

  const value: AudioServiceContextValue = {
    playSound,
    playMusic,
    stopMusic,
  };

  return <AudioServiceContext.Provider value={value}>{children}</AudioServiceContext.Provider>;
}

function WebAudioServiceProvider({ children }: AudioServiceProviderProps) {
  const soundEnabled = useOptionsStore(selectEnableSound);
  const musicEnabled = useOptionsStore(selectEnableMusic);

  const [soundPlayer, setSoundPlayer] = useState<AudioPlayer | null>(null);
  const [musicPlayer, setMusicPlayer] = useState<AudioPlayer | null>(null);
  const [loopMusic, setLoopMusic] = useState<boolean>(false);

  useEffect(() => {
    const _soundPlayer = createAudioPlayer();
    setSoundPlayer(_soundPlayer);

    const _musicPlayer = createAudioPlayer();
    setMusicPlayer(_musicPlayer);

    _musicPlayer?.addListener('playbackStatusUpdate', (status) => {
      if (status.isLoaded && status.didJustFinish && loopMusic) {
        _musicPlayer?.seekTo(0);
        _musicPlayer.play();
      }
    });

    return () => {
      soundPlayer?.release();
      _musicPlayer?.release();
      setSoundPlayer(null);
      setMusicPlayer(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (musicPlayer) {
      if (musicEnabled) {
        musicPlayer?.play();
      } else {
        musicPlayer?.pause();
      }
    }
  }, [musicEnabled, musicPlayer]);

  const playSound = (soundKey: SoundKey, offset = 0) => {
    if (!soundPlayer) return;
    if (!soundEnabled) return;

    const source = audioSources[soundKey];
    soundPlayer.replace(source);
    soundPlayer.seekTo(offset);
    soundPlayer.play();
  };

  const playMusic = (musicKey: MusicKey, _options?: { offset?: number; loop?: boolean }) => {
    if (!musicPlayer) return;

    musicPlayer?.pause();

    const offset = _options?.offset ?? 0;
    const loop = _options?.loop ?? true;

    setLoopMusic(loop);

    const source = musicSources[musicKey];
    musicPlayer?.replace(source);
    musicPlayer?.seekTo(offset);

    if (musicEnabled) {
      musicPlayer?.play();
    }
  };

  const stopMusic = () => {
    if (!musicPlayer) return;

    setLoopMusic(false);
    musicPlayer.pause();
    return musicPlayer.currentTime;
  };

  const value: AudioServiceContextValue = {
    playSound,
    playMusic,
    stopMusic,
  };

  return <AudioServiceContext.Provider value={value}>{children}</AudioServiceContext.Provider>;
}

export function AudioServiceProvider({ children }: AudioServiceProviderProps) {
  if (selectAudioBackend(isNativeShell()) === 'native') {
    return <NativeAudioServiceProvider>{children}</NativeAudioServiceProvider>;
  }

  return <WebAudioServiceProvider>{children}</WebAudioServiceProvider>;
}

export function useAudioService(): AudioServiceContextValue {
  const context = useContext(AudioServiceContext);
  if (context === undefined) {
    throw new Error('useAudioService must be used within an AudioServiceProvider');
  }
  return context;
}
