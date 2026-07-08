import { create } from "zustand";
import type { DesignElement, ShapeKind, SidebarTab, RightTab, Page, CropPreview, LeftPanelTab, Guide } from "../utils/types";

let nextId = 1;
let nextPageId = 1;
function genId(): string {
  return `el_${nextId++}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
function genPageId(): string {
  return `page_${nextPageId++}_${Date.now()}`;
}
/** Generate a unique element ID that doesn't collide with existing elements */
function genUniqueId(elements: DesignElement[]): string {
  const existing = new Set(elements.map((e) => e.id));
  let id = genId();
  let attempts = 0;
  while (existing.has(id) && attempts < 100) {
    id = genId();
    attempts++;
  }
  return id;
}

const STORAGE_KEY = "design-studio-project";

function loadSaved(): Partial<EditorStore> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

interface HistoryEntry {
  elements: DesignElement[];
  selectedId: string | null;
}

interface EditorStore {
  projectName: string;
  elements: DesignElement[];
  selectedId: string | null;
  selectedIds: string[];
  selectedGuideId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  chatOpen: boolean;
  chatWidth: number;
  leftPanelTab: LeftPanelTab;
  canvasBgColor: string;
  zoom: number;
  panX: number;
  panY: number;
  sidebarTab: SidebarTab | null;
  rightTab: RightTab | null;

  // history
  history: HistoryEntry[];
  historyIndex: number;
  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;

  // clipboard
  clipboard: DesignElement[];
  copiedStyles: Partial<DesignElement> | null;

  // canvas settings
  showGrid: boolean;
  snapToGrid: boolean;
  showRulers: boolean;
  pageGap: number;
  setPageGap: (v: number) => void;
  gridSize: number;

  // editing
  editingTextId: string | null;
  pathEditingId: string | null;
  cropElementId: string | null;
  cropPreview: CropPreview | null;

  addText: (overrides?: Partial<DesignElement>) => void;
  addImage: (src: string) => void;
  addShape: (kind: ShapeKind, overrides?: Partial<DesignElement>) => void;
  addSvg: (svgContent: string) => void;
  addElement: (el: DesignElement) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copyStyles: () => void;
  pasteStyles: () => void;

  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null, additive?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setSelectedGuideId: (id: string | null) => void;
  moveElement: (id: string, x: number, y: number) => void;
  moveElements: (ids: string[], dx: number, dy: number) => void;
  resizeElement: (id: string, w: number, h: number) => void;
  rotateElement: (id: string, angle: number) => void;
  setOpacity: (id: string, opacity: number) => void;
  addIcon: (svg: string) => void;
  setParent: (id: string, parentId: string | undefined) => void;

  // align
  alignElements: (dir: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  distributeElements: (dir: "horizontal" | "vertical") => void;

  // group
  groupSelected: () => void;
  ungroupSelected: () => void;

  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;

  // pages / carousel
  pages: Page[];
  activePageIndex: number;
  addPage: () => void;
  removePage: (id: string) => void;
  setActivePage: (index: number) => void;
  updatePage: (id: string, updates: Partial<Page>) => void;
  carouselWidth: number;
  carouselHeight: number;

  setCanvasSize: (w: number, h: number) => void;
  setCanvasBgColor: (color: string) => void;
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

  // guides
  guides: Guide[];
  addGuide: (position: number, orientation: "horizontal" | "vertical", pageNumber?: number) => void;
  guideMode: "global" | "page";
  setGuideMode: (mode: "global" | "page") => void;
  removeGuide: (id: string) => void;
  updateGuidePosition: (id: string, position: number) => void;
  updateGuide: (id: string, updates: Partial<Guide>) => void;
  setShowRulers: (v: boolean) => void;
  setGridSize: (v: number) => void;
  setProjectName: (name: string) => void;
  loadProject: (data: string) => boolean;
  newProject: () => void;
  recalculateAnchoredPositions: () => void;
}

function getPageOffset(pages: Page[], index: number, gap: number = 0): number {
  let offset = 0;
  for (let i = 0; i < index; i++) {
    offset += pages[i].width + gap;
  }
  return offset;
}

function computeCarouselSize(pages: Page[], gap: number = 0): { carouselWidth: number; carouselHeight: number } {
  return {
    carouselWidth: pages.reduce((s, p) => s + p.width, 0) + Math.max(0, pages.length - 1) * gap,
    carouselHeight: Math.max(...pages.map((p) => p.height), 0),
  };
}

function nextZIndex(elements: DesignElement[]): number {
  const max = elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
  return max + 1;
}

function persist(state: { elements: DesignElement[]; pages: Page[]; guides?: Guide[]; pageGap?: number; projectName?: string }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded, ignore */ }
}

const saved = loadSaved();

function defaultPages(): Page[] {
  return [
    { id: genPageId(), name: "Página 1", width: 1080, height: 1920, bgColor: "#1a1a2e" },
    { id: genPageId(), name: "Página 2", width: 1080, height: 1920, bgColor: "#1e1e2e" },
    { id: genPageId(), name: "Página 3", width: 1080, height: 1920, bgColor: "#2a1a2e" },
  ];
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  projectName: saved.projectName ?? "Sin título",
  elements: saved.elements ?? [],
  selectedId: saved.selectedId ?? null,
  selectedIds: [],
  selectedGuideId: null,
  pages: saved.pages ?? defaultPages(),
  activePageIndex: 0,
  canvasWidth: (saved.pages ?? defaultPages())[0]?.width ?? 1080,
  canvasHeight: (saved.pages ?? defaultPages())[0]?.height ?? 1920,
  canvasBgColor: (saved.pages ?? defaultPages())[0]?.bgColor ?? "#1a1a2e",
  carouselWidth: (() => { const ps = saved.pages ?? defaultPages(); return ps.reduce((s, p) => s + p.width, 0) + (ps.length - 1) * 40; })(),
  carouselHeight: (() => { const ps = saved.pages ?? defaultPages(); return Math.max(...ps.map((p) => p.height)); })(),
  zoom: 0.5,
  panX: 0,
  panY: 0,
  sidebarTab: "elements",
  rightTab: null,
  chatOpen: false,
  chatWidth: 320,
  leftPanelTab: "sidebar",
  history: [],
  historyIndex: -1,
  clipboard: [],
  copiedStyles: null,
  showGrid: false,
  snapToGrid: true,
  showRulers: false,
  pageGap: 0,
  guideMode: "page",
  gridSize: 20,
  guides: [],
  editingTextId: null,
  pathEditingId: null,
  cropElementId: null,
  cropPreview: null,

  saveSnapshot: () => {
    const { elements, selectedId, history, historyIndex } = get();
    const entry = { elements: JSON.parse(JSON.stringify(elements)), selectedId };
    const trimmed = history.slice(0, historyIndex + 1);
    trimmed.push(entry);
    if (trimmed.length > 50) trimmed.shift();
    set({ history: trimmed, historyIndex: trimmed.length - 1 });
  },

  undo: () => {
    const { history, historyIndex, elements } = get();
    if (historyIndex < 0) return;
    const currentSnapshot = { elements: JSON.parse(JSON.stringify(elements)), selectedId: get().selectedId };
    const entry = history[historyIndex];
    const newHistory = [...history];
    newHistory[historyIndex] = currentSnapshot;
    set({ elements: entry.elements, selectedId: entry.selectedId, selectedIds: entry.selectedId ? [entry.selectedId] : [], history: newHistory, historyIndex: historyIndex - 1, rightTab: entry.selectedId ? "properties" : null });
    persist(get());
  },

  redo: () => {
    const { history, historyIndex, elements } = get();
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const entry = history[nextIndex];
    const currentSnapshot = { elements: JSON.parse(JSON.stringify(elements)), selectedId: get().selectedId };
    const newHistory = [...history];
    newHistory[nextIndex] = currentSnapshot;
    set({ elements: entry.elements, selectedId: entry.selectedId, selectedIds: entry.selectedId ? [entry.selectedId] : [], history: newHistory, historyIndex: nextIndex, rightTab: entry.selectedId ? "properties" : null });
    persist(get());
  },

  addText: (overrides) => {
    get().saveSnapshot();
    const { elements, pages, activePageIndex } = get();
    const pageX = getPageOffset(pages, activePageIndex);
    const el: DesignElement = {
      id: genId(), type: "text",
      x: pageX + 60, y: 60, width: 300, height: 80,
      rotation: 0, opacity: 1, zIndex: nextZIndex(elements),
      text: "Texto", fontSize: 32, fontFamily: "system-ui, sans-serif",
      fontWeight: 400, fontStyle: "normal", textAlign: "center", color: "#ffffff",
      ...overrides,
    };
    set({ elements: [...elements, el], selectedId: el.id, selectedIds: [el.id], rightTab: "properties" });
    persist(get());
  },

  addImage: (src) => {
    get().saveSnapshot();
    const { elements, pages, activePageIndex } = get();
    const pageX = getPageOffset(pages, activePageIndex);
    const el: DesignElement = {
      id: genId(), type: "image", x: pageX + 60, y: 60, width: 300, height: 300,
      rotation: 0, opacity: 1, zIndex: nextZIndex(elements), src,
    };
    set({ elements: [...elements, el], selectedId: el.id, selectedIds: [el.id], rightTab: "properties" });
    persist(get());
  },

  addShape: (kind, overrides?: Partial<DesignElement>) => {
    get().saveSnapshot();
    const { elements, pages, activePageIndex } = get();
    const pageX = getPageOffset(pages, activePageIndex);
    const size = kind === "line" ? { width: 200, height: 4 } : { width: 200, height: 200 };
    const el: DesignElement = {
      id: genId(), type: "shape", x: pageX + 60, y: 60, ...size,
      rotation: 0, opacity: 1, zIndex: nextZIndex(elements),
      shapeKind: kind,
      backgroundColor: kind === "line" ? "transparent" : "#4f46e5",
      borderColor: kind === "line" ? "#4f46e5" : "transparent",
      borderWidth: kind === "line" ? 4 : 0,
      borderRadius: kind === "circle" ? 9999 : 0,
      ...overrides,
    };
    set({ elements: [...elements, el], selectedId: el.id, selectedIds: [el.id], rightTab: "properties" });
    persist(get());
  },

  addSvg: (svgContent) => {
    get().saveSnapshot();
    const { elements, pages, activePageIndex } = get();
    const pageX = getPageOffset(pages, activePageIndex);
    const el: DesignElement = {
      id: genId(), type: "svg", x: pageX + 60, y: 60, width: 300, height: 300,
      rotation: 0, opacity: 1, zIndex: nextZIndex(elements), svgContent,
    };
    set({ elements: [...elements, el], selectedId: el.id, selectedIds: [el.id], rightTab: "properties" });
    persist(get());
  },

  addIcon: (svg) => {
    get().saveSnapshot();
    const { elements, pages, activePageIndex } = get();
    const pageX = getPageOffset(pages, activePageIndex);
    const el: DesignElement = {
      id: genId(), type: "svg", x: pageX + 60, y: 60, width: 80, height: 80,
      rotation: 0, opacity: 1, zIndex: nextZIndex(elements), svgContent: svg,
    };
    set({ elements: [...elements, el], selectedId: el.id, selectedIds: [el.id], rightTab: "properties" });
    persist(get());
  },

  setParent: (id, parentId) => {
    get().saveSnapshot();
    const { elements } = get();
    set({ elements: elements.map((e) => e.id === id ? { ...e, parentId } : e) });
    persist(get());
  },

  addElement: (el) => {
    get().saveSnapshot();
    const { elements } = get();
    // Ensure unique ID — regenerate if it collides with an existing element
    const existingIds = new Set(elements.map((e) => e.id));
    const finalId = existingIds.has(el.id) ? genUniqueId(elements) : el.id;
    const finalEl = finalId === el.id ? el : { ...el, id: finalId };
    set((s) => ({ elements: [...s.elements, finalEl], selectedId: finalEl.id, selectedIds: [finalEl.id], rightTab: "properties" }));
    persist(get());
  },

  deleteSelected: () => {
    const { selectedIds, elements } = get();
    if (selectedIds.length === 0) return;
    get().saveSnapshot();
    const gids = new Set(elements.filter((e) => selectedIds.includes(e.id) && e.groupId).map((e) => e.groupId));
    const toRemove = new Set(selectedIds);
    elements.forEach((e) => { if (e.groupId && gids.has(e.groupId)) toRemove.add(e.id); });
    set({
      elements: elements.filter((e) => !toRemove.has(e.id)),
      selectedId: null, selectedIds: [], rightTab: null, selectedGuideId: null,
    });
    persist(get());
  },

  duplicateSelected: () => {
    const { selectedIds, elements } = get();
    if (selectedIds.length === 0) return;
    get().saveSnapshot();
    const maxZ = nextZIndex(elements);
    const newEls = elements
      .filter((e) => selectedIds.includes(e.id))
      .map((e) => ({
        ...JSON.parse(JSON.stringify(e)),
        id: genId(),
        x: e.x + 20,
        y: e.y + 20,
        zIndex: maxZ + selectedIds.indexOf(e.id) + 1,
      }));
    set((s) => ({
      elements: [...s.elements, ...newEls],
      selectedId: newEls[newEls.length - 1].id,
      selectedIds: newEls.map((e) => e.id),
    }));
    persist(get());
  },

  copyStyles: () => {
    const { selectedId, elements } = get();
    if (!selectedId) return;
    const el = elements.find((e) => e.id === selectedId);
    if (!el) return;
    const styleProps: (keyof DesignElement)[] = [
      "opacity", "mixBlendMode", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY",
      "flipH", "flipV",
      "fontFamily", "fontSize", "fontWeight", "fontStyle", "color", "textAlign",
      "letterSpacing", "lineHeight", "textDecoration", "textTransform", "textIndent",
      "wordSpacing", "fontVariant", "verticalAlign", "charScaleX", "charScaleY",
      "textStrokeColor", "textStrokeWidth", "textGradient", "textGradientColors",
      "imgBrightness", "imgContrast", "imgSaturation", "imgBlur",
      "backgroundColor", "borderColor", "borderWidth", "borderStyle",
      "borderRadius", "borderRadiusTL", "borderRadiusTR", "borderRadiusBR", "borderRadiusBL",
      "fillGradient", "fillGradientColors",
    ];
    const copied: Partial<DesignElement> = {};
    for (const prop of styleProps) {
      if (prop in el) (copied as any)[prop] = el[prop as keyof typeof el];
    }
    set({ copiedStyles: copied });
  },

  pasteStyles: () => {
    const { copiedStyles, selectedIds, elements } = get();
    if (!copiedStyles || selectedIds.length === 0) return;
    set({
      elements: elements.map((e) =>
        selectedIds.includes(e.id) ? { ...e, ...copiedStyles } : e,
      ),
    });
    persist(get());
  },

  updateElement: (id, updates) => {
    set((s) => ({
      elements: s.elements.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
    persist(get());
  },

  removeElement: (id) => {
    get().saveSnapshot();
    set((s) => {
      const newSelectedIds = s.selectedIds.filter((sid) => sid !== id);
      return {
        elements: s.elements.filter((e) => e.id !== id),
        selectedId: newSelectedIds.length > 0 ? newSelectedIds[0] : null,
        selectedIds: newSelectedIds,
        rightTab: newSelectedIds.length > 0 ? s.rightTab : null,
      };
    });
    persist(get());
  },

  selectElement: (id, additive = false) => {
    if (!id) {
      set({ selectedId: null, selectedIds: [], rightTab: null, editingTextId: null, selectedGuideId: null });
      return;
    }
    const elements = get().elements;
    const el = elements.find((e) => e.id === id);
    const groupIds = el?.groupId
      ? elements.filter((e) => e.groupId === el.groupId).map((e) => e.id)
      : [id];

    if (additive) {
      set((s) => {
        const allInGroup = groupIds.every((gid) => s.selectedIds.includes(gid));
        const newIds = allInGroup
          ? s.selectedIds.filter((sid) => !groupIds.includes(sid))
          : [...s.selectedIds.filter((sid) => !groupIds.includes(sid)), ...groupIds];
        return { selectedId: id, selectedIds: newIds, rightTab: "properties", selectedGuideId: null };
      });
    } else {
      set({
        selectedId: id,
        selectedIds: groupIds,
        rightTab: "properties",
        editingTextId: null,
        selectedGuideId: null,
      });
    }
  },

  selectAll: () => {
    const ids = get().elements.map((e) => e.id);
    set({ selectedId: ids[0] ?? null, selectedIds: ids });
  },

  clearSelection: () => {
    set({ selectedId: null, selectedIds: [], rightTab: null, editingTextId: null, selectedGuideId: null });
  },

  moveElement: (id, x, y) => {
    set((s) => {
      const el = s.elements.find((e) => e.id === id);
      if (!el) return s;
      const dx = x - el.x;
      const dy = y - el.y;
      const gid = el.groupId;
      return {
        elements: s.elements.map((e) => {
          if (e.id === id) return { ...e, x, y };
          if (gid && e.groupId === gid) return { ...e, x: e.x + dx, y: e.y + dy };
          return e;
        }),
      };
    });
  },

  moveElements: (ids, dx, dy) => {
    set((s) => ({
      elements: s.elements.map((e) =>
        ids.includes(e.id) ? { ...e, x: e.x + dx, y: e.y + dy } : e,
      ),
    }));
  },

  resizeElement: (id, w, h) => {
    set((s) => ({
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, width: Math.max(10, w), height: Math.max(10, h) } : e,
      ),
    }));
  },

  rotateElement: (id, angle) => {
    set((s) => ({
      elements: s.elements.map((e) => (e.id === id ? { ...e, rotation: angle } : e)),
    }));
  },

  setOpacity: (id, opacity) => {
    set((s) => ({
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, opacity: Math.max(0, Math.min(1, opacity)) } : e,
      ),
    }));
  },

  alignElements: (dir) => {
    const { selectedIds, elements } = get();
    if (selectedIds.length < 2) return;
    get().saveSnapshot();
    const selected = elements.filter((e) => selectedIds.includes(e.id));

    if (dir === "left") {
      const minX = Math.min(...selected.map((e) => e.x));
      set((s) => ({ elements: s.elements.map((e) => selectedIds.includes(e.id) ? { ...e, x: minX } : e) }));
    } else if (dir === "center") {
      const avgCenterX = selected.reduce((s, e) => s + e.x + e.width / 2, 0) / selected.length;
      set((s) => ({ elements: s.elements.map((e) => selectedIds.includes(e.id) ? { ...e, x: avgCenterX - e.width / 2 } : e) }));
    } else if (dir === "right") {
      const maxRight = Math.max(...selected.map((e) => e.x + e.width));
      set((s) => ({ elements: s.elements.map((e) => selectedIds.includes(e.id) ? { ...e, x: maxRight - e.width } : e) }));
    } else if (dir === "top") {
      const minY = Math.min(...selected.map((e) => e.y));
      set((s) => ({ elements: s.elements.map((e) => selectedIds.includes(e.id) ? { ...e, y: minY } : e) }));
    } else if (dir === "middle") {
      const avgCenterY = selected.reduce((s, e) => s + e.y + e.height / 2, 0) / selected.length;
      set((s) => ({ elements: s.elements.map((e) => selectedIds.includes(e.id) ? { ...e, y: avgCenterY - e.height / 2 } : e) }));
    } else if (dir === "bottom") {
      const maxBottom = Math.max(...selected.map((e) => e.y + e.height));
      set((s) => ({ elements: s.elements.map((e) => selectedIds.includes(e.id) ? { ...e, y: maxBottom - e.height } : e) }));
    }
    persist(get());
  },

  distributeElements: (dir) => {
    const { selectedIds, elements } = get();
    if (selectedIds.length < 3) return;
    get().saveSnapshot();
    const selected = elements.filter((e) => selectedIds.includes(e.id)).sort((a, b) =>
      dir === "horizontal" ? a.x - b.x : a.y - b.y,
    );
    if (dir === "horizontal") {
      const first = selected[0];
      const last = selected[selected.length - 1];
      const totalSpace = last.x - first.x;
      const totalElW = selected.slice(1, -1).reduce((s, e) => s + e.width, 0);
      const gap = (totalSpace - totalElW) / (selected.length - 1);
      let cursor = first.x;
      set((s) => ({
        elements: s.elements.map((e) => {
          const idx = selected.findIndex((se) => se.id === e.id);
          if (idx === -1) return e;
          if (idx === 0) return { ...e, x: first.x };
          cursor += gap;
          const newX = cursor;
          cursor += e.width;
          return { ...e, x: newX };
        }),
      }));
    } else {
      const first = selected[0];
      const last = selected[selected.length - 1];
      const totalSpace = last.y - first.y;
      const totalElH = selected.slice(1, -1).reduce((s, e) => s + e.height, 0);
      const gap = (totalSpace - totalElH) / (selected.length - 1);
      let cursor = first.y;
      set((s) => ({
        elements: s.elements.map((e) => {
          const idx = selected.findIndex((se) => se.id === e.id);
          if (idx === -1) return e;
          if (idx === 0) return { ...e, y: first.y };
          cursor += gap;
          const newY = cursor;
          cursor += e.height;
          return { ...e, y: newY };
        }),
      }));
    }
    persist(get());
  },

  groupSelected: () => {
    const { selectedIds, elements } = get();
    if (selectedIds.length < 2) return;
    get().saveSnapshot();
    const groupId = genId();
    set({
      elements: elements.map((e) =>
        selectedIds.includes(e.id) ? { ...e, groupId } : e
      ),
    });
  },

  ungroupSelected: () => {
    const { selectedIds, elements } = get();
    set({
      elements: elements.map((e) =>
        selectedIds.includes(e.id) ? { ...e, groupId: undefined } : e
      ),
    });
  },

  bringToFront: (id) => {
    get().saveSnapshot();
    const { elements } = get();
    const maxZ = nextZIndex(elements);
    set({ elements: elements.map((e) => (e.id === id ? { ...e, zIndex: maxZ } : e)) });
  },

  sendToBack: (id) => {
    get().saveSnapshot();
    const { elements } = get();
    const minZ = Math.min(...elements.map((e) => e.zIndex));
    set({ elements: elements.map((e) => (e.id === id ? { ...e, zIndex: minZ - 1 } : e)) });
  },

  bringForward: (id) => {
    get().saveSnapshot();
    const { elements } = get();
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex((e) => e.id === id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const above = sorted[idx + 1];
    set({
      elements: elements.map((e) => {
        if (e.id === id) return { ...e, zIndex: above.zIndex };
        if (e.id === above.id) return { ...e, zIndex: sorted[idx].zIndex };
        return e;
      })
    });
  },

  sendBackward: (id) => {
    get().saveSnapshot();
    const { elements } = get();
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex((e) => e.id === id);
    if (idx <= 0) return;
    const below = sorted[idx - 1];
    set({
      elements: elements.map((e) => {
        if (e.id === id) return { ...e, zIndex: below.zIndex };
        if (e.id === below.id) return { ...e, zIndex: sorted[idx].zIndex };
        return e;
      })
    });
  },

  // pages
  addPage: () => {
    const { pages, pageGap } = get();
    const newPage: Page = {
      id: genPageId(),
      name: `Página ${pages.length + 1}`,
      width: 1080, height: 1920,
      bgColor: "#1a1a2e",
    };
    const newPages = [...pages, newPage];
    set({ pages: newPages, ...computeCarouselSize(newPages, pageGap) });
    persist(get());
  },
  removePage: (id) => {
    const { pages, activePageIndex, pageGap } = get();
    if (pages.length <= 1) return;
    const idx = pages.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const newPages = pages.filter((p) => p.id !== id);
    const newIdx = Math.min(activePageIndex, newPages.length - 1);
    const p = newPages[newIdx];
    set({ pages: newPages, activePageIndex: newIdx, canvasWidth: p.width, canvasHeight: p.height, canvasBgColor: p.bgColor, ...computeCarouselSize(newPages, pageGap) });
    get().recalculateAnchoredPositions();
    persist(get());
  },
  setActivePage: (index) => {
    const { pages } = get();
    const idx = Math.max(0, Math.min(index, pages.length - 1));
    const p = pages[idx];
    set({ activePageIndex: idx, canvasWidth: p.width, canvasHeight: p.height, canvasBgColor: p.bgColor });
  },
  updatePage: (id, updates) => {
    const { pages, activePageIndex, pageGap } = get();
    const newPages = pages.map((p) => p.id === id ? { ...p, ...updates } : p);
    const patch: Partial<EditorStore> = { pages: newPages, ...computeCarouselSize(newPages, pageGap) };
    const active = newPages[activePageIndex];
    if (active.id === id) {
      patch.canvasWidth = active.width;
      patch.canvasHeight = active.height;
      patch.canvasBgColor = active.bgColor;
    }
    set(patch);
    if ("width" in updates) get().recalculateAnchoredPositions();
    persist(get());
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
  setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(5, z)) }),
  zoomIn: () => set((s) => ({ zoom: Math.min(5, s.zoom + 0.1) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(0.1, s.zoom - 0.1) })),
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
  setSelectedGuideId: (id) => set({
    selectedGuideId: id,
    selectedId: null,
    selectedIds: [],
    rightTab: id ? "properties" : null,
  }),
  setCropElementId: (id) => set({ cropElementId: id }),
  setCropPreview: (preview) => set({ cropPreview: preview }),
  setChatOpen: (open) => set({ chatOpen: open }),
  setChatWidth: (w) => set({ chatWidth: Math.max(200, Math.min(800, w)) }),
  setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),
  setShowGrid: (v) => set({ showGrid: v }),
  setSnapToGrid: (v) => set({ snapToGrid: v }),
  setShowRulers: (v) => set({ showRulers: v }),
  setPageGap: (v) => {
    set((s) => ({ pageGap: v, ...computeCarouselSize(s.pages, v) }));
    get().recalculateAnchoredPositions();
    persist(get());
  },
  setGuideMode: (mode) => set({ guideMode: mode }),
  setGridSize: (v) => set({ gridSize: v }),
  setProjectName: (name) => { set({ projectName: name }); persist(get()); },
  newProject: () => {
    const blankPage: Page = { id: genPageId(), name: "Página 1", width: 1080, height: 1920, bgColor: "#1a1a2e" };
    set({
      projectName: "Sin título",
      elements: [],
      pages: [blankPage],
      guides: [],
      pageGap: 0,
      activePageIndex: 0,
      selectedId: null,
      selectedIds: [],
      selectedGuideId: null,
      history: [],
      historyIndex: -1,
      canvasWidth: blankPage.width,
      canvasHeight: blankPage.height,
      canvasBgColor: blankPage.bgColor,
    });
    persist(get());
  },
  recalculateAnchoredPositions: () => {
    const { elements, pages, guides, pageGap } = get();
    const updated = elements.map((el) => {
      if (!el.leftAnchor && !el.rightAnchor) return el;

      const guideId = el.leftAnchor || el.rightAnchor!;
      const guide = guides.find((g) => g.id === guideId);
      if (!guide) return el;

      // Fallback to page index 0 for global guides
      const pageIdx = guide.pageNumber ? guide.pageNumber - 1 : 0;
      if (pageIdx < 0 || pageIdx >= pages.length) return el;

      let pageStart = 0;
      for (let i = 0; i < pageIdx; i++) pageStart += pages[i].width + pageGap;

      let newX = el.x;
      let newW = el.width;

      if (el.leftAnchor && el.leftAnchorOffset !== undefined) {
        const g = guides.find((gd) => gd.id === el.leftAnchor);
        if (g) newX = g.position + pageStart + el.leftAnchorOffset;
      }
      if (el.rightAnchor && el.rightAnchorOffset !== undefined) {
        const g = guides.find((gd) => gd.id === el.rightAnchor);
        if (g) {
          const newRight = g.position + pageStart + el.rightAnchorOffset;
          if (el.leftAnchor) {
            newW = Math.max(10, newRight - newX);
          } else {
            newX = newRight - el.width;
          }
        }
      }
      if (newX !== el.x || newW !== el.width) return { ...el, x: newX, width: newW };
      return el;
    });
    set({ elements: updated });
    persist(get());
  },
  loadProject: (data) => {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.elements || !parsed.pages) return false;
      set({
        projectName: parsed.projectName ?? "Sin título",
        elements: parsed.elements,
        pages: parsed.pages,
        guides: parsed.guides ?? [],
        pageGap: parsed.pageGap ?? 0,
        activePageIndex: 0,
        selectedId: null,
        selectedIds: [],
        selectedGuideId: null,
        history: [],
        historyIndex: -1,
      });
      const first = parsed.pages[0];
      set({ canvasWidth: first.width, canvasHeight: first.height, canvasBgColor: first.bgColor });
      persist(get());
      return true;
    } catch { return false; }
  },
  addGuide: (position, orientation, pageNumber) => set((s) => {
    const nextGuides = [...s.guides, { id: genId(), position, orientation, pageNumber }];
    const nextState = { ...s, guides: nextGuides };
    persist(nextState);
    return { guides: nextGuides };
  }),
  removeGuide: (id) => set((s) => {
    const nextGuides = s.guides.filter((g) => g.id !== id);
    const nextElements = s.elements.map((el) => {
      if (el.leftAnchor === id || el.rightAnchor === id) {
        const updates: Partial<DesignElement> = {};
        if (el.leftAnchor === id) updates.leftAnchor = undefined;
        if (el.rightAnchor === id) updates.rightAnchor = undefined;
        return { ...el, ...updates };
      }
      return el;
    });
    const nextState = { ...s, elements: nextElements, guides: nextGuides };
    persist(nextState);
    return { elements: nextElements, guides: nextGuides };
  }),
  updateGuidePosition: (id, position) => set((s) => {
    const oldGuide = s.guides.find((g) => g.id === id);
    if (!oldGuide) return s;
    const delta = position - oldGuide.position;

    const nextGuides = s.guides.map((g) => g.id === id ? { ...g, position } : g);

    const nextElements = s.elements.map((el) => {
      const hasLeft = el.leftAnchor === id;
      const hasRight = el.rightAnchor === id;
      if (!hasLeft && !hasRight) return el;
      const hasOtherLeft = !!el.leftAnchor && el.leftAnchor !== id;
      const hasOtherRight = !!el.rightAnchor && el.rightAnchor !== id;

      const updates: Partial<DesignElement> = {};
      if (hasLeft) {
        updates.x = el.x + delta;
        if (hasOtherRight) {
          updates.width = Math.max(10, el.width - delta);
        }
      } else if (hasRight) {
        if (hasOtherLeft) {
          updates.width = Math.max(10, el.width + delta);
        } else {
          updates.x = el.x + delta;
        }
      }
      return { ...el, ...updates };
    });

    const nextState = { ...s, elements: nextElements, guides: nextGuides };
    persist(nextState);
    return { elements: nextElements, guides: nextGuides };
  }),
  updateGuide: (id, updates) => set((s) => {
    const nextGuides = s.guides.map((g) => g.id === id ? { ...g, ...updates } : g);
    const nextState = { ...s, guides: nextGuides };
    persist(nextState);
    return { guides: nextGuides };
  }),
}));
