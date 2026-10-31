import {
  FACE_CUE_MS,
  FACE_CYCLE_MS,
  FACE_REST_MS,
  FACE_SLOT_MS,
  facePoseAt,
} from '../faceMotion';

describe('facePoseAt', () => {
  it('starts at rest, then cycles blink, brow, and mouth', () => {
    expect(facePoseAt(0)).toEqual({
      cue: 'rest',
      blink: false,
      browRaised: false,
      mouthClosed: false,
    });

    expect(facePoseAt(FACE_REST_MS)).toMatchObject({ cue: 'blink', blink: true });
    expect(facePoseAt(FACE_REST_MS + FACE_CUE_MS - 1).blink).toBe(true);

    expect(facePoseAt(FACE_SLOT_MS)).toMatchObject({ cue: 'rest', blink: false });
    expect(facePoseAt(FACE_SLOT_MS + FACE_REST_MS)).toMatchObject({
      cue: 'brow',
      browRaised: true,
      blink: false,
      mouthClosed: false,
    });

    expect(facePoseAt(FACE_SLOT_MS * 2 + FACE_REST_MS)).toMatchObject({
      cue: 'mouth',
      mouthClosed: true,
      blink: false,
      browRaised: false,
    });
  });

  it('wraps back to rest after a full cycle', () => {
    expect(facePoseAt(FACE_CYCLE_MS)).toMatchObject({ cue: 'rest', blink: false });
    expect(facePoseAt(FACE_CYCLE_MS + FACE_REST_MS)).toMatchObject({ cue: 'blink', blink: true });
  });

  it('treats negative or non-finite time as rest', () => {
    expect(facePoseAt(-10).cue).toBe('rest');
    expect(facePoseAt(Number.NaN).cue).toBe('rest');
  });
});
