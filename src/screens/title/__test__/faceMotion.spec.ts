import {
  BROWS_TIMELINE,
  EYES_TIMELINE,
  MOUTH_TIMELINE,
  REST_POSE,
  facePoseAt,
  poseKey,
} from '../faceMotion';

describe('facePoseAt', () => {
  it('rests at the start and for invalid times', () => {
    expect(facePoseAt(0)).toEqual(REST_POSE);
    expect(facePoseAt(-5)).toEqual(REST_POSE);
    expect(facePoseAt(Number.NaN)).toEqual(REST_POSE);
  });

  it('blinks for exactly its window', () => {
    expect(facePoseAt(900).eyes).toBe('blink');
    expect(facePoseAt(900 + 179).eyes).toBe('blink');
    expect(facePoseAt(900 + 180).eyes).toBe('open');
  });

  it('moves one feature while the others stay at rest', () => {
    expect(facePoseAt(900)).toEqual({ ...REST_POSE, eyes: 'blink' });
    expect(facePoseAt(6000)).toEqual({ ...REST_POSE, mouth: 'closed' });
  });

  it('overlaps features that run on different timelines', () => {
    // Eyes look left while the brows are still raised.
    expect(facePoseAt(1800)).toEqual({
      eyes: 'lookLeft',
      browLeft: 'raised',
      browRight: 'raised',
      mouth: 'open',
    });
    // Brows have lowered; the mouth shrinks while the eyes are still looking left.
    expect(facePoseAt(2500)).toEqual({ ...REST_POSE, eyes: 'lookLeft', mouth: 'small' });
  });

  it('raises both brows, then only the right one, then furrows both', () => {
    expect(facePoseAt(1500)).toMatchObject({ browLeft: 'raised', browRight: 'raised' });
    expect(facePoseAt(4200)).toMatchObject({ browLeft: 'rest', browRight: 'raised' });
    expect(facePoseAt(6300)).toMatchObject({ browLeft: 'furrowed', browRight: 'furrowed' });
  });

  it('closes the mouth on its own schedule', () => {
    expect(facePoseAt(6000).mouth).toBe('closed');
    expect(facePoseAt(7200).mouth).toBe('open');
  });

  it('repeats each feature on its own cycle length', () => {
    expect(facePoseAt(EYES_TIMELINE.cycleMs + 900).eyes).toBe('blink');
    expect(facePoseAt(BROWS_TIMELINE.cycleMs + 1500).browLeft).toBe('raised');
    expect(facePoseAt(MOUTH_TIMELINE.cycleMs + 6000).mouth).toBe('closed');
  });

  it('uses cycle lengths with no shared factor, so the combinations keep changing', () => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const cycles = [EYES_TIMELINE.cycleMs, BROWS_TIMELINE.cycleMs, MOUTH_TIMELINE.cycleMs];

    expect(gcd(cycles[0], cycles[1])).toBeLessThanOrEqual(100);
    expect(gcd(cycles[1], cycles[2])).toBeLessThanOrEqual(100);
    expect(gcd(cycles[0], cycles[2])).toBeLessThanOrEqual(100);
  });

  it('keeps every segment inside its cycle and out of the others', () => {
    for (const { cycleMs, segments } of [EYES_TIMELINE, BROWS_TIMELINE, MOUTH_TIMELINE]) {
      let previousEnd = 0;
      for (const { at, ms } of segments) {
        expect(at).toBeGreaterThanOrEqual(previousEnd);
        previousEnd = at + ms;
      }
      expect(previousEnd).toBeLessThanOrEqual(cycleMs);
    }
  });
});

describe('poseKey', () => {
  it('differs when any single feature differs', () => {
    expect(poseKey(REST_POSE)).toBe(poseKey({ ...REST_POSE }));
    expect(poseKey({ ...REST_POSE, eyes: 'blink' })).not.toBe(poseKey(REST_POSE));
    expect(poseKey({ ...REST_POSE, browRight: 'raised' })).not.toBe(poseKey(REST_POSE));
    expect(poseKey({ ...REST_POSE, mouth: 'closed' })).not.toBe(poseKey(REST_POSE));
  });
});
