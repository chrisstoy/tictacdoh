import { Button, Text, View } from 'react-native';
import { useGameStore } from '@/services/gameState';
import { Toggle } from './components/Toggle';

interface Props {
  onExit: () => void;
}

export function OptionsScreen({ onExit }: Props) {
  const { autoReplay, setAutoReplay, enableSound, setEnableSound } = useGameStore();

  return (
    <View className="items-center flex h-full">
      <View className="w-[90%] h-full gap-4">
        <Text className="text-orange-400 outline text-4xl w-full my-4 flex justify-center">
          Options
        </Text>
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

        <View className="flex-auto"></View>
        <View className="flex-none mb-4">
          <Button title="Return" onPress={onExit} />
        </View>
      </View>
    </View>
  );
}
