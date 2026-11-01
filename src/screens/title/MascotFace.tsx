import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import {
  BLINK_MS,
  BLINK_SQUASH,
  BROW_FURROW_DEG,
  BROW_FURROW_DROP,
  BROW_LIFT,
  BROW_MS,
  CLOSED_MOUTH_BAR,
  type FaceBox,
  INK,
  LOOK_MS,
  LOOK_SHIFT,
  MOUTH_MS,
  MOUTH_SMALL_SCALE,
  PART_BOXES,
} from './faceLayout';
import type { BrowPose, EyesPose, FacePose, MouthPose } from './faceMotion';

interface Props {
  pose: FacePose;
  /** Size of the drawn mascot, in px. Offsets are fractions of it. */
  width: number;
  height: number;
}

/**
 * Eyes, brows, and mouth as separate pieces over the featureless base image.
 * Each piece reads its own part of the pose, so they move independently.
 */
export function MascotFace({ pose, width, height }: Props) {
  const eyes = useEyesStyle(pose.eyes, width);
  const browLeft = useBrowStyle(pose.browLeft, 'left', height);
  const browRight = useBrowStyle(pose.browRight, 'right', height);
  const { open: mouthOpen, closed: mouthClosed } = useMouthStyles(pose.mouth);

  return (
    <View
      testID="face-motion"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.face]}
    >
      <View testID={`face-eyes-${pose.eyes}`} />
      <View testID={`face-brows-${pose.browLeft}-${pose.browRight}`} />
      <View testID={`face-mouth-${pose.mouth}`} />

      <Part
        box={PART_BOXES.leftEye}
        style={eyes}
        source={require('@/assets/mascot/eye-left.png')}
      />
      <Part
        box={PART_BOXES.rightEye}
        style={eyes}
        source={require('@/assets/mascot/eye-right.png')}
      />
      <Part
        box={PART_BOXES.leftBrow}
        style={browLeft}
        source={require('@/assets/mascot/brow-left.png')}
      />
      <Part
        box={PART_BOXES.rightBrow}
        style={browRight}
        source={require('@/assets/mascot/brow-right.png')}
      />
      <Part
        box={PART_BOXES.mouth}
        style={mouthOpen}
        source={require('@/assets/mascot/mouth.png')}
      />
      <Animated.View testID="mascot-mouth-bar" style={[boxStyle(PART_BOXES.mouth), mouthClosed]}>
        <View
          style={{
            position: 'absolute',
            left: `${CLOSED_MOUTH_BAR.x * 100}%`,
            top: `${CLOSED_MOUTH_BAR.y * 100}%`,
            width: `${CLOSED_MOUTH_BAR.w * 100}%`,
            height: `${CLOSED_MOUTH_BAR.h * 100}%`,
            borderRadius: 999,
            backgroundColor: INK,
          }}
        />
      </Animated.View>
    </View>
  );
}

function boxStyle(box: FaceBox) {
  return {
    position: 'absolute',
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.w * 100}%`,
    height: `${box.h * 100}%`,
  } as const;
}

function Part({ box, style, source }: { box: FaceBox; style: object; source: number }) {
  return (
    <Animated.View style={[boxStyle(box), style]}>
      <Image
        accessible={false}
        source={source}
        style={{ width: '100%', height: '100%' }}
        resizeMode="stretch"
      />
    </Animated.View>
  );
}

function useEyesStyle(pose: EyesPose, width: number) {
  const blink = useSharedValue(0);
  const look = useSharedValue(0);

  useEffect(() => {
    blink.value = withTiming(pose === 'blink' ? 1 : 0, { duration: BLINK_MS });
    look.value = withTiming(pose === 'lookLeft' ? -1 : pose === 'lookRight' ? 1 : 0, {
      duration: LOOK_MS,
    });
  }, [pose, blink, look]);

  return useAnimatedStyle(() => ({
    transform: [
      { translateX: look.value * LOOK_SHIFT * width },
      { scaleY: 1 - BLINK_SQUASH * blink.value },
    ],
  }));
}

function useBrowStyle(pose: BrowPose, side: 'left' | 'right', height: number) {
  const lift = useSharedValue(0);
  const furrow = useSharedValue(0);

  useEffect(() => {
    lift.value = withTiming(pose === 'raised' ? 1 : 0, { duration: BROW_MS });
    furrow.value = withTiming(pose === 'furrowed' ? 1 : 0, { duration: BROW_MS });
  }, [pose, lift, furrow]);

  // The inner end of a furrowed brow dips: clockwise on the left brow, counter-clockwise on the right.
  const sign = side === 'left' ? 1 : -1;
  return useAnimatedStyle(() => ({
    transform: [
      { translateY: (furrow.value * BROW_FURROW_DROP - lift.value * BROW_LIFT) * height },
      { rotate: `${sign * furrow.value * BROW_FURROW_DEG}deg` },
    ],
  }));
}

function useMouthStyles(pose: MouthPose) {
  const small = useSharedValue(0);
  const closed = useSharedValue(0);

  useEffect(() => {
    small.value = withTiming(pose === 'small' ? 1 : 0, { duration: MOUTH_MS });
    closed.value = withTiming(pose === 'closed' ? 1 : 0, { duration: MOUTH_MS });
  }, [pose, small, closed]);

  const open = useAnimatedStyle(() => ({
    opacity: 1 - closed.value,
    transform: [
      { scaleX: 1 - (1 - MOUTH_SMALL_SCALE.x) * small.value },
      { scaleY: 1 - (1 - MOUTH_SMALL_SCALE.y) * small.value },
    ],
  }));
  const bar = useAnimatedStyle(() => ({ opacity: closed.value }));

  return { open, closed: bar };
}

const styles = StyleSheet.create({
  face: {
    pointerEvents: 'none',
  },
});
