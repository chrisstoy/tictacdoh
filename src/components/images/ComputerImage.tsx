import { Image } from 'react-native';

export function ComputerImage() {
  return (
    <Image
      testID="clanker-image"
      source={require('@/assets/clanker.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
