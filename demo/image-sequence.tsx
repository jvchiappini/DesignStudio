import {
  Timeline,
  Sequence,
  AbsoluteFill,
  Animated,
  Img,
} from "../src/components";

export function ImageSequenceDemo() {
  return (
    <Timeline fps={30} durationInFrames={120} width={1080} height={1080}>
      <AbsoluteFill style={{ backgroundColor: "#f0f0f0" }} />

      <Sequence from={0} durationInFrames={60}>
        <Animated from={{ x: -300, opacity: 0 }} to={{ x: 0, opacity: 1 }}>
          <Img
            src="https://picsum.photos/400/400?random=1"
            style={{ width: 400, height: 400, margin: "auto" }}
          />
        </Animated>
      </Sequence>

      <Sequence from={60} durationInFrames={60}>
        <Animated from={{ opacity: 0, scale: 0.5 }} to={{ opacity: 1, scale: 1 }}>
          <Img
            src="https://picsum.photos/400/400?random=2"
            style={{ width: 400, height: 400, margin: "auto" }}
          />
        </Animated>
      </Sequence>
    </Timeline>
  );
}
