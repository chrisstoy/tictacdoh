import { Image } from 'react-native';

export function CheckboxImage() {
  return (
    <Image
      source={require('@/assets/checkbox.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
