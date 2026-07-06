import { useRef, useMemo, useEffect, type CSSProperties } from "react";
import { TimeContext } from "../../engine/TimeContext";
import { TimelineController } from "../../engine/TimelineController";
import type { TimelineProps } from "../../types/timeline";

const containerStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
};

export function Timeline({
  fps,
  durationInFrames,
  width,
  height,
  children,
}: TimelineProps) {
  const controllerRef = useRef<TimelineController | null>(null);
  const frameRef = useRef(0);

  const timeValue = useMemo(
    () => ({ frame: frameRef.current, fps, durationInFrames }),
    [fps, durationInFrames],
  );

  useEffect(() => {
    const controller = new TimelineController();
    controller.setConfig(fps, durationInFrames);
    controller.setCallbacks({
      onFrame(frame) {
        frameRef.current = frame;
      },
      onFinish() {},
    });
    controllerRef.current = controller;
    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, [fps, durationInFrames]);

  timeValue.frame = frameRef.current;

  return (
    <TimeContext.Provider value={timeValue}>
      <div
        style={{
          ...containerStyle,
          width,
          height,
        }}
      >
        {children}
      </div>
    </TimeContext.Provider>
  );
}
