// Screens are flex layouts tuned for a tall, phone-shaped frame. Wider than this
// (width / height) the board and buttons drift apart, so cap the frame's width.
export const MAX_FRAME_ASPECT = 0.62;

export function frameMaxWidth(windowWidth: number, windowHeight: number): number {
  return windowHeight > 0 ? windowHeight * MAX_FRAME_ASPECT : windowWidth;
}
