import { Text, View } from 'react-native';
import { useGameStore } from '@/services/gameState';

export function Score() {
  const gameStore = useGameStore();

  return (
    <View>
      {gameStore.isDraw && <Text className="text-dough-500 outline">Draw</Text>}
      {gameStore.winner !== undefined && (
        <View>
          <Text className="text-dough-500 outline">{gameStore.winner.player} Wins</Text>
        </View>
      )}
    </View>
  );
}
