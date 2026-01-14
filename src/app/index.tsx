import Animated, { FadeIn, FadeOut, FadingTransition } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { OptionsScreen } from '@/screens/options/OptionsScreen';
import { PlayGameScreen } from '@/screens/play/PlayGameScreen';
import { SetupGameScreen } from '@/screens/setup/SetupGameScreen';
import { useAudioService } from '@/services/audioService';

type ActiveMode = 'PLAY' | 'NEW' | 'OPTIONS';

export default function Index() {
  const { playMusic, stopMusic } = useAudioService();
  const [gameMode, setGameMode] = useState<ActiveMode>('NEW');

  useEffect(() => {
    if (gameMode === 'NEW' || gameMode === 'OPTIONS') {
      playMusic('setup');
    } else {
      stopMusic();
    }

    return () => {
      stopMusic();
    };
  }, [gameMode, playMusic, stopMusic]);

  return (
    <View className="flex-1 max-w-[30em] max-h-[60em] self-center w-full">
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
    </View>
  );
}
