import { Image } from 'react-native';

export function TitleImage() {
  return (
    <Image
      source={require('@/assets/title.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
