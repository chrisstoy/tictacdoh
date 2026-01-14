import { Image } from 'react-native';

export function PlusImage() {
  return (
    <Image
      source={require('@/assets/plus.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
