import { MAX_FRAME_ASPECT, frameMaxWidth } from '../frameWidth';

describe('frameMaxWidth', () => {
  it('leaves a phone-shaped window alone', () => {
    expect(frameMaxWidth(440, 956)).toBeGreaterThanOrEqual(440);
  });

  it('limits width to the frame aspect on a tablet', () => {
    expect(frameMaxWidth(1032, 1376)).toBeCloseTo(1376 * MAX_FRAME_ASPECT);
    expect(frameMaxWidth(1032, 1376)).toBeLessThan(1032);
  });

  it('limits width on a wide desktop window', () => {
    expect(frameMaxWidth(1920, 1080)).toBeCloseTo(1080 * MAX_FRAME_ASPECT);
  });
});
