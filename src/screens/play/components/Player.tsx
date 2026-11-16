import { Text, View } from 'react-native';
import { OutlineText } from '@/components/OutlineText';
import { ComputerImage } from '@/components/images/ComputerImage';
import { MeatbagImage } from '@/components/images/MeatbagImage';
import { OImage } from '@/components/images/OImage';
import { XImage } from '@/components/images/XImage';
import { selectIsPlayerCPU, selectRoundsWonByPlayer, useMatchStore } from '@/services/matchState';
import { selectOnlineSeat, useOnlineSessionStore } from '@/services/online';
import { selectIsPlayerTurn, useRoundStore } from '@/services/roundState';
import { PlayerId } from '@/types';

const TITLE_FILL = '#f06c1c';
const TITLE_OUTLINE = '#582008';

interface Props extends React.ComponentProps<typeof View> {
  player: PlayerId;
}

export function Player({ player, className, ...rest }: Props) {
  const isClanker = useMatchStore(selectIsPlayerCPU(player));
  const wins = useMatchStore(selectRoundsWonByPlayer(player));
  const isPlayersTurn = useRoundStore(selectIsPlayerTurn(player));
  const localSeat = useOnlineSessionStore(selectOnlineSeat);
  const isLocalPlayer = localSeat === player;

  return (
    <View
      className={`${className} p-2 flex-1 ${isPlayersTurn ? 'bg-highlight border-border border-solid border-2 rounded-xl' : ''}`}
      {...rest}
    >
      <View
        className="flex-none items-center justify-center"
        testID={
          localSeat ? (isLocalPlayer ? `local-player-${player}` : `remote-player-${player}`) : undefined
        }
      >
        {localSeat ? (
          <OutlineText
            accessibilityLabel={isLocalPlayer ? 'Local' : 'Remote'}
            className="text-center"
            outlineColor={TITLE_OUTLINE}
            outlineWidth={1}
            style={{ fontFamily: 'PoppinsBlack', color: TITLE_FILL, fontSize: 20, lineHeight: 26 }}
          >
            {isLocalPlayer ? 'Local' : 'Remote'}
          </OutlineText>
        ) : isClanker ? (
          <ComputerImage />
        ) : (
          <MeatbagImage />
        )}
      </View>
      <View className="flex-1 mt-1 min-h-0">
        {player === 'X' && <XImage></XImage>}
        {player === 'O' && <OImage></OImage>}
      </View>

      <View className="flex-none items-center justify-center pt-3">
        {/* <TextWithBackground className="text-white text-xs px-">{`Wins: ${wins}`}</TextWithBackground> */}
        <Text className="text-xs color-white text-background px-2">{`Wins: ${wins}`}</Text>
      </View>
    </View>
  );
}
