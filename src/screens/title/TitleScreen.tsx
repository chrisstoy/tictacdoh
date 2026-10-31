import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SplashScreenImage } from '@/components/images/SplashScreenImage';
import { useAudioService } from '@/services/audioService';
import { BROW_LIFT, FACE_BOXES, type FaceBox, INK, SKIN } from './faceLayout';
import { FACE_SAMPLE_MS, type FacePose, facePoseAt } from './faceMotion';
import { startPlayIdle } from './playIdle';
import { containedSplashRect } from './splashFrame';

interface Props {
  onPlay: () => void;
}

export function TitleScreen({ onPlay }: Props) {
  const reduceMotion = useReducedMotion();
  const { playSound } = useAudioService();
  const [elapsed, setElapsed] = useState(0);
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const pose = facePoseAt(reduceMotion ? 0 : elapsed);
  const rect = containedSplashRect(frame.width, frame.height);

  useEffect(() => {
    if (reduceMotion) {
      setElapsed(0);
      return;
    }

    let elapsedMs = 0;
    let cue: FacePose['cue'] = 'rest';
    const id = setInterval(() => {
      elapsedMs += FACE_SAMPLE_MS;
      const next = facePoseAt(elapsedMs);
      if (next.cue !== cue) {
        cue = next.cue;
        setElapsed(elapsedMs);
      }
    }, FACE_SAMPLE_MS);

    return () => clearInterval(id);
  }, [reduceMotion]);

  const blinkStyle = useCueOpacity(pose.blink);
  const browStyle = useCueOpacity(pose.browRaised);
  const mouthStyle = useCueOpacity(pose.mouthClosed);

  return (
    <View testID="title-screen" className="flex-1 bg-background" style={styles.screen}>
      <View
        style={styles.artSlot}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setFrame({ width, height });
        }}
      >
        <View
          style={[
            styles.art,
            { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
          ]}
        >
          <SplashScreenImage />
          <View
            testID="face-motion"
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={StyleSheet.absoluteFill}
          >
            <Animated.View
              testID="face-blink"
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, blinkStyle]}
            >
              <FacePatch box={FACE_BOXES.leftEye} color={SKIN} />
              <FacePatch box={FACE_BOXES.rightEye} color={SKIN} />
            </Animated.View>
            <Animated.View
              testID="face-brow"
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, browStyle]}
            >
              <FacePatch box={padBox(FACE_BOXES.leftBrow, 0.006, 0.008)} color={SKIN} />
              <FacePatch box={padBox(FACE_BOXES.rightBrow, 0.006, 0.008)} color={SKIN} />
              <FacePatch box={FACE_BOXES.leftBrow} color={INK} lift={BROW_LIFT} />
              <FacePatch box={FACE_BOXES.rightBrow} color={INK} lift={BROW_LIFT} />
            </Animated.View>
            <Animated.View
              testID="face-mouth"
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, mouthStyle]}
            >
              <FacePatch box={FACE_BOXES.mouth} color={SKIN} />
              <FacePatch
                box={{
                  x: FACE_BOXES.mouth.x,
                  y: FACE_BOXES.mouth.y + FACE_BOXES.mouth.h * 0.38,
                  w: FACE_BOXES.mouth.w,
                  h: FACE_BOXES.mouth.h * 0.28,
                }}
                color={INK}
              />
            </Animated.View>
          </View>
        </View>
      </View>
      <PlayControl
        reduceMotion={reduceMotion}
        onPress={() => {
          playSound('push');
          onPlay();
        }}
      />
    </View>
  );
}

function PlayControl({ reduceMotion, onPress }: { reduceMotion: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = startPlayIdle(reduceMotion);
    return () => {
      cancelAnimation(scale);
    };
  }, [reduceMotion, scale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.playRow}>
      <Animated.View testID="play-idle" style={pulseStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Play"
          onPress={onPress}
          style={styles.play}
        >
          <Text accessible={false} style={styles.playLabel}>
            PLAY
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function useCueOpacity(active: boolean) {
  const opacity = useSharedValue(active ? 1 : 0);
  const seen = useRef(active);

  if (seen.current !== active) {
    seen.current = active;
    opacity.value = withTiming(active ? 1 : 0, { duration: 90 });
  }

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
}

function padBox(box: FaceBox, padX: number, padY: number): FaceBox {
  return {
    x: box.x - padX,
    y: box.y - padY,
    w: box.w + padX * 2,
    h: box.h + padY * 2,
  };
}

function FacePatch({ box, color, lift = 0 }: { box: FaceBox; color: string; lift?: number }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: `${box.x * 100}%`,
        top: `${(box.y - lift) * 100}%`,
        width: `${box.w * 100}%`,
        height: `${box.h * 100}%`,
        borderRadius: 999,
        backgroundColor: color,
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fdde97',
  },
  artSlot: {
    flex: 1,
  },
  art: {
    position: 'absolute',
  },
  playRow: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  play: {
    minWidth: 168,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#51200b',
    backgroundColor: '#f59b3f',
    alignItems: 'center',
  },
  playLabel: {
    fontFamily: 'Komigo',
    fontSize: 40,
    color: '#e86a2a',
    textShadowColor: '#51200b',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
});
