import Animated, { FadeIn, FadeOut, FadingTransition } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { OptionsScreen } from '@/screens/options/OptionsScreen';
import { PlayGameScreen } from '@/screens/play/PlayGameScreen';
import { SetupGameScreen } from '@/screens/setup/SetupGameScreen';
import { useGameStore, usePreviousGameStates } from '@/services/gameState';

type Mode = 'play' | 'new' | 'options';

export default function Index() {
  const gameStore = useGameStore();
  const previousGameStates = usePreviousGameStates();

  const [gameMode, setGameMode] = useState<Mode>('play');

  useEffect(() => {
    gameStore.initNewGame();
  }, []);

  return (
    <View className="flex-1" testID="index-screen">
      {gameMode === 'new' && (
        <View className="flex-1">
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            layout={FadingTransition.duration(100)}
            testID="anim-setup-game-screen"
            style={{ flex: 1 }}
          >
            <SetupGameScreen
              onStartGame={() => {
                gameStore.initNewGame();
                previousGameStates.clear();
                setGameMode('play');
              }}
              onOptions={() => setGameMode('options')}
            ></SetupGameScreen>
          </Animated.View>
        </View>
      )}
      {gameMode === 'options' && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={FadingTransition.duration(100)}
          style={{ flex: 1 }}
        >
          <OptionsScreen onExit={() => setGameMode('new')}></OptionsScreen>
        </Animated.View>
      )}
      {gameMode === 'play' && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={FadingTransition.duration(100)}
          style={{ flex: 1 }}
        >
          <PlayGameScreen
            onSetupGame={() => {
              setGameMode('new');
            }}
            onReplayGame={() => {
              gameStore.initNewGame();
              previousGameStates.clear();
            }}
          ></PlayGameScreen>
        </Animated.View>
      )}
    </View>
  );
}
