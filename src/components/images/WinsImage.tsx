import { Image } from 'react-native';

export function WinsImage() {
  return (
    <Image
      source={require('@/assets/wins.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
