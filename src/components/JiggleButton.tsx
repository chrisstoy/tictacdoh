import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Pressable, View } from 'react-native';
import { createJiggleAnim } from '@/animations/jiggleAnim';

interface Props extends React.PropsWithChildren {
  className?: string;
  onClick: () => void;
}

export function JiggleButton({ className, onClick, children, ...rest }: Props) {
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
    <Pressable className={className} onPress={handlePress} {...rest}>
      <Animated.View style={animatedStyle}>
        <View className="flex-auto">{children}</View>
      </Animated.View>
    </Pressable>
  );
}
