import type { EasingFn } from "../types/timeline";

export const easeIn: EasingFn = (t) => t * t;

export const easeOut: EasingFn = (t) => t * (2 - t);

export const easeInOut: EasingFn = (t) =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

export const linear: EasingFn = (t) => t;

export function interpolate(
  frame: number,
  inputRange: [number, number],
  outputRange: [number, number],
  easing: EasingFn = linear,
): number {
  if (inputRange[0] === inputRange[1]) return outputRange[1];
  const t = (frame - inputRange[0]) / (inputRange[1] - inputRange[0]);
  const clamped = Math.max(0, Math.min(1, t));
  const eased = easing(clamped);
  return outputRange[0] + (outputRange[1] - outputRange[0]) * eased;
}
