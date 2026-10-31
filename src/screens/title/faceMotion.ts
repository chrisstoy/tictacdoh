export const FACE_CUES = ['blink', 'brow', 'mouth'] as const;
export type FaceCue = (typeof FACE_CUES)[number];

/** Rest gap before each cue, then how long that cue is held. */
export const FACE_REST_MS = 900;
export const FACE_CUE_MS = 280;
export const FACE_SLOT_MS = FACE_REST_MS + FACE_CUE_MS;
export const FACE_CYCLE_MS = FACE_SLOT_MS * FACE_CUES.length;

export type FacePose = {
  cue: FaceCue | 'rest';
  blink: boolean;
  browRaised: boolean;
  mouthClosed: boolean;
};

const REST_POSE: FacePose = {
  cue: 'rest',
  blink: false,
  browRaised: false,
  mouthClosed: false,
};

export function facePoseAt(elapsedMs: number): FacePose {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return REST_POSE;
  }

  const t = elapsedMs % FACE_CYCLE_MS;
  const slot = Math.floor(t / FACE_SLOT_MS);
  const within = t % FACE_SLOT_MS;
  if (within < FACE_REST_MS) {
    return REST_POSE;
  }

  const cue = FACE_CUES[slot];
  return {
    cue,
    blink: cue === 'blink',
    browRaised: cue === 'brow',
    mouthClosed: cue === 'mouth',
  };
}
