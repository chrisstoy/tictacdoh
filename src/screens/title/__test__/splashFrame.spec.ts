import { containedSplashRect } from '../splashFrame';

describe('containedSplashRect', () => {
  it('fills a frame that already matches the splash aspect', () => {
    expect(containedSplashRect(200, 300)).toEqual({
      left: 0,
      top: 0,
      width: 200,
      height: 300,
    });
  });

  it('letterboxes a wider frame so the splash is not cropped', () => {
    expect(containedSplashRect(300, 300)).toEqual({
      left: 50,
      top: 0,
      width: 200,
      height: 300,
    });
  });

  it('letterboxes a taller frame so the splash is not cropped', () => {
    expect(containedSplashRect(200, 450)).toEqual({
      left: 0,
      top: 75,
      width: 200,
      height: 300,
    });
  });

  it('returns an empty rect until the frame has a size', () => {
    expect(containedSplashRect(0, 0)).toEqual({ left: 0, top: 0, width: 0, height: 0 });
  });
});
