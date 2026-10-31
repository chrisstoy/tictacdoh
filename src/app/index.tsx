import Animated, { FadeIn, FadeOut, FadingTransition } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { OptionsScreen } from '@/screens/options/OptionsScreen';
import { PlayGameScreen } from '@/screens/play/PlayGameScreen';
import { SetupGameScreen } from '@/screens/setup/SetupGameScreen';
import { TitleScreen } from '@/screens/title/TitleScreen';
import { useAudioService } from '@/services/audioService';
import { useFrameMaxWidth } from '@/services/useFrameMaxWidth';

type ActiveMode = 'TITLE' | 'PLAY' | 'NEW' | 'OPTIONS';

export default function Index() {
  const { playMusic, stopMusic } = useAudioService();
  const [gameMode, setGameMode] = useState<ActiveMode>('TITLE');
  const maxWidth = useFrameMaxWidth();

  useEffect(() => {
    if (gameMode === 'TITLE' || gameMode === 'NEW' || gameMode === 'OPTIONS') {
      playMusic('setup', { loop: true });
    } else {
      stopMusic();
    }

    return () => {
      stopMusic();
    };
  }, [gameMode, playMusic, stopMusic]);

  return (
    <View className="flex-1 self-center w-full" style={{ maxWidth }}>
      {gameMode === 'TITLE' && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={FadingTransition.duration(100)}
          style={{ flex: 1 }}
        >
          <TitleScreen onPlay={() => setGameMode('NEW')} />
        </Animated.View>
      )}
      {gameMode === 'NEW' && (
        <View className="flex-1">
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            layout={FadingTransition.duration(100)}
            style={{ flex: 1 }}
          >
            <SetupGameScreen
              onStartGame={() => {
                setGameMode('PLAY');
              }}
              onOptions={() => setGameMode('OPTIONS')}
            ></SetupGameScreen>
          </Animated.View>
        </View>
      )}
      {gameMode === 'OPTIONS' && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={FadingTransition.duration(100)}
          style={{ flex: 1 }}
        >
          <OptionsScreen onExit={() => setGameMode('NEW')}></OptionsScreen>
        </Animated.View>
      )}
      {gameMode === 'PLAY' && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={FadingTransition.duration(100)}
          style={{ flex: 1 }}
        >
          <PlayGameScreen
            onExitGame={() => {
              setGameMode('NEW');
            }}
          ></PlayGameScreen>
        </Animated.View>
      )}
      <PWAInstallPrompt />
    </View>
  );
}
