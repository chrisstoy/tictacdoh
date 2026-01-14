import { Image } from 'react-native';

export function StartGameImage() {
  return (
    <Image
      source={require('@/assets/start-game.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
