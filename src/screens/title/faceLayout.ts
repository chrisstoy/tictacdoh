export type FaceBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Fractions of `assets/splash-screen.png` (1024×1536).
 * Measured from the painted eyes, brows, and mouth so the overlays sit on them.
 */
export const FACE_BOXES = {
  leftEye: { x: 0.6514, y: 0.7161, w: 0.0508, h: 0.0443 },
  rightEye: { x: 0.7559, y: 0.7201, w: 0.0508, h: 0.0417 },
  leftBrow: { x: 0.6641, y: 0.6849, w: 0.0342, h: 0.013 },
  rightBrow: { x: 0.7813, y: 0.6862, w: 0.0352, h: 0.0156 },
  mouth: { x: 0.667, y: 0.7656, w: 0.1074, h: 0.0456 },
} as const;

/** How far a raised brow moves, as a fraction of the splash height. */
export const BROW_LIFT = 0.012;

export const SKIN = '#f8ab36';
export const INK = '#632f16';
