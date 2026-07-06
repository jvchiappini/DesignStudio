import type { CSSProperties } from "react";
import { useCurrentFrame } from "../../engine/useCurrentFrame";
import { interpolate, easeOut } from "../../engine/interpolate";
import { useFrameInfo } from "../../engine/TimeContext";
import type { TextoProps } from "../../types/timeline";

export function Texto({
  fadeIn,
  fadeOut,
  style,
  children,
}: TextoProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useFrameInfo();

  let opacity = 1;

  if (fadeIn !== undefined) {
    const fadeInRange: [number, number] = [0, Math.min(fadeIn, durationInFrames)];
    opacity *= interpolate(frame, fadeInRange, [0, 1], easeOut);
  }

  if (fadeOut !== undefined) {
    const fadeOutStart = Math.max(0, durationInFrames - fadeOut);
    const fadeOutRange: [number, number] = [fadeOutStart, durationInFrames];
    opacity *= interpolate(frame, fadeOutRange, [1, 0], easeOut);
  }

  const resolvedStyle: CSSProperties = {
    opacity,
    ...style,
  };

  return <div style={resolvedStyle}>{children}</div>;
}
