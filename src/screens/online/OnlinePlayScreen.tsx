import { ReactNode, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, ScrollView, View, useWindowDimensions } from 'react-native';
import { OutlineText } from '@/components/OutlineText';
import { PushButton } from '@/components/PushButton';
import { TextWithBackground } from '@/components/TextWithBackground';
import { TitleImage } from '@/components/images/TitleImage';
import { OnlineSetupPanel } from '@/screens/setup/components/OnlineSetupPanel';
import { isAndroidNativeShell } from '@/services/nativeShell';

const TITLE_FILL = '#f06c1c';
const TITLE_OUTLINE = '#582008';

// Smallest frame-height drop treated as the soft keyboard opening (dp).
const KEYBOARD_MIN_SHRINK = 100;

type Props = {
  onEnterLobby: () => void;
  onBack: () => void;
};

function PinnedFrame({ children }: { children: ReactNode }) {
  // Android native only. Capacitor's SystemBars pads the decor view by the IME height, so the
  // viewport (and this frame) shrinks when the keyboard opens. Holding the pre-keyboard frame
  // height pins the content to its pre-keyboard size (proportions never compress; the overflow
  // scrolls). A window width change (rotation) starts over.
  // The frame's own layout width cannot drive the reset: the app caps the frame width as a
  // function of window height (useFrameMaxWidth), so it narrows when the keyboard opens. The
  // window width does not change with the keyboard, and is read via the hook (an effect), not
  // inside onLayout, so there is no ordering dependency on Dimensions updates.
  const { width: windowWidth } = useWindowDimensions();
  const [minHeight, setMinHeight] = useState<number | undefined>();
  const trackedWidth = useRef(windowWidth);

  useEffect(() => {
    if (trackedWidth.current === windowWidth) return;
    trackedWidth.current = windowWidth;
    setMinHeight(undefined);
  }, [windowWidth]);

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const { height } = nativeEvent.layout;
    // A shrink of at least KEYBOARD_MIN_SHRINK is the keyboard opening: keep the pre-keyboard
    // height. Anything else (growth, small shrink such as insets settling after mount) is the new
    // baseline, so a transient oversize first layout can't leave the content taller than the frame.
    setMinHeight((prev) =>
      prev !== undefined && height < prev - KEYBOARD_MIN_SHRINK ? prev : height
    );
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
        {children}
      </ScrollView>
    </View>
  );
}

export function OnlinePlayScreen({ onEnterLobby, onBack }: Props) {
  const content = (
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
        <PushButton className="h-14 self-center w-2/3" accessibilityLabel="Back" onPress={onBack}>
          <TextWithBackground className="text-text text-2xl">Back</TextWithBackground>
        </PushButton>
      </View>
    </View>
  );

  return isAndroidNativeShell() ? <PinnedFrame>{content}</PinnedFrame> : content;
}
