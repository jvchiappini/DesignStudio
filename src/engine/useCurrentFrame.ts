import { useFrameInfo } from "./TimeContext";

export function useCurrentFrame(): number {
  const { frame } = useFrameInfo();
  return frame;
}
