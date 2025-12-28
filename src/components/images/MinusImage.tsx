import { Image } from 'react-native';

export function MinusImage() {
  return (
    <Image
      source={require('@/assets/minus.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
