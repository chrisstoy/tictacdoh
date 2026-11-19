import { useRef, useState } from 'react';
import { Dimensions, LayoutChangeEvent, ScrollView, View } from 'react-native';
import { OutlineText } from '@/components/OutlineText';
import { PushButton } from '@/components/PushButton';
import { TextWithBackground } from '@/components/TextWithBackground';
import { TitleImage } from '@/components/images/TitleImage';
import { OnlineSetupPanel } from '@/screens/setup/components/OnlineSetupPanel';

const TITLE_FILL = '#f06c1c';
const TITLE_OUTLINE = '#582008';

type Props = {
  onEnterLobby: () => void;
  onBack: () => void;
};

export function OnlinePlayScreen({ onEnterLobby, onBack }: Props) {
  // Tallest height the screen area (already net of safe-area padding) has had at the current
  // window width. On Android, Capacitor's SystemBars pads the decor view by the IME height, so the
  // viewport shrinks when the keyboard opens; keeping the max height seen pins the content to its
  // pre-keyboard size (proportions never compress; the overflow scrolls). A window width change
  // (rotation) starts over.
  const [minHeight, setMinHeight] = useState<number | undefined>();
  const tracked = useRef<{ windowWidth: number; height: number } | undefined>(undefined);

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const windowWidth = Dimensions.get('window').width;
    const { height } = nativeEvent.layout;
    const prev = tracked.current;
    const next = prev && prev.windowWidth === windowWidth ? Math.max(prev.height, height) : height;
    tracked.current = { windowWidth, height: next };
    setMinHeight(next);
  };

  return (
    <View className="flex-1 w-full" onLayout={handleLayout} testID="online-play-frame">
      <ScrollView
        className="flex-1"
        testID="online-play-scroll"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, minHeight }}
      >
        <View className="flex-1 flex-col" testID="online-play-screen">
          <View className="flex-[0.25] m-2">
            <TitleImage />
          </View>

          <View className="flex-1 justify-center items-center gap-6">
            <OutlineText
              accessibilityRole="header"
              className="text-center"
              outlineColor={TITLE_OUTLINE}
              outlineWidth={4}
              style={{
                fontFamily: 'PoppinsBlack',
                color: TITLE_FILL,
                fontSize: 56,
                lineHeight: 68,
              }}
            >
              Online Play
            </OutlineText>
            <OnlineSetupPanel onEnterLobby={onEnterLobby} />
          </View>

          <View className="flex-none m-4">
            <PushButton
              className="h-14 self-center w-2/3"
              accessibilityLabel="Back"
              onPress={onBack}
            >
              <TextWithBackground className="text-text text-2xl">Back</TextWithBackground>
            </PushButton>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
