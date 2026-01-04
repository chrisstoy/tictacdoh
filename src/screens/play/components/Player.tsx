import { View } from 'react-native';
import { ComputerImage } from '@/components/images/ComputerImage';
import { MeatbagImage } from '@/components/images/MeatbagImage';
import { OImage } from '@/components/images/OImage';
import { XImage } from '@/components/images/XImage';
import { OutlineText } from '@/components/OutlineText';
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
      className={`${className} p-2 flex-1 ${isPlayersTurn ? 'bg-orange-500 border-outline-500 border-solid border-2 rounded-xl' : ''}`}
      {...rest}
    >
      {isClanker ? (
        <View className="flex-[1] min-h-0">
          <ComputerImage></ComputerImage>
        </View>
      ) : (
        <View className="flex-[1] min-h-0">
          <MeatbagImage></MeatbagImage>
        </View>
      )}
      <View className="flex-[2] my-1 min-h-0">
        {player === 'X' && <XImage></XImage>}
        {player === 'O' && <OImage></OImage>}
      </View>

      <View className="flex-[1] items-center justify-center">
        <OutlineText className="text-white" outlineColor="#2b262c" outlineWidth={1}>
          {`Wins: ${wins}`}
        </OutlineText>
      </View>
    </View>
  );
}
