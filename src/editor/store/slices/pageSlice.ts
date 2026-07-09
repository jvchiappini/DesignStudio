import type { Page } from "../../utils/types";
import type { SliceCreator } from "../storeTypes";

export interface PageSlice {
  pages: Page[];
  activePageIndex: number;
  carouselWidth: number;
  carouselHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  canvasBgColor: string;
  addPage: () => void;
  removePage: (id: string) => void;
  setActivePage: (index: number) => void;
  updatePage: (id: string, updates: Partial<Page>) => void;
  setCanvasSize: (w: number, h: number) => void;
  setCanvasBgColor: (color: string) => void;
}

export function getPageOffset(pages: Page[], index: number, gap: number = 0): number {
  let offset = 0;
  for (let i = 0; i < index; i++) offset += pages[i].width + gap;
  return offset;
}

export function computeCarouselSize(pages: Page[], gap: number = 0): { carouselWidth: number; carouselHeight: number } {
  return {
    carouselWidth: pages.reduce((s: number, p: Page) => s + p.width, 0) + Math.max(0, pages.length - 1) * gap,
    carouselHeight: Math.max(...pages.map((p: Page) => p.height), 0),
  };
}

export const createPageSlice: SliceCreator<PageSlice> = (set, get) => ({
  pages: [],
  activePageIndex: 0,
  carouselWidth: 0,
  carouselHeight: 0,
  canvasWidth: 1080,
  canvasHeight: 1920,
  canvasBgColor: "#1a1a2e",

  addPage: () => {
    const { pages, pageGap } = get();
    const newPage: Page = {
      id: `page_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `Página ${pages.length + 1}`,
      width: 1080, height: 1920, bgColor: "#1a1a2e",
    };
    const newPages = [...pages, newPage];
    set({ pages: newPages, ...computeCarouselSize(newPages, pageGap) });
    get().persist?.();
  },

  removePage: (id) => {
    const { pages, activePageIndex, pageGap } = get() as { pages: Page[]; activePageIndex: number; pageGap: number };
    if (pages.length <= 1) return;
    const newPages = pages.filter((p: Page) => p.id !== id);
    const newIdx = Math.min(activePageIndex, newPages.length - 1);
    const p = newPages[newIdx];
    set({
      pages: newPages, activePageIndex: newIdx,
      canvasWidth: p.width, canvasHeight: p.height, canvasBgColor: p.bgColor,
      ...computeCarouselSize(newPages, pageGap),
    });
    get().recalculateAnchoredPositions?.();
    get().persist?.();
  },

  setActivePage: (index) => {
    const { pages } = get();
    const idx = Math.max(0, Math.min(index, pages.length - 1));
    const p = pages[idx];
    set({ activePageIndex: idx, canvasWidth: p.width, canvasHeight: p.height, canvasBgColor: p.bgColor });
  },

  updatePage: (id, updates) => {
    const { pages, activePageIndex, pageGap } = get() as { pages: Page[]; activePageIndex: number; pageGap: number };
    const newPages = pages.map((p: Page) => p.id === id ? { ...p, ...updates } : p);
    const patch: any = { pages: newPages, ...computeCarouselSize(newPages, pageGap) };
    const active = newPages[activePageIndex];
    if (active.id === id) {
      patch.canvasWidth = active.width;
      patch.canvasHeight = active.height;
      patch.canvasBgColor = active.bgColor;
    }
    set(patch);
    if ("width" in updates) get().recalculateAnchoredPositions?.();
    get().persist?.();
  },

  setCanvasSize: (w, h) => {
    const { pages, activePageIndex } = get();
    const active = pages[activePageIndex];
    get().updatePage(active.id, { width: w, height: h });
  },

  setCanvasBgColor: (color) => {
    const { pages, activePageIndex } = get();
    const active = pages[activePageIndex];
    get().updatePage(active.id, { bgColor: color });
  },
}
);
