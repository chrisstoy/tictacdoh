import { Image } from 'react-native';

export function MeatbagImage() {
  return (
    <Image
      source={require('@/assets/meatbag.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
