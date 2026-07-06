import { createContext, useContext } from "react";
import type { FrameInfo } from "../types/timeline";

export const TimeContext = createContext<FrameInfo>({
  frame: 0,
  fps: 30,
  durationInFrames: 150,
});

export function useFrameInfo(): FrameInfo {
  return useContext(TimeContext);
}
