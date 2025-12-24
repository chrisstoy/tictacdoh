import { Text, View } from 'react-native';
import { useGameStore } from '@/services/gameState';
import { EndOfGame } from './EndOfGame';
import { Player } from './Player';

export function Scoreboard() {
  const gameStore = useGameStore();

  return (
    <View className="flex-1 flex justify-center">
      <View className="h-1/4 flex items-center my-4">
        <Text className="outline text-white text-2xl">Round: {gameStore.stats.totalGames}</Text>
      </View>

      <View className="flex flex-row flex-auto">
        <View className="h-full flex-1 flex-row justify-evenly">
          <Player className="w-1/3" player={'X'}></Player>
          <Player className="w-1/3" player={'O'}></Player>
        </View>

        {gameStore.isGameOver() && (
          <View className="absolute top-0 left-0 h-full w-full flex-1 flex">
            <EndOfGame></EndOfGame>
          </View>
        )}
      </View>
    </View>
  );
}
