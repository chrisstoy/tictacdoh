import { Image } from 'react-native';

export function OptionsImage() {
  return (
    <Image
      source={require('@/assets/options.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
