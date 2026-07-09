import type { Guide } from "../../utils/types";
import { AnchorService } from "../../../core/services/AnchorService";
import type { SliceCreator } from "../storeTypes";

export interface GuideSlice {
  guides: Guide[];
  guideMode: "global" | "page";
  showRulers: boolean;
  gridSize: number;
  addGuide: (position: number, orientation: "horizontal" | "vertical", pageNumber?: number) => void;
  setGuideMode: (mode: "global" | "page") => void;
  removeGuide: (id: string) => void;
  updateGuidePosition: (id: string, position: number) => void;
  updateGuide: (id: string, updates: Partial<Guide>) => void;
  setShowRulers: (v: boolean) => void;
  setGridSize: (v: number) => void;
}

export const createGuideSlice: SliceCreator<GuideSlice> = (set, _get) => ({
  guides: [],
  guideMode: "page",
  showRulers: false,
  gridSize: 20,

  addGuide: (position, orientation, pageNumber) => set((s: any) => {
    const id = `guide_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const nextGuides = [...s.guides, { id, position, orientation, pageNumber }];
    return { guides: nextGuides };
  }),

  removeGuide: (id) => set((s: any) => {
    const nextGuides = s.guides.filter((g: Guide) => g.id !== id);
    const svc = new AnchorService([], [], 0);
    const nextElements = s.elements.map((el: any) => {
      const updates = svc.clearGuideRefs(el, id);
      return updates ? { ...el, ...updates } : el;
    });
    return { elements: nextElements, guides: nextGuides };
  }),

  updateGuidePosition: (id, position) => set((s: any) => {
    const oldGuide = s.guides.find((g: Guide) => g.id === id);
    if (!oldGuide) return s;
    const delta = position - oldGuide.position;
    const nextGuides = s.guides.map((g: Guide) => g.id === id ? { ...g, position } : g);
    const svc = new AnchorService([], [], 0);
    const nextElements = s.elements.map((el: any) => {
      const updates = svc.onGuideMove(el, id, delta, oldGuide.orientation);
      return updates ? { ...el, ...updates } : el;
    });
    return { elements: nextElements, guides: nextGuides };
  }),

  updateGuide: (id, updates) => set((s: any) => {
    const nextGuides = s.guides.map((g: Guide) => g.id === id ? { ...g, ...updates } : g);
    return { guides: nextGuides };
  }),

  setGuideMode: (mode) => set({ guideMode: mode }),
  setShowRulers: (v) => set({ showRulers: v }),
  setGridSize: (v) => set({ gridSize: v }),
}
);
