import { View } from 'react-native';
import { TextWithBackground } from '@/components/TextWithBackground';
import { Player } from './Player';

interface Props {
  roundsInMatch: number;
  currentRound: number;
}

export function Scoreboard({ currentRound, roundsInMatch }: Props) {
  return (
    <View className="flex-1 flex justify-center">
      <View className="h-1/4 flex items-center my-4">
        <TextWithBackground className="text-white text-2xl px-4">
          Round: {currentRound} / {roundsInMatch === -1 ? '∞' : roundsInMatch}
        </TextWithBackground>
      </View>

      <View className="flex flex-row flex-auto">
        <View className="h-full flex-1 flex-row justify-evenly">
          <Player className="w-1/3" player={'X'}></Player>
          <Player className="w-1/3" player={'O'}></Player>
        </View>
      </View>
    </View>
  );
}
