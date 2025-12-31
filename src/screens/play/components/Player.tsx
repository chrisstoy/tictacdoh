import { Text, View } from 'react-native';
import { ComputerImage } from '@/components/images/ComputerImage';
import { MeatbagImage } from '@/components/images/MeatbagImage';
import { OImage } from '@/components/images/OImage';
import { XImage } from '@/components/images/XImage';
import { selectIsPlayerCPU, selectRoundsWonByPlayer, useMatchStore } from '@/services/matchState';
import { selectIsPlayerTurn, useRoundStore } from '@/services/roundState';
import { PlayerId } from '@/types';

interface Props extends React.ComponentProps<typeof View> {
  player: PlayerId;
}

export function Player({ player, className, ...rest }: Props) {
  const isClanker = useMatchStore(selectIsPlayerCPU(player));
  const wins = useMatchStore(selectRoundsWonByPlayer(player));
  const isPlayersTurn = useRoundStore(selectIsPlayerTurn(player));

  return (
    <View
      className={`${className} p-2 ${isPlayersTurn ? 'bg-orange-500 border-outline-500 border-solid border-2 rounded-xl' : ''}`}
      {...rest}
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
