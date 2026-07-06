export type PlaybackState = "idle" | "playing" | "paused" | "rendering";

export interface TimelineControllerCallbacks {
  onFrame: (frame: number) => void;
  onFinish: () => void;
}

export class TimelineController {
  private rafId: number | null = null;
  private state: PlaybackState = "idle";
  private frame = 0;
  private fps = 30;
  private durationInFrames = 150;
  private lastTimestamp = 0;
  private accumulatedTime = 0;
  private callbacks: TimelineControllerCallbacks | null = null;

  setConfig(fps: number, durationInFrames: number): void {
    this.fps = fps;
    this.durationInFrames = durationInFrames;
  }

  setCallbacks(cb: TimelineControllerCallbacks): void {
    this.callbacks = cb;
  }

  getState(): PlaybackState {
    return this.state;
  }

  getFrame(): number {
    return this.frame;
  }

  play(): void {
    if (this.state === "playing") return;
    this.state = "playing";
    this.lastTimestamp = performance.now();
    this.accumulatedTime = 0;
    this.tick();
  }

  pause(): void {
    if (this.state !== "playing") return;
    this.state = "paused";
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  stop(): void {
    this.pause();
    this.frame = 0;
    this.accumulatedTime = 0;
    this.callbacks?.onFrame(this.frame);
  }

  scrub(frame: number): void {
    this.frame = Math.max(0, Math.min(frame, this.durationInFrames - 1));
    this.callbacks?.onFrame(this.frame);
  }

  renderMode(renderFrame: number): void {
    this.frame = renderFrame;
    this.callbacks?.onFrame(this.frame);
  }

  private tick = (): void => {
    if (this.state !== "playing") return;

    const now = performance.now();
    const delta = now - this.lastTimestamp;
    this.lastTimestamp = now;

    const frameDuration = 1000 / this.fps;
    this.accumulatedTime += delta;

    const framesToAdvance = Math.floor(this.accumulatedTime / frameDuration);
    this.accumulatedTime -= framesToAdvance * frameDuration;

    for (let i = 0; i < framesToAdvance; i++) {
      if (this.frame >= this.durationInFrames - 1) {
        this.state = "idle";
        this.callbacks?.onFinish();
        return;
      }
      this.frame++;
      this.callbacks?.onFrame(this.frame);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  dispose(): void {
    this.pause();
    this.callbacks = null;
  }
}
