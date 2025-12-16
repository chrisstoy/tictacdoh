import { Button, Text, View } from 'react-native';

interface Props {
  onExit: () => void;
}

export function OptionsScreen({ onExit }: Props) {
  return (
    <View>
      <Text className=" text-white outline text-2xl">Options</Text>
      <Button title="Return" onPress={onExit} />
    </View>
  );
}
