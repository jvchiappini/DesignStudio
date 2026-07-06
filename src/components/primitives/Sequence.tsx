import { useMemo, type ReactNode } from "react";
import { useFrameInfo } from "../../engine/TimeContext";
import type { SequenceProps } from "../../types/timeline";
import { TimeContext } from "../../engine/TimeContext";

export function Sequence({
  from,
  durationInFrames,
  children,
}: SequenceProps) {
  const { frame, fps } = useFrameInfo();
  const localFrame = frame - from;

  const isVisible = frame >= from && frame < from + durationInFrames;

  const childTime = useMemo(
    () => ({
      frame: Math.max(0, localFrame),
      fps,
      durationInFrames,
    }),
    [localFrame, fps, durationInFrames],
  );

  if (!isVisible) return null;

  return (
    <TimeContext.Provider value={childTime}>
      {children as ReactNode}
    </TimeContext.Provider>
  );
}
