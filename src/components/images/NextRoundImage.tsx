import { Image } from 'react-native';

export function NextRoundImage() {
  return (
    <Image
      source={require('@/assets/next-round.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
