import { Image } from 'react-native';

export function XImage() {
  return (
    <Image
      source={require('@/assets/X.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
