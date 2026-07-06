import {
  Timeline,
  Sequence,
  AbsoluteFill,
  Animated,
  Texto,
  Img,
} from "../src/components";

export function MultiTrackDemo() {
  return (
    <Timeline fps={30} durationInFrames={150} width={1920} height={1080}>
      <AbsoluteFill
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      />

      {/* Track 1: Título principal */}
      <Sequence from={0} durationInFrames={60}>
        <Animated from={{ y: -100, opacity: 0 }} to={{ y: 0, opacity: 1 }}>
          <Texto
            style={{
              fontSize: 80,
              color: "#fff",
              fontWeight: "bold",
              textAlign: "center",
              paddingTop: 100,
            }}
          >
            Multi-Track Demo
          </Texto>
        </Animated>
      </Sequence>

      {/* Track 2: Imagen decorativa */}
      <Sequence from={20} durationInFrames={100}>
        <Animated from={{ x: 200, opacity: 0, rotate: -10 }} to={{ x: 0, opacity: 1, rotate: 0 }}>
          <Img
            src="https://picsum.photos/300/300?random=3"
            style={{
              width: 300,
              height: 300,
              borderRadius: 20,
              margin: "40px auto",
            }}
          />
        </Animated>
      </Sequence>

      {/* Track 3: Subtítulo */}
      <Sequence from={60} durationInFrames={90}>
        <Texto
          fadeIn={20}
          style={{
            fontSize: 36,
            color: "rgba(255,255,255,0.8)",
            textAlign: "center",
          }}
        >
          Secuencias y animaciones paralelas
        </Texto>
      </Sequence>
    </Timeline>
  );
}
