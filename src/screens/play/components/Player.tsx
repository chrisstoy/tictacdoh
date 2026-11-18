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
/** Shared slot so Meatbag, Clanker, Local, and Remote line up across columns. */
const TITLE_SLOT_HEIGHT = 40;
/** Fixed square so the glyph cannot grow and swallow the gaps around it. */
const MARK_SIZE = 56;
/** Small inset above the title and below Wins. Gaps between the three rows are equal. */
const COLUMN_EDGE = 8;

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
      {...rest}
      testID={`player-column-${player}`}
      className={`${className} h-full flex-1 rounded-xl border-2 border-solid ${
        isPlayersTurn ? 'bg-highlight border-border' : 'border-transparent'
      }`}
      style={{
        paddingHorizontal: COLUMN_EDGE,
        paddingVertical: COLUMN_EDGE,
        justifyContent: 'space-between',
      }}
    >
      <View
        testID={
          localSeat
            ? isLocalPlayer
              ? `local-player-${player}`
              : `remote-player-${player}`
            : `player-title-${player}`
        }
        className="w-full flex-none items-center justify-center"
        style={{ height: TITLE_SLOT_HEIGHT }}
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
        {player === 'X' && <XImage size={MARK_SIZE} />}
        {player === 'O' && <OImage size={MARK_SIZE} />}
      </View>

      <View testID={`player-wins-${player}`} className="flex-none items-center justify-center">
        <Text className="text-xs color-white text-background px-2">{`Wins: ${wins}`}</Text>
      </View>
    </View>
  );
}
