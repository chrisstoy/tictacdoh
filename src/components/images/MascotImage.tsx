import { Image } from 'react-native';

/** The mascot with no eyes, brows, or mouth; `MascotFace` draws those on top. */
export function MascotImage() {
  return (
    <Image
      testID="mascot-base-image"
      accessible={false}
      source={require('@/assets/mascot/base.png')}
      style={{ width: '100%', height: '100%' }}
      resizeMode="contain"
    />
  );
}
