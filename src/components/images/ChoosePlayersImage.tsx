import { Image } from 'react-native';

export function ChoosePlayersImage() {
  return (
    <Image
      source={require('@/assets/choose-players.png')}
      style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
      resizeMode="contain"
    ></Image>
  );
}
