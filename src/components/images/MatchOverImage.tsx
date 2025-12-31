import { Image } from 'react-native';

export function MatchOverImage() {
  return (
    <Image
      source={require('@/assets/match-over.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
