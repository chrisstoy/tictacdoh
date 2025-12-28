import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Pressable, PressableProps, View } from 'react-native';
import { createJiggleAnim } from '@/animations/jiggleAnim';
import { ComputerImage } from '../../../components/images/ComputerImage';
import { MeatbagImage } from '../../../components/images/MeatbagImage';
import { OImage } from '../../../components/images/OImage';
import { XImage } from '../../../components/images/XImage';
import { PlayerId } from '../../../types';

interface Props extends Omit<PressableProps, 'onPress'> {
  player: PlayerId;
  isCPU: boolean;
  onClick: () => void;
}
export function PlayerChoice({ player, isCPU, onClick, ...rest }: Props) {
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
      flex: 1,
    };
  });

  const handlePress = () => {
    rotation.value = createJiggleAnim(onClick);
  };

  return (
    <Pressable onPress={handlePress} {...rest}>
      <Animated.View style={animatedStyle}>
        <View className="flex-auto">
          {player === 'X' && <XImage></XImage>}
          {player === 'O' && <OImage></OImage>}
        </View>
        <View className="flex-[0.25] content-center">
          {isCPU ? (
            <View className="flex-1">
              <ComputerImage></ComputerImage>
            </View>
          ) : (
            <View className="flex-1">
              <MeatbagImage></MeatbagImage>
            </View>
          )}
          <View className="flex-auto"></View>
        </View>
      </Animated.View>
    </Pressable>
  );
}
