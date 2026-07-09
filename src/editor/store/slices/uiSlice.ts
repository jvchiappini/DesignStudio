import type { LeftPanelTab, SidebarTab, RightTab, CropPreview } from "../../utils/types";
import { computeCarouselSize } from "./pageSlice";
import type { SliceCreator } from "../storeTypes";

export interface UiSlice {
  projectName: string;
  zoom: number;
  panX: number;
  panY: number;
  sidebarTab: SidebarTab | null;
  rightTab: RightTab | null;
  chatOpen: boolean;
  chatWidth: number;
  leftPanelTab: LeftPanelTab;
  editingTextId: string | null;
  pathEditingId: string | null;
  cropElementId: string | null;
  cropPreview: CropPreview | null;
  showGrid: boolean;
  snapToGrid: boolean;
  pageGap: number;
  setZoom: (z: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setPan: (x: number, y: number) => void;
  centerOnElements: () => void;
  setSidebarTab: (tab: SidebarTab | null) => void;
  setRightTab: (tab: RightTab | null) => void;
  setEditingTextId: (id: string | null) => void;
  setPathEditingId: (id: string | null) => void;
  setCropElementId: (id: string | null) => void;
  setCropPreview: (preview: CropPreview | null) => void;
  setChatOpen: (open: boolean) => void;
  setChatWidth: (w: number) => void;
  setLeftPanelTab: (tab: LeftPanelTab) => void;
  setShowGrid: (v: boolean) => void;
  setSnapToGrid: (v: boolean) => void;
  setPageGap: (v: number) => void;
  setProjectName: (name: string) => void;
}

export const createUiSlice: SliceCreator<UiSlice> = (set, get) => ({
  projectName: "Sin título",
  zoom: 0.5,
  panX: 0,
  panY: 0,
  sidebarTab: "elements",
  rightTab: null,
  chatOpen: false,
  chatWidth: 320,
  leftPanelTab: "sidebar",
  editingTextId: null,
  pathEditingId: null,
  cropElementId: null,
  cropPreview: null,
  showGrid: false,
  snapToGrid: true,
  pageGap: 40,

  setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(5, z)) }),
  zoomIn: () => set((s: any) => ({ zoom: Math.min(5, s.zoom + 0.1) })),
  zoomOut: () => set((s: any) => ({ zoom: Math.max(0.1, s.zoom - 0.1) })),
  setPan: (x, y) => set({ panX: x, panY: y }),
  centerOnElements: () => {
    const { elements, zoom } = get();
    if (elements.length === 0) { set({ panX: 0, panY: 0 }); return; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of elements) {
      if (el.x < minX) minX = el.x;
      if (el.y < minY) minY = el.y;
      if (el.x + el.width > maxX) maxX = el.x + el.width;
      if (el.y + el.height > maxY) maxY = el.y + el.height;
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    set({ panX: -centerX * zoom, panY: -centerY * zoom });
  },
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setRightTab: (tab) => set({ rightTab: tab }),
  setEditingTextId: (id) => set({ editingTextId: id }),
  setPathEditingId: (id) => set({ pathEditingId: id }),
  setCropElementId: (id) => set({ cropElementId: id }),
  setCropPreview: (preview) => set({ cropPreview: preview }),
  setChatOpen: (open) => set({ chatOpen: open }),
  setChatWidth: (w) => set({ chatWidth: Math.max(200, Math.min(800, w)) }),
  setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),
  setShowGrid: (v) => set({ showGrid: v }),
  setSnapToGrid: (v) => set({ snapToGrid: v }),
  setPageGap: (v) => {
    const pages = get().pages;
    set((s: any) => ({ pageGap: v, ...computeCarouselSize(pages ?? s.pages, v) }));
    get().recalculateAnchoredPositions?.();
    get().persist?.();
  },
  setProjectName: (name) => { set({ projectName: name }); get().persist?.(); },
}
);
