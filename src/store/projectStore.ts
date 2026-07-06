import { create } from "zustand";

interface ProjectState {
  code: string;
  title: string;
  fps: number;
  durationInFrames: number;
  width: number;
  height: number;
  setCode: (code: string) => void;
  setTitle: (title: string) => void;
  setConfig: (config: Partial<Pick<ProjectState, "fps" | "durationInFrames" | "width" | "height">>) => void;
}

const DEFAULT_CODE = `<Timeline fps={30} durationInFrames={150} width={1080} height={1920}>
  <AbsoluteFill style={{ backgroundColor: '#0a0a23' }} />
  <Sequence from={0} durationInFrames={60}>
    <Texto fadeIn={15} style={{ fontSize: 72, color: '#fff' }}>
      Hola, mundo
    </Texto>
  </Sequence>
</Timeline>`;

export const useProjectStore = create<ProjectState>((set) => ({
  code: DEFAULT_CODE,
  title: "Sin título",
  fps: 30,
  durationInFrames: 150,
  width: 1080,
  height: 1920,
  setCode: (code) => set({ code }),
  setTitle: (title) => set({ title }),
  setConfig: (config) => set((state) => ({ ...state, ...config })),
}));
