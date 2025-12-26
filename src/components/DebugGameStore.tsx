import { Text, View } from 'react-native';
import { useGameStore } from '@/services/gameState';

export function DebugGameStore() {
  // Assuming the game store is a class with methods to retrieve game data
  const gameStore = useGameStore();

  return (
    <View className="text-sm flex-none">
      <Text>{JSON.stringify(gameStore)}</Text>
    </View>
  );
}
