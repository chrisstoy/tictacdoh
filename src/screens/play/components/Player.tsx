import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { ComputerImage } from '@/components/images/ComputerImage';
import { MeatbagImage } from '@/components/images/MeatbagImage';
import { OImage } from '@/components/images/OImage';
import { XImage } from '@/components/images/XImage';
import { useGameStore } from '@/services/gameState';
import { PlayerId } from '@/types';

interface Props {
  player: PlayerId;
  className?: string;
}

export function Player({ player, className }: Props) {
  const { isCPU, winner, turn, stats } = useGameStore();

  const isPlayersTurn = useMemo(
    () => winner === undefined && turn === player,
    [winner, turn, player]
  );

  const isClanker = useMemo(() => isCPU[player], [isCPU, player]);
  const wins = useMemo(() => stats.wins[player], [stats, player]);

  return (
    <View
      className={`${className} p-2 ${isPlayersTurn ? 'bg-orange-500 border-outline-500 border-solid border-2 rounded-xl' : ''}`}
    >
      {isClanker ? (
        <View className="flex-1">
          <ComputerImage></ComputerImage>
        </View>
      ) : (
        <View className="flex-1">
          <MeatbagImage></MeatbagImage>
        </View>
      )}
      <View className="flex-auto my-1">
        {player === 'X' && <XImage></XImage>}
        {player === 'O' && <OImage></OImage>}
      </View>

      <View className="flex-1 items-center">
        <Text className="outline text-white">{`Wins: ${wins}`}</Text>
      </View>
    </View>
  );
}
