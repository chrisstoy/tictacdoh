import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { JiggleButton } from '@/components/JiggleButton';
import { TextWithBackground } from '@/components/TextWithBackground';
import { MinusImage } from '@/components/images/MinusImage';
import { PlusImage } from '@/components/images/PlusImage';
import {
  AVAILABLE_ROUNDS_IN_MATCH,
  INFINITE_ROUNDS,
  selectRoundsInMatch,
  useMatchActions,
  useMatchStore,
} from '@/services/matchState';

type Props = React.ComponentProps<typeof View>;

export function RoundsInMatch({ ...rest }: Props) {
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
    <View {...rest}>
      <View className="flex flex-row w-full h-full max-w-96">
        <JiggleButton className="flex flex-none w-16" onPress={handleDecrease}>
          <MinusImage></MinusImage>
        </JiggleButton>
        <TextWithBackground className="text-text text-2xl">{`Rounds in Match: ${roundsInMatch === INFINITE_ROUNDS ? '∞' : roundsInMatch}`}</TextWithBackground>
        <JiggleButton className="flex flex-none w-16" onPress={handleIncrease}>
          <PlusImage></PlusImage>
        </JiggleButton>
      </View>
    </View>
  );
}
