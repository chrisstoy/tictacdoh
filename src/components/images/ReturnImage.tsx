import { Image } from 'react-native';

export function ReturnImage() {
  return (
    <Image
      source={require('@/assets/return.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
