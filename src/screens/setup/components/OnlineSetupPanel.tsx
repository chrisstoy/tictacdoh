import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { PushButton } from '@/components/PushButton';
import { TextWithBackground } from '@/components/TextWithBackground';
import { selectRoundsInMatch, useMatchStore } from '@/services/matchState';
import { createOnlineSession, joinOnlineSession } from '@/services/online';
import { isValidJoinCode, normalizeJoinCode } from '@/services/online/joinCode';

type Props = {
  onEnterLobby: () => void;
};

export function OnlineSetupPanel({ onEnterLobby }: Props) {
  const roundsInMatch = useMatchStore(selectRoundsInMatch);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const run = async (action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await action();
      onEnterLobby();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Online request failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = () => {
    void run(() => createOnlineSession(roundsInMatch));
  };

  const handleJoin = () => {
    if (!isValidJoinCode(joinCode)) {
      setError('Enter a valid 6-character room code');
      return;
    }
    const code = normalizeJoinCode(joinCode);
    void run(() => joinOnlineSession(code));
  };

  return (
    <View className="w-full px-2" testID="online-setup-panel">
      {!showJoin ? (
        <View className="flex-row justify-center gap-3">
          <PushButton
            className="h-12 flex-1 max-w-[45%]"
            accessibilityLabel="Online Create"
            onPress={handleCreate}
          >
            <TextWithBackground className="text-text text-lg">Online Create</TextWithBackground>
          </PushButton>
          <PushButton
            className="h-12 flex-1 max-w-[45%]"
            accessibilityLabel="Online Join"
            onPress={() => {
              setShowJoin(true);
              setError(undefined);
            }}
          >
            <TextWithBackground className="text-text text-lg">Online Join</TextWithBackground>
          </PushButton>
        </View>
      ) : (
        <View className="gap-2">
          <TextInput
            accessibilityLabel="Room code"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            value={joinCode}
            onChangeText={setJoinCode}
            placeholder="Room code"
            className="border-2 border-border rounded-md px-3 py-2 text-center text-text text-xl bg-background"
            editable={!busy}
          />
          <View className="flex-row justify-center gap-3">
            <PushButton
              className="h-12 flex-1 max-w-[45%]"
              accessibilityLabel="Join room"
              onPress={handleJoin}
            >
              <TextWithBackground className="text-text text-lg">Join</TextWithBackground>
            </PushButton>
            <PushButton
              className="h-12 flex-1 max-w-[45%]"
              accessibilityLabel="Cancel join"
              onPress={() => {
                setShowJoin(false);
                setJoinCode('');
                setError(undefined);
              }}
            >
              <TextWithBackground className="text-text text-lg">Cancel</TextWithBackground>
            </PushButton>
          </View>
        </View>
      )}

      {busy ? (
        <View className="items-center mt-2" testID="online-setup-busy">
          <ActivityIndicator />
        </View>
      ) : null}

      {error ? (
        <Text className="text-center text-highlight mt-2" testID="online-setup-error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
