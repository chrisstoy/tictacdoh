import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { AudioPlayer, AudioSource, createAudioPlayer } from 'expo-audio';
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

interface AudioServiceContextValue {
  playSound: (soundKey: SoundKey, offset?: number) => void;

  playMusic: (musicKey: MusicKey, options?: { offset?: number; loop?: boolean }) => void;
  stopMusic: () => void;
}

const AudioServiceContext = createContext<AudioServiceContextValue | undefined>(undefined);

interface AudioServiceProviderProps {
  children: ReactNode;
}

export function AudioServiceProvider({ children }: AudioServiceProviderProps) {
  const soundEnabled = useOptionsStore(selectEnableSound);
  const musicEnabled = useOptionsStore(selectEnableMusic);

  const [soundPlayer, setSoundPlayer] = useState<AudioPlayer | null>(null);
  const [musicPlayer, setMusicPlayer] = useState<AudioPlayer | null>(null);
  const [loopMusic, setLoopMusic] = useState<boolean>(false);

  useEffect(() => {
    setSoundPlayer(createAudioPlayer());
    setMusicPlayer(createAudioPlayer());

    musicPlayer?.addListener('playbackStatusUpdate', (status) => {
      if (status.isLoaded && status.didJustFinish && loopMusic) {
        musicPlayer?.seekTo(0);
        musicPlayer.play();
      }
    });

    return () => {
      soundPlayer?.release();
      musicPlayer?.release();
      setSoundPlayer(null);
      setMusicPlayer(null);
    };
  }, []);

  useEffect(() => {
    if (musicPlayer) {
      if (musicEnabled) {
        musicPlayer.play();
      } else {
        musicPlayer.pause();
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

    musicPlayer.pause();

    const offset = _options?.offset ?? 0;
    const loop = _options?.loop ?? true;

    setLoopMusic(loop);

    const source = musicSources[musicKey];
    musicPlayer.replace(source);
    musicPlayer.seekTo(offset);

    if (musicEnabled) {
      musicPlayer.play();
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

export function useAudioService(): AudioServiceContextValue {
  const context = useContext(AudioServiceContext);
  if (context === undefined) {
    throw new Error('useAudioService must be used within an AudioServiceProvider');
  }
  return context;
}
