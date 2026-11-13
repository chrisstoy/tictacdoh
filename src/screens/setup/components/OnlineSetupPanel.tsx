import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useAudioService } from '@/services/audioService';
import { selectRoundsInMatch, useMatchStore } from '@/services/matchState';
import { createOnlineSession, joinOnlineSession } from '@/services/online';
import { isValidJoinCode, normalizeJoinCode } from '@/services/online/joinCode';

type Props = {
  onEnterLobby: () => void;
};

function OnlineTextButton({
  label,
  accessibilityLabel,
  onPress,
  testID,
}: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  testID?: string;
}) {
  const { playSound } = useAudioService();
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      className="flex-1 mx-1 h-11 rounded-xl border-2 border-border bg-highlight items-center justify-center"
      onPress={() => {
        playSound('push');
        onPress();
      }}
    >
      <Text className="text-background text-base font-bold text-center">{label}</Text>
    </Pressable>
  );
}

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
    <View className="w-full px-3" testID="online-setup-panel">
      {!showJoin ? (
        <View className="flex-row justify-center">
          <OnlineTextButton label="Online Create" onPress={handleCreate} testID="online-create" />
          <OnlineTextButton
            label="Online Join"
            onPress={() => {
              setShowJoin(true);
              setError(undefined);
            }}
            testID="online-join"
          />
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
          <View className="flex-row justify-center">
            <OnlineTextButton
              label="Join"
              accessibilityLabel="Join room"
              onPress={handleJoin}
              testID="join-room"
            />
            <OnlineTextButton
              label="Cancel"
              accessibilityLabel="Cancel join"
              onPress={() => {
                setShowJoin(false);
                setJoinCode('');
                setError(undefined);
              }}
              testID="cancel-join"
            />
          </View>
        </View>
      )}

      {busy ? (
        <View className="items-center mt-1" testID="online-setup-busy">
          <ActivityIndicator />
        </View>
      ) : null}

      {error ? (
        <Text className="text-center text-highlight mt-1" testID="online-setup-error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
