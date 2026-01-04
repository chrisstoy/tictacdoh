import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { JiggleButton } from '@/components/JiggleButton';
import { OutlineText } from '@/components/OutlineText';
import { MinusImage } from '@/components/images/MinusImage';
import { PlusImage } from '@/components/images/PlusImage';
import {
  AVAILABLE_ROUNDS_IN_MATCH,
  INFINITE_ROUNDS,
  selectRoundsInMatch,
  useMatchActions,
  useMatchStore,
} from '@/services/matchState';

export function RoundsInMatch() {
  const { setRoundsInMatch } = useMatchActions();
  const roundsInMatch = useMatchStore(selectRoundsInMatch);

  const [selectedIndex, setSelectedIndex] = useState(
    AVAILABLE_ROUNDS_IN_MATCH.indexOf(roundsInMatch)
  );

  const handleDecrease = useCallback(() => {
    if (selectedIndex > 0) {
      const nextIndex = selectedIndex - 1;
      setSelectedIndex(nextIndex);
      setRoundsInMatch(AVAILABLE_ROUNDS_IN_MATCH[nextIndex]);
    }
  }, [selectedIndex, setRoundsInMatch]);

  const handleIncrease = useCallback(() => {
    if (selectedIndex < AVAILABLE_ROUNDS_IN_MATCH.length - 1) {
      const nextIndex = selectedIndex + 1;
      setSelectedIndex(nextIndex);
      setRoundsInMatch(AVAILABLE_ROUNDS_IN_MATCH[nextIndex]);
    }
  }, [selectedIndex, setRoundsInMatch]);

  return (
    <View className="flex flex-row items-center justify-center ">
      <View className="flex flex-row flex-1 max-w-96">
        <JiggleButton className="flex flex-auto" onPress={handleDecrease}>
          <MinusImage></MinusImage>
        </JiggleButton>
        <OutlineText className="text-white outline text-2xl">Rounds in Match: </OutlineText>
        {roundsInMatch === INFINITE_ROUNDS ? (
          <OutlineText className="text-white outline text-2xl">∞</OutlineText>
        ) : (
          <OutlineText className="text-white outline text-2xl">{roundsInMatch}</OutlineText>
        )}
        <JiggleButton className="flex flex-auto" onPress={handleIncrease}>
          <PlusImage></PlusImage>
        </JiggleButton>
      </View>
    </View>
  );
}
