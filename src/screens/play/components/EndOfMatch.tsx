import { View } from 'react-native';
import { DrawImage } from '@/components/images/DrawImage';
import { MatchOverImage } from '@/components/images/MatchOverImage';
import { OImage } from '@/components/images/OImage';
import { WinsImage } from '@/components/images/WinsImage';
import { XImage } from '@/components/images/XImage';
import { PlayerId } from '@/types';

interface Props {
  winner: PlayerId | undefined;
}

export function EndOfMatch({ winner }: Props) {
  return (
    <View
      className="
    bg-orange-500 border-outline-500 border-solid border-2 rounded-xl
      flex-auto flox-col flex items-center w-full h-full "
    >
      <View className="h-full w-full flex-auto flex flex-row">
        <MatchOverImage></MatchOverImage>
      </View>

      {winner === undefined ? (
        <View className="h-full w-full flex-auto flex flex-row">
          <DrawImage></DrawImage>
        </View>
      ) : (
        <View className="h-full flex-auto flex flex-row">
          <View className="flex-auto"></View>
          <View className="flex-none w-12 m-4">
            {winner === 'X' && <XImage></XImage>}
            {winner === 'O' && <OImage></OImage>}
          </View>
          <View className="flex-none w-44">
            <WinsImage></WinsImage>
          </View>
          <View className="flex-auto"></View>
        </View>
      )}
    </View>
  );
}
