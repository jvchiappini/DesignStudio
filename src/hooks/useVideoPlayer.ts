import { useCallback, useRef, useState } from "react";
import { TimelineController } from "../engine/TimelineController";
import type { PlaybackState } from "../engine/TimelineController";

export function useVideoPlayer() {
  const controllerRef = useRef<TimelineController | null>(null);
  const [frame, setFrame] = useState(0);
  const [state, setState] = useState<PlaybackState>("idle");

  const attach = useCallback((controller: TimelineController) => {
    controllerRef.current = controller;
    controller.setCallbacks({
      onFrame(f) {
        setFrame(f);
      },
      onFinish() {
        setState("idle");
      },
    });
    setFrame(controller.getFrame());
    setState(controller.getState());
  }, []);

  const play = useCallback(() => {
    controllerRef.current?.play();
    setState("playing");
  }, []);

  const pause = useCallback(() => {
    controllerRef.current?.pause();
    setState("paused");
  }, []);

  const stop = useCallback(() => {
    controllerRef.current?.stop();
    setFrame(0);
    setState("idle");
  }, []);

  const scrub = useCallback((f: number) => {
    controllerRef.current?.scrub(f);
    setFrame(f);
  }, []);

  return { frame, state, attach, play, pause, stop, scrub };
}
