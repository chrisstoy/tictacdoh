import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MascotImage } from '@/components/images/MascotImage';
import { PlayImage } from '@/components/images/PlayImage';
import { useAudioService } from '@/services/audioService';
import { MascotFace } from './MascotFace';
import { FACE_SAMPLE_MS, type FacePose, REST_POSE, facePoseAt, poseKey } from './faceMotion';
import { startPlayIdle } from './playIdle';
import { containedSplashRect } from './splashFrame';

interface Props {
  onPlay: () => void;
}

export function TitleScreen({ onPlay }: Props) {
  const reduceMotion = useReducedMotion();
  const { playSound } = useAudioService();
  const [pose, setPose] = useState<FacePose>(REST_POSE);
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const rect = containedSplashRect(frame.width, frame.height);

  useEffect(() => {
    if (reduceMotion) {
      setPose(REST_POSE);
      return;
    }

    let elapsedMs = 0;
    let shown = poseKey(REST_POSE);
    const id = setInterval(() => {
      elapsedMs += FACE_SAMPLE_MS;
      const next = facePoseAt(elapsedMs);
      const key = poseKey(next);
      if (key !== shown) {
        shown = key;
        setPose(next);
      }
    }, FACE_SAMPLE_MS);

    return () => clearInterval(id);
  }, [reduceMotion]);

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
          <MascotImage />
          <MascotFace pose={pose} width={rect.width} height={rect.height} />
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
          <PlayImage />
        </Pressable>
      </Animated.View>
    </View>
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
    width: 200,
    aspectRatio: 969 / 540,
  },
});
