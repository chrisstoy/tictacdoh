import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Pressable, PressableProps, View } from 'react-native';
import { GearImage } from '@/components/images/GearImage';

interface Props extends Omit<PressableProps, 'onPress'> {
  onClick: () => void;
}
export function OptionsButton({ onClick, ...rest }: Props) {
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
      withTiming(0, { duration: 50 }, (finished) => {
        'worklet';
        if (finished) {
          onClick();
        }
      })
    );
  };

  return (
    <Pressable onPress={handlePress} {...rest}>
      <Animated.View style={animatedStyle}>
        <View className="flex-auto">
          <GearImage></GearImage>
        </View>
      </Animated.View>
    </Pressable>
  );
}
