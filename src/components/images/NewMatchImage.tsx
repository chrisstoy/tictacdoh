import { Image } from 'react-native';

export function NewMatchImage() {
  return (
    <Image
      source={require('@/assets/new-match.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
