import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { PushButton } from '@/components/PushButton';
import { TextWithBackground } from '@/components/TextWithBackground';
import { selectRoundsInMatch, useMatchStore } from '@/services/matchState';
import { isAndroidNativeShell } from '@/services/nativeShell';
import { createOnlineSession, joinOnlineSession } from '@/services/online';
import { isValidJoinCode, normalizeJoinCode } from '@/services/online/joinCode';

type Props = {
  onEnterLobby: () => void;
  /** Room code input focus changes (drives the Android keyboard pin). */
  onInputFocusChange?: (focused: boolean) => void;
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
  return (
    <PushButton
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      className="h-14 w-2/3"
      onPress={onPress}
    >
      <TextWithBackground className="text-text text-2xl">{label}</TextWithBackground>
    </PushButton>
  );
}

export function OnlineSetupPanel({ onEnterLobby, onInputFocusChange }: Props) {
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

  const android = isAndroidNativeShell();
  const status = (
    <>
      {busy ? (
        <View className="items-center mt-1" testID="online-setup-busy">
          <ActivityIndicator accessibilityLabel={android ? 'Loading' : undefined} />
        </View>
      ) : null}

      {error ? (
        <Text
          className="text-center text-highlight mt-1"
          accessibilityRole={android ? 'alert' : undefined}
          testID="online-setup-error"
        >
          {error}
        </Text>
      ) : null}
    </>
  );

  return (
    <View className="w-full px-3" testID="online-setup-panel">
      {!showJoin ? (
        <View className="items-center gap-3">
          <OnlineTextButton label="Create Game" onPress={handleCreate} testID="online-create" />
          <OnlineTextButton
            label="Join Game"
            onPress={() => {
              setShowJoin(true);
              setError(undefined);
            }}
            testID="online-join"
          />
        </View>
      ) : (
        <View className="gap-3">
          <TextInput
            accessibilityLabel="Room code"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            value={joinCode}
            onChangeText={setJoinCode}
            placeholder="Room code"
            className="border-2 border-border rounded-md px-3 py-2 text-center text-text text-xl bg-background"
            style={{ fontFamily: 'Komigo' }}
            editable={!busy}
            onFocus={() => onInputFocusChange?.(true)}
            onBlur={() => onInputFocusChange?.(false)}
          />
          <View className="items-center gap-3">
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

      {android ? (
        // Android only: reserve a minimum height (it grows for wrapped errors / large font scale)
        // so the panel doesn't jump when the spinner or error appears. Stacked, never overlapping.
        <View
          className="items-center justify-center"
          style={{ minHeight: 24 }}
          testID="online-setup-status-slot"
        >
          {status}
        </View>
      ) : (
        status
      )}
    </View>
  );
}
