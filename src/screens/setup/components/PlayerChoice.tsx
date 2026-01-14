import Animated, {
  BounceIn,
  BounceOut,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { Pressable, PressableProps, View } from 'react-native';
import { createJiggleAnim } from '@/animations/jiggleAnim';
import { ComputerImage } from '@/components/images/ComputerImage';
import { MeatbagImage } from '@/components/images/MeatbagImage';
import { OImage } from '@/components/images/OImage';
import { XImage } from '@/components/images/XImage';
import { useAudioService } from '@/services/audioService';
import { PlayerId } from '@/types';

interface Props extends Omit<PressableProps, 'onPress'> {
  player: PlayerId;
  isCPU: boolean;
  onClick: () => void;
}
export function PlayerChoice({ player, isCPU, onClick, className, ...rest }: Props) {
  const { playSound } = useAudioService();
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
      flex: 1,
    };
  });

  const handlePress = () => {
    // playSound('squish');
    playSound('thump', 0.116);
    rotation.value = createJiggleAnim(onClick);
  };

  return (
    <Pressable onPress={handlePress} className={`${className}`} {...rest}>
      <Animated.View style={animatedStyle}>
        <View className="flex-[1]">
          {player === 'X' && <XImage></XImage>}
          {player === 'O' && <OImage></OImage>}
        </View>
      </Animated.View>
      <View className="flex-[0.25] content-center">
        {isCPU && (
          <Animated.View
            entering={BounceIn.duration(100)}
            exiting={BounceOut.duration(50)}
            style={{ flex: 1 }}
          >
            <ComputerImage></ComputerImage>
          </Animated.View>
        )}
        {!isCPU && (
          <Animated.View
            entering={BounceIn.duration(100)}
            exiting={BounceOut.duration(50)}
            style={{ flex: 1 }}
          >
            <MeatbagImage></MeatbagImage>
          </Animated.View>
        )}
        <View className="flex-1"></View>
      </View>
    </Pressable>
  );
}
