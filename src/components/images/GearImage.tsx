import { Image } from 'react-native';

export function GearImage() {
  return (
    <Image
      source={require('@/assets/gear.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
