export type EyesPose = 'open' | 'blink' | 'lookLeft' | 'lookRight';
export type BrowPose = 'rest' | 'raised' | 'furrowed';
export type MouthPose = 'open' | 'small' | 'closed';

export type FacePose = {
  eyes: EyesPose;
  browLeft: BrowPose;
  browRight: BrowPose;
  mouth: MouthPose;
};

export const REST_POSE: FacePose = {
  eyes: 'open',
  browLeft: 'rest',
  browRight: 'rest',
  mouth: 'open',
};

/** How often the title screen samples {@link facePoseAt}. */
export const FACE_SAMPLE_MS = 50;

type Segment<T> = { at: number; ms: number; pose: T };
type Timeline<T> = { cycleMs: number; rest: T; segments: readonly Segment<T>[] };

/**
 * Every feature runs its own timeline. The cycle lengths share no common
 * factor, so eyes, brows, and mouth line up differently on each pass.
 */
export const EYES_TIMELINE: Timeline<EyesPose> = {
  cycleMs: 6100,
  rest: 'open',
  segments: [
    { at: 900, ms: 180, pose: 'blink' },
    { at: 1800, ms: 900, pose: 'lookLeft' },
    { at: 3100, ms: 180, pose: 'blink' },
    { at: 3450, ms: 180, pose: 'blink' },
    { at: 4200, ms: 900, pose: 'lookRight' },
    { at: 5600, ms: 180, pose: 'blink' },
  ],
};

type Brows = Pick<FacePose, 'browLeft' | 'browRight'>;

export const BROWS_TIMELINE: Timeline<Brows> = {
  cycleMs: 8300,
  rest: { browLeft: 'rest', browRight: 'rest' },
  segments: [
    { at: 1500, ms: 900, pose: { browLeft: 'raised', browRight: 'raised' } },
    { at: 4200, ms: 800, pose: { browLeft: 'rest', browRight: 'raised' } },
    { at: 6300, ms: 800, pose: { browLeft: 'furrowed', browRight: 'furrowed' } },
  ],
};

export const MOUTH_TIMELINE: Timeline<MouthPose> = {
  cycleMs: 11700,
  rest: 'open',
  segments: [
    { at: 2500, ms: 800, pose: 'small' },
    { at: 6000, ms: 1200, pose: 'closed' },
    { at: 9000, ms: 600, pose: 'small' },
  ],
};

function poseOn<T>(timeline: Timeline<T>, elapsedMs: number): T {
  const t = elapsedMs % timeline.cycleMs;
  const segment = timeline.segments.find(({ at, ms }) => t >= at && t < at + ms);
  return segment ? segment.pose : timeline.rest;
}

export function facePoseAt(elapsedMs: number): FacePose {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return REST_POSE;
  }

  return {
    eyes: poseOn(EYES_TIMELINE, elapsedMs),
    ...poseOn(BROWS_TIMELINE, elapsedMs),
    mouth: poseOn(MOUTH_TIMELINE, elapsedMs),
  };
}

/** Same string for the same pose, so the screen re-renders only on a change. */
export function poseKey(pose: FacePose): string {
  return `${pose.eyes}|${pose.browLeft}|${pose.browRight}|${pose.mouth}`;
}
