import type { ReactNode, CSSProperties } from "react";

export interface TimelineProps {
  fps: number;
  durationInFrames: number;
  width: number;
  height: number;
  children?: ReactNode;
}

export interface SequenceProps {
  from: number;
  durationInFrames: number;
  children?: ReactNode;
}

export interface AnimatedProps {
  from?: Partial<AnimatedStyle>;
  to?: Partial<AnimatedStyle>;
  easing?: EasingFn;
  children?: ReactNode;
  style?: CSSProperties;
}

export interface AnimatedStyle {
  x: number;
  y: number;
  opacity: number;
  scale: number;
  rotate: number;
}

export interface TextoProps {
  fadeIn?: number;
  fadeOut?: number;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface ImgProps {
  src: string;
  placeholderColor?: string;
  style?: CSSProperties;
}

export interface AbsoluteFillProps {
  style?: CSSProperties;
  children?: ReactNode;
}

export type EasingFn = (t: number) => number;

export interface FrameInfo {
  frame: number;
  fps: number;
  durationInFrames: number;
}
