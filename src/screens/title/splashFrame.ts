/** `assets/splash-screen.png` is 1024×1536, exactly 2:3. */
export const SPLASH_IMAGE_WIDTH = 1024;
export const SPLASH_IMAGE_HEIGHT = 1536;
export const SPLASH_ASPECT = SPLASH_IMAGE_WIDTH / SPLASH_IMAGE_HEIGHT;

export type SplashRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const EMPTY_RECT: SplashRect = { left: 0, top: 0, width: 0, height: 0 };

/** Fit the splash inside the frame, centered, without cropping. */
export function containedSplashRect(containerWidth: number, containerHeight: number): SplashRect {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return EMPTY_RECT;
  }

  const containerAspect = containerWidth / containerHeight;
  if (containerAspect > SPLASH_ASPECT) {
    const height = containerHeight;
    const width = height * SPLASH_ASPECT;
    return { left: (containerWidth - width) / 2, top: 0, width, height };
  }

  const width = containerWidth;
  const height = width / SPLASH_ASPECT;
  return { left: 0, top: (containerHeight - height) / 2, width, height };
}
