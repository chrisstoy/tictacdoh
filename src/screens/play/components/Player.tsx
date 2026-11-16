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
/** Mark glyph size and clear air below it before the Wins pill (pt). */
const MARK_SIZE = 40;
const MARK_TO_WINS_GAP = 36;

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
      className={`${className} p-2 flex-1 justify-center ${isPlayersTurn ? 'bg-highlight border-border border-solid border-2 rounded-xl' : ''}`}
      {...rest}
    >
      <View
        className="flex-none items-center justify-center"
        style={localSeat ? undefined : { height: 44, width: '100%', marginBottom: 8 }}
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
            style={{
              fontFamily: 'PoppinsBlack',
              color: TITLE_FILL,
              fontSize: 20,
              lineHeight: 26,
              marginBottom: 8,
            }}
          >
            {isLocalPlayer ? 'Local' : 'Remote'}
          </OutlineText>
        ) : isClanker ? (
          <ComputerImage />
        ) : (
          <MeatbagImage />
        )}
      </View>

      <View
        testID={`player-mark-${player}`}
        className="w-full flex-none items-center justify-center"
        style={{ height: MARK_SIZE }}
      >
        {/* Fixed size — width/height 100% was overflowing the scoreboard and eating the Wins gap. */}
        {player === 'X' && <XImage size={MARK_SIZE} />}
        {player === 'O' && <OImage size={MARK_SIZE} />}
      </View>

      <View testID={`player-mark-wins-gap-${player}`} style={{ height: MARK_TO_WINS_GAP }} />

      <View className="flex-none items-center justify-center">
        {/* <TextWithBackground className="text-white text-xs px-">{`Wins: ${wins}`}</TextWithBackground> */}
        <Text className="text-xs color-white text-background px-2">{`Wins: ${wins}`}</Text>
      </View>
    </View>
  );
}
