import {
  APP_BACKGROUND,
  SPLASH_CANVAS_SIZE,
  androidSplashIconRelativePath,
  nativeAssetSources,
  splashNeedsDocumentedSquare,
} from '../generate-native-assets';

describe('generate-native-assets', () => {
  it('maps the existing artwork onto the filenames @capacitor/assets reads', () => {
    expect(nativeAssetSources).toEqual({
      'icon-only.png': 'assets/icon.png',
      'icon-foreground.png': 'assets/adaptive-icon.png',
      'splash.png': 'assets/splash-screen.png',
      splashIcon: 'assets/splash-icon.png',
    });
    expect(androidSplashIconRelativePath).toBe(
      'android/app/src/main/res/drawable-nodpi/splash_icon.png'
    );
  });

  it('flags a splash source below the documented 2732 square', () => {
    expect(SPLASH_CANVAS_SIZE).toBe(2732);
    expect(APP_BACKGROUND).toBe('#fdde97');
    expect(splashNeedsDocumentedSquare(1024, 1536)).toBe(true);
    expect(splashNeedsDocumentedSquare(1024, 1024)).toBe(true);
    expect(splashNeedsDocumentedSquare(2732, 2732)).toBe(false);
  });
});
