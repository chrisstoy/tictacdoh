import { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { TileState } from '../types';
import { OImage } from './images/OImage';
import { XImage } from './images/XImage';

interface Props extends React.ComponentProps<typeof View> {
  index: number;
  state: TileState;
  allowMove: boolean;
  isOnWinningLine: boolean;

  onClick?: () => void;
}

export function Tile({
  index,
  state,
  allowMove,
  isOnWinningLine,
  className,
  onClick,
  ...rest
}: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOnWinningLine) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnWinningLine, pulseAnim]);

  return (
    <View className={`${className} text-white flex items-center justify-center p-[5%]`} {...rest}>
      <Pressable
        className="flex flex-1 w-full items-center justify-center"
        onPress={() => onClick?.()}
      >
        {isOnWinningLine && (
          <Animated.View
            style={{ width: '100%', height: '100%', transform: [{ scale: pulseAnim }] }}
          >
            {state === 'X' && <XImage></XImage>}
            {state === 'O' && <OImage></OImage>}
          </Animated.View>
        )}
        {!isOnWinningLine && (
          <View className="w-full h-full items-center justify-center">
            {state === 'X' && <XImage></XImage>}
            {state === 'O' && <OImage></OImage>}
          </View>
        )}
      </Pressable>
    </View>
  );
}
