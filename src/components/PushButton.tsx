import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Pressable, View } from 'react-native';
import { createPushAnim } from '@/animations/pushAnim';

type Props = React.PropsWithChildren &
  React.ComponentProps<typeof View> & {
    onPress: () => void;
  };

export function PushButton({ className, onPress, children, ...rest }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      flex: 1,
    };
  });

  const handlePress = () => {
    scale.value = createPushAnim(onPress);
  };

  return (
    <Pressable className={className} onPress={handlePress} {...rest}>
      <Animated.View style={animatedStyle}>
        <View className="flex-1">{children}</View>
      </Animated.View>
    </Pressable>
  );
}
