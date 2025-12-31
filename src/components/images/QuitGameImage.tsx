import { Image } from 'react-native';

export function QuitGameImage() {
  return (
    <Image
      source={require('@/assets/quit-game.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
