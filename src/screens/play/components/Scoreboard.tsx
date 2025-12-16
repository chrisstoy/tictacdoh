import { Text, View } from 'react-native';
import { useGameStore } from '@/services/gameState';
import { Player } from './Player';
import { Score } from './Score';

export function Scoreboard() {
  const gameStore = useGameStore();

  return (
    <View>
      <View>
        <Text className="outline text-white">Round: {gameStore.stats.totalGames}</Text>
      </View>

      <View>
        <Player
          player={'X'}
          isCPU={gameStore.isCPU['X']}
          playersTurn={gameStore.winner === undefined && gameStore.turn === 'X'}
        ></Player>
        <Score></Score>
        <Player
          player={'O'}
          isCPU={gameStore.isCPU['O']}
          playersTurn={gameStore.winner === undefined && gameStore.turn === 'O'}
        ></Player>
      </View>
    </View>
  );
}
