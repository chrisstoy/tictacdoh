import {
  APP_BACKGROUND,
  LAUNCH_IMAGE_CONTENT_MODE,
  SPLASH_CANVAS_SIZE,
  adaptiveBackgroundInset,
  android12SplashScale,
  androidSplashIconRelativePath,
  circleSafeScale,
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

  it('fits the iOS launch image and keeps adaptive artwork inside a circular mask', () => {
    expect(LAUNCH_IMAGE_CONTENT_MODE).toBe('scaleAspectFit');
    expect(circleSafeScale()).toBeCloseTo(1 / Math.sqrt(2), 5);
    expect(android12SplashScale()).toBeCloseTo((2 / 3) / Math.sqrt(2), 5);
    expect(adaptiveBackgroundInset()).toBe('0%');
  });

  it('flags a splash source below the documented 2732 square', () => {
    expect(SPLASH_CANVAS_SIZE).toBe(2732);
    expect(APP_BACKGROUND).toBe('#fdde97');
    expect(splashNeedsDocumentedSquare(1024, 1536)).toBe(true);
    expect(splashNeedsDocumentedSquare(1024, 1024)).toBe(true);
    expect(splashNeedsDocumentedSquare(2732, 2732)).toBe(false);
  });
});
