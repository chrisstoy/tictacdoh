import { View } from 'react-native';
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
  return (
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
          style={{ fontFamily: 'PoppinsBlack', color: TITLE_FILL, fontSize: 56, lineHeight: 68 }}
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
}
