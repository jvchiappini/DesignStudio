export function frameToSeconds(frame: number, fps: number): number {
  return frame / fps;
}

export function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}
