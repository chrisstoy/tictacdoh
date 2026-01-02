import { withSequence, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export const createJiggleAnim = (onComplete: () => void) => {
  // Jiggle animation: rotate left, right, left, right, back to center
  return withSequence(
    withTiming(-5, { duration: 50 }),
    withTiming(5, { duration: 50 }),
    withTiming(-5, { duration: 50 }),
    withTiming(5, { duration: 50 }),
    withTiming(0, { duration: 50 }, (finished) => {
      'worklet';
      if (finished) {
        scheduleOnRN(onComplete);
      }
    })
  );
};
