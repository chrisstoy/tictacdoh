import { Image } from 'react-native';

export function CheckedCheckboxImage() {
  return (
    <Image
      source={require('@/assets/checkbox-with-check.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
