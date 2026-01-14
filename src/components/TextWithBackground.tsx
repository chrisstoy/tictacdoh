import { Text, View } from 'react-native';

type Props = React.ComponentProps<typeof View>;

export function TextWithBackground({ children, className, ...rest }: Props) {
  return (
    <View className={`flex flex-1 items-center justify-center text-background`} {...rest}>
      <Text
        className={`${className} ui-text text-center`}
        style={{ includeFontPadding: false, textAlignVertical: 'center' }}
      >
        {children}
      </Text>
    </View>
  );
}
