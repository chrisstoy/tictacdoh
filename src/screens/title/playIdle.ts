import { withRepeat, withSequence, withTiming } from 'react-native-reanimated';

export const PLAY_PULSE_SCALE = 1.06;
export const PLAY_PULSE_MS = 700;

/** Repeating scale pulse, or a still scale of 1 when reduce motion is on. */
export function startPlayIdle(reduceMotion: boolean) {
  if (reduceMotion) return 1;

  return withRepeat(
    withSequence(
      withTiming(PLAY_PULSE_SCALE, { duration: PLAY_PULSE_MS }),
      withTiming(1, { duration: PLAY_PULSE_MS })
    ),
    -1,
    false
  );
}
