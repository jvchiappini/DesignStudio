import { create } from "zustand";

export type PanelId = "timeline" | "components" | "properties" | "layers";

interface UIState {
  panels: Record<PanelId, boolean>;
  zoom: number;
  togglePanel: (panel: PanelId) => void;
  setZoom: (zoom: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  panels: {
    timeline: true,
    components: true,
    properties: true,
    layers: true,
  },
  zoom: 1,
  togglePanel: (panel) =>
    set((state) => ({
      panels: { ...state.panels, [panel]: !state.panels[panel] },
    })),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
}));
