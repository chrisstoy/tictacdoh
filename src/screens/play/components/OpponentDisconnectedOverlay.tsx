import { Modal, Text, View } from 'react-native';
import { PushButton } from '@/components/PushButton';
import { TextWithBackground } from '@/components/TextWithBackground';

type Props = {
  onQuit: () => void;
};

export function OpponentDisconnectedOverlay({ onQuit }: Props) {
  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      <View
        className="flex-1 items-center justify-center bg-black/60 px-6 gap-8"
        testID="player-disconnected-overlay"
      >
        <Text
          className="text-4xl text-center"
          style={{ fontFamily: 'Komigo', color: '#fdde97' }}
          testID="player-disconnected-message"
        >
          Player disconnected
        </Text>
        <PushButton className="h-14 w-2/3" accessibilityLabel="Quit game" onPress={onQuit}>
          <TextWithBackground className="text-text text-2xl">Quit Game</TextWithBackground>
        </PushButton>
      </View>
    </Modal>
  );
}
