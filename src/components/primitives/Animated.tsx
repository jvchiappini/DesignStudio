import type { CSSProperties } from "react";
import { useCurrentFrame } from "../../engine/useCurrentFrame";
import { interpolate } from "../../engine/interpolate";
import { useFrameInfo } from "../../engine/TimeContext";
import type { AnimatedProps } from "../../types/timeline";

const defaultFrom = { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 };
const defaultTo = { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 };

export function Animated({
  from = defaultFrom,
  to = defaultTo,
  easing,
  children,
  style,
}: AnimatedProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useFrameInfo();

  const range: [number, number] = [0, durationInFrames];

  const x = interpolate(frame, range, [from.x ?? 0, to.x ?? 0], easing);
  const y = interpolate(frame, range, [from.y ?? 0, to.y ?? 0], easing);
  const opacity = interpolate(
    frame,
    range,
    [from.opacity ?? 1, to.opacity ?? 1],
    easing,
  );
  const scale = interpolate(
    frame,
    range,
    [from.scale ?? 1, to.scale ?? 1],
    easing,
  );
  const rotate = interpolate(
    frame,
    range,
    [from.rotate ?? 0, to.rotate ?? 0],
    easing,
  );

  const animatedStyle: CSSProperties = {
    transform: `translateX(${x}px) translateY(${y}px) scale(${scale}) rotate(${rotate}deg)`,
    opacity,
    ...style,
  };

  return <div style={animatedStyle}>{children}</div>;
}
