import { Text, View } from 'react-native';

export function DebugViewData({ data }: { data: unknown }) {
  return (
    <View className="text-xs flex-none debug-border-blue">
      <Text>{JSON.stringify(data)}</Text>
    </View>
  );
}
