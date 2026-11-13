import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { PushButton } from '@/components/PushButton';
import { TextWithBackground } from '@/components/TextWithBackground';
import { TitleImage } from '@/components/images/TitleImage';
import {
  leaveOnlineSession,
  selectOnlineInviteUrl,
  selectOnlineLastError,
  selectOnlineRoomCode,
  useOnlineSessionStore,
} from '@/services/online';
import { shareOnlineInvite } from '@/services/online/shareInvite';

type Props = {
  onReadyToPlay: () => void;
  onLeave: () => void;
};

export function OnlineLobbyScreen({ onReadyToPlay, onLeave }: Props) {
  const roomCode = useOnlineSessionStore(selectOnlineRoomCode);
  const inviteUrl = useOnlineSessionStore(selectOnlineInviteUrl);
  const lastError = useOnlineSessionStore(selectOnlineLastError);
  const hostConnected = useOnlineSessionStore((s) => s.hostConnected);
  const guestConnected = useOnlineSessionStore((s) => s.guestConnected);
  const status = useOnlineSessionStore((s) => s.status);

  const bothConnected = hostConnected && guestConnected;

  useEffect(() => {
    if (bothConnected) {
      onReadyToPlay();
    }
  }, [bothConnected, onReadyToPlay]);

  const handleShare = () => {
    if (!roomCode || !inviteUrl) return;
    void shareOnlineInvite({ code: roomCode, inviteUrl }).catch(() => {
      // Share sheet cancel / unavailable — leave lobby as-is
    });
  };

  const handleLeave = () => {
    void leaveOnlineSession().finally(() => {
      onLeave();
    });
  };

  const waitingLabel =
    status === 'connecting' || status === 'reconnecting'
      ? 'Connecting…'
      : bothConnected
        ? 'Opponent connected — starting…'
        : 'Waiting for opponent…';

  return (
    <View className="flex-1 flex-col" testID="online-lobby-screen">
      <View className="flex-[0.25] m-2">
        <TitleImage />
      </View>

      <View className="flex-1 items-center justify-center gap-4 px-4">
        <Text className="text-text text-xl text-center">Room code</Text>
        <Text
          className="text-text text-4xl text-center tracking-widest"
          testID="lobby-room-code"
          accessibilityLabel={`Room code ${roomCode ?? ''}`}
        >
          {roomCode ?? '————'}
        </Text>
        <Text className="text-text text-lg text-center" testID="lobby-waiting">
          {waitingLabel}
        </Text>
        {lastError ? (
          <Text className="text-highlight text-center" testID="lobby-error">
            {lastError}
          </Text>
        ) : null}
      </View>

      <View className="flex-none gap-3 m-4">
        <PushButton
          className="h-14 self-center w-2/3"
          accessibilityLabel="Share invite"
          onPress={handleShare}
        >
          <TextWithBackground className="text-text text-2xl">Share</TextWithBackground>
        </PushButton>
        <PushButton
          className="h-14 self-center w-2/3"
          accessibilityLabel="Leave lobby"
          onPress={handleLeave}
        >
          <TextWithBackground className="text-text text-2xl">Cancel</TextWithBackground>
        </PushButton>
      </View>
    </View>
  );
}
