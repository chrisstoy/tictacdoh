import { Text, View } from 'react-native';

type Props = React.ComponentProps<typeof View>;

export function TextWithBackground({ children, className, ...rest }: Props) {
  return (
    <View className={`flex flex-1 text-background`} {...rest}>
      <Text className={`${className} text-center`}>{children}</Text>
    </View>
  );
}
