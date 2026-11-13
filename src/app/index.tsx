import Animated, { FadeIn, FadeOut, FadingTransition } from 'react-native-reanimated';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { OnlineLobbyScreen } from '@/screens/lobby/OnlineLobbyScreen';
import { OptionsScreen } from '@/screens/options/OptionsScreen';
import { PlayGameScreen } from '@/screens/play/PlayGameScreen';
import { SetupGameScreen } from '@/screens/setup/SetupGameScreen';
import { TitleScreen } from '@/screens/title/TitleScreen';
import { useAudioService } from '@/services/audioService';
import { acceptDeepLinkJoin, startDeepLinkListener } from '@/services/online';
import { useOnlineSessionStore } from '@/services/online/sessionStore';
import { useFrameMaxWidth } from '@/services/useFrameMaxWidth';

type ActiveMode = 'TITLE' | 'PLAY' | 'NEW' | 'OPTIONS' | 'LOBBY';

export default function Index() {
  const { playMusic, stopMusic } = useAudioService();
  const [gameMode, setGameMode] = useState<ActiveMode>('TITLE');
  const maxWidth = useFrameMaxWidth();
  const joiningDeepLink = useRef(false);

  useEffect(() => {
    if (gameMode === 'TITLE' || gameMode === 'NEW' || gameMode === 'OPTIONS' || gameMode === 'LOBBY') {
      playMusic('setup', { loop: true });
    } else {
      stopMusic();
    }

    return () => {
      stopMusic();
    };
  }, [gameMode, playMusic, stopMusic]);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;

    void startDeepLinkListener({
      onJoinCode: (code) => {
        if (joiningDeepLink.current || cancelled) {
          return;
        }
        joiningDeepLink.current = true;
        void (async () => {
          try {
            await acceptDeepLinkJoin(code);
            if (!cancelled) {
              setGameMode('LOBBY');
            }
          } catch (e) {
            const message = e instanceof Error ? e.message : 'Deep-link join failed';
            useOnlineSessionStore.getState().applyError(message);
          } finally {
            joiningDeepLink.current = false;
          }
        })();
      },
    }).then((remove) => {
      if (cancelled) {
        remove();
        return;
      }
      stop = remove;
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return (
    <View className="flex-1 self-center w-full" style={{ maxWidth }}>
      {gameMode === 'TITLE' && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={FadingTransition.duration(100)}
          style={{ flex: 1 }}
        >
          <TitleScreen onPlay={() => setGameMode('NEW')} />
        </Animated.View>
      )}
      {gameMode === 'NEW' && (
        <View className="flex-1">
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            layout={FadingTransition.duration(100)}
            style={{ flex: 1 }}
          >
            <SetupGameScreen
              onStartGame={() => {
                setGameMode('PLAY');
              }}
              onOptions={() => setGameMode('OPTIONS')}
              onEnterLobby={() => setGameMode('LOBBY')}
            ></SetupGameScreen>
          </Animated.View>
        </View>
      )}
      {gameMode === 'LOBBY' && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={FadingTransition.duration(100)}
          style={{ flex: 1 }}
        >
          <OnlineLobbyScreen
            onReadyToPlay={() => setGameMode('PLAY')}
            onLeave={() => setGameMode('NEW')}
          />
        </Animated.View>
      )}
      {gameMode === 'OPTIONS' && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={FadingTransition.duration(100)}
          style={{ flex: 1 }}
        >
          <OptionsScreen onExit={() => setGameMode('NEW')}></OptionsScreen>
        </Animated.View>
      )}
      {gameMode === 'PLAY' && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={FadingTransition.duration(100)}
          style={{ flex: 1 }}
        >
          <PlayGameScreen
            onExitGame={() => {
              setGameMode('NEW');
            }}
          ></PlayGameScreen>
        </Animated.View>
      )}
      <PWAInstallPrompt />
    </View>
  );
}
