import { Text, View } from 'react-native';
import { useGameStore } from '@/services/gameState';
import { PlayerId } from '@/types';

interface Props {
  player: PlayerId;
  playersTurn: boolean;
  isCPU: boolean;
}

export function Player({ player, playersTurn, isCPU }: Props) {
  const gameStore = useGameStore();

  return (
    <View>
      <View>{`${isCPU ? 'CPU' : 'Player'}: ${player}`}</View>
      <Text className="outline">{`Wins: ${gameStore.stats.wins[player]}`}</Text>
    </View>
  );
}
