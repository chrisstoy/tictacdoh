import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Pressable, PressableProps, View } from 'react-native';
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
    // Jiggle animation: rotate left, right, left, right, back to center
    rotation.value = withSequence(
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    onClick();
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
