import { View } from 'react-native';
import { DrawImage } from '@/components/images/DrawImage';
import { OImage } from '@/components/images/OImage';
import { WinsImage } from '@/components/images/WinsImage';
import { XImage } from '@/components/images/XImage';
import { useGameStore } from '@/services/gameState';

export function EndOfGame() {
  const gameStore = useGameStore();

  return (
    <View
      className="
    bg-orange-500 border-outline-500 border-solid border-2 rounded-xl
      flex-auto flex-row items-center w-full h-full
      "
    >
      {gameStore.isDraw && (
        <View className="h-full flex-auto flex flex-row">
          <DrawImage></DrawImage>
        </View>
      )}
      {gameStore.winner !== undefined && (
        <View className="h-full flex-auto flex flex-row">
          <View className="flex-auto"></View>
          <View className="flex-none w-16 m-4">
            {gameStore.winner.player === 'X' && <XImage></XImage>}
            {gameStore.winner.player === 'O' && <OImage></OImage>}
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
