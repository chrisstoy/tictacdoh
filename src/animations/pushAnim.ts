import { withSequence, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export const createPushAnim = (onComplete: () => void) => {
  // Push animation: scale down to simulate button press, then return to normal
  return withSequence(
    withTiming(0.95, { duration: 100 }),
    withTiming(1, { duration: 100 }, (finished) => {
      'worklet';
      if (finished) {
        scheduleOnRN(onComplete);
      }
    })
  );
};
