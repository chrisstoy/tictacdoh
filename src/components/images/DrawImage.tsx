import { Image } from 'react-native';

export function DrawImage() {
  return (
    <Image
      source={require('@/assets/draw.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
