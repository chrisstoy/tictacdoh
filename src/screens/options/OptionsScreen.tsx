import { View } from 'react-native';
import { PushButton } from '@/components/PushButton';
import { OptionsImage } from '@/components/images/OptionsImage';
import { ReturnImage } from '@/components/images/ReturnImage';
import {
  selectAutoReplay,
  selectEnableMusic,
  selectEnableSound,
  useOptionsActions,
  useOptionsStore,
} from '@/services/optionsState';
import { Toggle } from '../../components/Toggle';

interface Props {
  onExit: () => void;
}

export function OptionsScreen({ onExit }: Props) {
  const { setAutoReplay, setEnableSound, setEnableMusic } = useOptionsActions();
  const autoReplay = useOptionsStore(selectAutoReplay);
  const enableSound = useOptionsStore(selectEnableSound);
  const enableMusic = useOptionsStore(selectEnableMusic);

  return (
    <View className="items-center flex h-full">
      <View className="w-[90%] h-full gap-4">
        <View className="h-24 my-4">
          <OptionsImage></OptionsImage>
        </View>
        <Toggle
          className="w-full flex-none"
          label="Auto-Play"
          value={autoReplay}
          onToggle={(value) => {
            setAutoReplay(value);
          }}
        />
        <Toggle
          className="w-full flex-none"
          label="Sound"
          value={enableSound}
          onToggle={(value) => {
            setEnableSound(value);
          }}
        />
        <Toggle
          className="w-full flex-none"
          label="Music"
          value={enableMusic}
          onToggle={(value) => {
            setEnableMusic(value);
          }}
        />

        <View className="flex-1"></View>
        <View className="flex-none mb-4">
          <PushButton className="self-center w-1/2 h-16" onPress={onExit}>
            <ReturnImage></ReturnImage>
          </PushButton>
        </View>
      </View>
    </View>
  );
}
