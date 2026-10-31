import { Image } from 'react-native';

export function SplashScreenImage() {
  return (
    <Image
      testID="splash-screen-image"
      accessible={false}
      source={require('@/assets/splash-screen.png')}
      style={{ width: '100%', height: '100%' }}
      resizeMode="contain"
    />
  );
}
