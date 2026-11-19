import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, ScrollView, View, useWindowDimensions } from 'react-native';
import { OutlineText } from '@/components/OutlineText';
import { PushButton } from '@/components/PushButton';
import { TextWithBackground } from '@/components/TextWithBackground';
import { TitleImage } from '@/components/images/TitleImage';
import { OnlineSetupPanel } from '@/screens/setup/components/OnlineSetupPanel';
import { isAndroidNativeShell } from '@/services/nativeShell';

const TITLE_FILL = '#f06c1c';
const TITLE_OUTLINE = '#582008';

type Props = {
  onEnterLobby: () => void;
  onBack: () => void;
};

type FocusCallback = (focused: boolean) => void;

function PinnedFrame({ children }: { children: (onInputFocusChange: FocusCallback) => ReactNode }) {
  // Android native only. Capacitor's SystemBars pads the decor view by the IME height, so the
  // viewport (and this frame) shrinks when the keyboard opens. The keyboard only opens when the
  // Room code input is focused, so on focus we pin the content minHeight to the frame height
  // measured just before (the IME inset has not arrived yet) and hold it until blur; the overflow
  // scrolls. While unfocused the natural frame height is tracked freely. A window width change
  // (rotation) starts over.
  // The window width is read via the hook (an effect), not inside onLayout: the frame's own width
  // narrows with the keyboard (useFrameMaxWidth), so it can't drive the reset.
  const { width: windowWidth } = useWindowDimensions();
  const [tracked, setTracked] = useState<number | undefined>();
  const [pinned, setPinned] = useState<number | undefined>();
  const lastHeight = useRef<number | undefined>(undefined);
  const focused = useRef(false);
  const trackedWidth = useRef(windowWidth);

  useEffect(() => {
    if (trackedWidth.current === windowWidth) return;
    trackedWidth.current = windowWidth;
    lastHeight.current = undefined;
    setTracked(undefined);
    setPinned(undefined);
  }, [windowWidth]);

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    if (focused.current) return;
    lastHeight.current = nativeEvent.layout.height;
    setTracked(nativeEvent.layout.height);
  };

  const handleFocusChange = useCallback((isFocused: boolean) => {
    focused.current = isFocused;
    setPinned(isFocused ? lastHeight.current : undefined);
  }, []);

  return (
    <View className="flex-1 w-full" onLayout={handleLayout} testID="online-play-frame">
      <ScrollView
        className="flex-1"
        testID="online-play-scroll"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, minHeight: pinned ?? tracked }}
      >
        {children(handleFocusChange)}
      </ScrollView>
    </View>
  );
}

export function OnlinePlayScreen({ onEnterLobby, onBack }: Props) {
  const renderContent = (onInputFocusChange?: FocusCallback) => (
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
        <OnlineSetupPanel onEnterLobby={onEnterLobby} onInputFocusChange={onInputFocusChange} />
      </View>

      <View className="flex-none m-4">
        <PushButton className="h-14 self-center w-2/3" accessibilityLabel="Back" onPress={onBack}>
          <TextWithBackground className="text-text text-2xl">Back</TextWithBackground>
        </PushButton>
      </View>
    </View>
  );

  return isAndroidNativeShell() ? <PinnedFrame>{renderContent}</PinnedFrame> : renderContent();
}
