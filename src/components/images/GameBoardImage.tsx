import { Image } from 'react-native';

export function GameBoardImage() {
  return (
    <Image
      source={require('@/assets/board.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 1 }}
      resizeMode="contain"
    ></Image>
  );
}
