import { Image } from 'react-native';

export function PlayImage() {
  return (
    <Image
      testID="play-image"
      accessible={false}
      source={require('@/assets/play.png')}
      style={{ width: '100%', height: '100%' }}
      resizeMode="contain"
    />
  );
}
