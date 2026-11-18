import { Image, type StyleProp, type ImageStyle } from 'react-native';

type Props = {
  /** When set, mark is a fixed square instead of filling the parent (scoreboard needs this). */
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function OImage({ size, style }: Props) {
  return (
    <Image
      source={require('@/assets/O.png')}
      style={[
        size != null ? { width: size, height: size } : { width: '100%', height: '100%' },
        style,
      ]}
      resizeMode="contain"
    ></Image>
  );
}
