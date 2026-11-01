export type FaceBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Fractions of `assets/mascot/base.png` (1024×1536). Each box is where that
 * feature's cut-out PNG sits on the face, as printed by
 * `scripts/build-mascot-assets.py`.
 */
export const PART_BOXES = {
  leftEye: { x: 0.6475, y: 0.7135, w: 0.0498, h: 0.0469 },
  rightEye: { x: 0.7559, y: 0.7181, w: 0.0518, h: 0.0456 },
  leftBrow: { x: 0.6602, y: 0.6829, w: 0.042, h: 0.0176 },
  rightBrow: { x: 0.7783, y: 0.6842, w: 0.042, h: 0.0195 },
  mouth: { x: 0.6641, y: 0.7604, w: 0.1133, h: 0.0547 },
} as const;

/** Closed mouth: a flat bar inside the mouth box, as fractions of that box. */
export const CLOSED_MOUTH_BAR = { x: 0.03, y: 0.4, w: 0.94, h: 0.24 } as const;

export const INK = '#632f16';

/** Eyes glance sideways by this fraction of the art width. */
export const LOOK_SHIFT = 0.006;
/** A blink squashes the eyes down to `1 - BLINK_SQUASH` of their height. */
export const BLINK_SQUASH = 0.92;
/** A raised brow moves up by this fraction of the art height. */
export const BROW_LIFT = 0.014;
/** A furrowed brow tilts its inner end down by this angle and drops slightly. */
export const BROW_FURROW_DEG = 14;
export const BROW_FURROW_DROP = 0.004;
/** The small ("oh") mouth is the open mouth scaled down. */
export const MOUTH_SMALL_SCALE = { x: 0.62, y: 0.6 } as const;

/** Fade/move durations for each feature, in ms. */
export const BLINK_MS = 70;
export const LOOK_MS = 140;
export const BROW_MS = 130;
export const MOUTH_MS = 110;
