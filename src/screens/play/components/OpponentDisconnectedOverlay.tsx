import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

type Props = {
  reclaimDeadlineMs: number | null;
};

function secondsLeft(deadlineMs: number | null): number | null {
  if (deadlineMs == null) return null;
  return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
}

export function OpponentDisconnectedOverlay({ reclaimDeadlineMs }: Props) {
  const [remaining, setRemaining] = useState(() => secondsLeft(reclaimDeadlineMs));

  useEffect(() => {
    setRemaining(secondsLeft(reclaimDeadlineMs));
    if (reclaimDeadlineMs == null) return;
    const id = setInterval(() => {
      setRemaining(secondsLeft(reclaimDeadlineMs));
    }, 250);
    return () => clearInterval(id);
  }, [reclaimDeadlineMs]);

  return (
    <View
      className="absolute top-0 left-0 right-0 bottom-0 items-center justify-center bg-black/60 px-4 z-50"
      testID="opponent-disconnected-overlay"
      pointerEvents="box-none"
    >
      <Text className="text-text text-xl text-center" testID="opponent-disconnected-message">
        Opponent disconnected…
      </Text>
      {remaining != null ? (
        <Text className="text-text text-lg text-center mt-2" testID="opponent-disconnected-countdown">
          {remaining}s
        </Text>
      ) : null}
    </View>
  );
}
