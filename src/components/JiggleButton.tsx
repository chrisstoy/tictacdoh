import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Pressable, View } from 'react-native';
import { createJiggleAnim } from '@/animations/jiggleAnim';

type Props = React.PropsWithChildren &
  React.ComponentProps<typeof View> & {
    onPress: () => void;
  };

export function JiggleButton({ className, onPress, children, ...rest }: Props) {
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
      flex: 1,
    };
  });

  const handlePress = () => {
    rotation.value = createJiggleAnim(onPress);
  };

  return (
    <Pressable className={className} onPress={handlePress} {...rest}>
      <Animated.View style={animatedStyle}>
        <View className="flex-1">{children}</View>
      </Animated.View>
    </Pressable>
  );
}
