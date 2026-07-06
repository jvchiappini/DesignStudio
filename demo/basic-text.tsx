import { Timeline, Sequence, AbsoluteFill, Texto } from "../src/components";

export function BasicTextDemo() {
  return (
    <Timeline fps={30} durationInFrames={90} width={1080} height={1920}>
      <AbsoluteFill style={{ backgroundColor: "#0a0a23" }} />

      <Sequence from={0} durationInFrames={60}>
        <Texto
          fadeIn={20}
          style={{
            fontSize: 72,
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            padding: 40,
          }}
        >
          Hola, Design Studio
        </Texto>
      </Sequence>

      <Sequence from={45} durationInFrames={45}>
        <Texto
          fadeIn={10}
          style={{
            fontSize: 32,
            color: "#e94560",
            textAlign: "center",
          }}
        >
          Renderizado 100% Client-Side
        </Texto>
      </Sequence>
    </Timeline>
  );
}
