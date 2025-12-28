import { Image } from 'react-native';

export function InfinityImage() {
  return (
    <Image
      source={require('@/assets/infinity.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 1 }}
      resizeMode="contain"
    ></Image>
  );
}
