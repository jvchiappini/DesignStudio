import type { DesignElement, ShapeKind } from "../../utils/types";
import { getBehavior } from "../../../core/behaviors/BehaviorRegistry";
import { AnchorService } from "../../../core/services/AnchorService";
import { getPageOffset } from "./pageSlice";
import type { SliceCreator } from "../storeTypes";

let nextId = 1;
function genId(): string {
  return `el_${nextId++}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function genUniqueId(elements: DesignElement[]): string {
  const existing = new Set(elements.map((e) => e.id));
  let id = genId();
  let attempts = 0;
  while (existing.has(id) && attempts < 100) { id = genId(); attempts++; }
  return id;
}

function nextZIndex(elements: DesignElement[]): number {
  return elements.reduce((m, e) => Math.max(m, e.zIndex), 0) + 1;
}

export interface ElementSlice {
  elements: DesignElement[];
  selectedId: string | null;
  selectedIds: string[];
  selectedGuideId: string | null;
  clipboard: DesignElement[];
  copiedStyles: Partial<DesignElement> | null;
  addText: (overrides?: Partial<DesignElement>) => void;
  addImage: (src: string) => void;
  addShape: (kind: ShapeKind, overrides?: Partial<DesignElement>) => void;
  addSvg: (svgContent: string) => void;
  addIcon: (svg: string) => void;
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
  setParent: (id: string, parentId: string | undefined) => void;
  moveElement: (id: string, x: number, y: number) => void;
  moveElements: (ids: string[], dx: number, dy: number) => void;
  resizeElement: (id: string, w: number, h: number) => void;
  rotateElement: (id: string, angle: number) => void;
  setOpacity: (id: string, opacity: number) => void;
  alignElements: (dir: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  distributeElements: (dir: "horizontal" | "vertical") => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  recalculateAnchoredPositions: () => void;
}

export const createElementSlice: SliceCreator<ElementSlice> = (set, get) => ({
  elements: [],
  selectedId: null,
  selectedIds: [],
  selectedGuideId: null,
  clipboard: [],
  copiedStyles: null,

  // ── CRUD ──

  addText: (overrides) => {
    get().saveSnapshot();
    const { elements, pages, activePageIndex, pageGap } = get();
    const pageX = getPageOffset(pages, activePageIndex, pageGap);
    const el = getBehavior("text").createDefault({ id: genId(), x: pageX + 60, zIndex: nextZIndex(elements), ...overrides }) as DesignElement;
    set({ elements: [...elements, el], selectedId: el.id, selectedIds: [el.id], rightTab: "properties" });
    get().persist?.();
  },

  addImage: (src) => {
    get().saveSnapshot();
    const { elements, pages, activePageIndex, pageGap } = get();
    const pageX = getPageOffset(pages, activePageIndex, pageGap);
    const el = getBehavior("image").createDefault({ id: genId(), x: pageX + 60, zIndex: nextZIndex(elements), src }) as DesignElement;
    set({ elements: [...elements, el], selectedId: el.id, selectedIds: [el.id], rightTab: "properties" });
    get().persist?.();
  },

  addShape: (kind, overrides?) => {
    get().saveSnapshot();
    const { elements, pages, activePageIndex, pageGap } = get();
    const pageX = getPageOffset(pages, activePageIndex, pageGap);
    const size = kind === "line" ? { width: 200, height: 4 } : { width: 200, height: 200 };
    const el = getBehavior("shape").createDefault({ id: genId(), x: pageX + 60, zIndex: nextZIndex(elements), shapeKind: kind as any, ...size, ...overrides }) as DesignElement;
    set({ elements: [...elements, el], selectedId: el.id, selectedIds: [el.id], rightTab: "properties" });
    get().persist?.();
  },

  addSvg: (svgContent) => {
    get().saveSnapshot();
    const { elements, pages, activePageIndex, pageGap } = get();
    const pageX = getPageOffset(pages, activePageIndex, pageGap);
    const el = getBehavior("svg").createDefault({ id: genId(), x: pageX + 60, zIndex: nextZIndex(elements), svgContent }) as DesignElement;
    set({ elements: [...elements, el], selectedId: el.id, selectedIds: [el.id], rightTab: "properties" });
    get().persist?.();
  },

  addIcon: (svg) => {
    get().saveSnapshot();
    const { elements, pages, activePageIndex, pageGap } = get();
    const pageX = getPageOffset(pages, activePageIndex, pageGap);
    const el = getBehavior("svg").createDefault({ id: genId(), x: pageX + 60, zIndex: nextZIndex(elements), width: 80, height: 80, svgContent: svg }) as DesignElement;
    set({ elements: [...elements, el], selectedId: el.id, selectedIds: [el.id], rightTab: "properties" });
    get().persist?.();
  },

  setParent: (id, parentId) => {
    get().saveSnapshot();
    set((s: any) => ({ elements: s.elements.map((e: any) => e.id === id ? { ...e, parentId } : e) }));
    get().persist?.();
  },

  addElement: (el) => {
    get().saveSnapshot();
    const { elements } = get();
    const existingIds = new Set(elements.map((e: any) => e.id));
    const finalId = existingIds.has(el.id) ? genUniqueId(elements) : el.id;
    const finalEl = finalId === el.id ? el : { ...el, id: finalId };
    set((s: any) => ({ elements: [...s.elements, finalEl], selectedId: finalEl.id, selectedIds: [finalEl.id], rightTab: "properties" }));
    get().persist?.();
  },

  deleteSelected: () => {
    const { selectedIds, elements } = get();
    if (selectedIds.length === 0) return;
    get().saveSnapshot();
    const gids = new Set(elements.filter((e: any) => selectedIds.includes(e.id) && e.groupId).map((e: any) => e.groupId));
    const toRemove = new Set(selectedIds);
    elements.forEach((e: any) => { if (e.groupId && gids.has(e.groupId)) toRemove.add(e.id); });
    set({ elements: elements.filter((e: any) => !toRemove.has(e.id)), selectedId: null, selectedIds: [], rightTab: null, selectedGuideId: null });
    get().persist?.();
  },

  duplicateSelected: () => {
    const { selectedIds, elements } = get();
    if (selectedIds.length === 0) return;
    get().saveSnapshot();
    const maxZ = nextZIndex(elements);
    const newEls = elements.filter((e: any) => selectedIds.includes(e.id)).map((e: any) => ({
      ...JSON.parse(JSON.stringify(e)), id: genId(), x: e.x + 20, y: e.y + 20,
      zIndex: maxZ + selectedIds.indexOf(e.id) + 1,
    }));
    set((s: any) => ({ elements: [...s.elements, ...newEls], selectedId: newEls[newEls.length - 1].id, selectedIds: newEls.map((e: any) => e.id) }));
    get().persist?.();
  },

  copyStyles: () => {
    const { selectedId, elements } = get();
    if (!selectedId) return;
    const el = elements.find((e: any) => e.id === selectedId);
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
    for (const prop of styleProps) { if (prop in el) (copied as any)[prop] = el[prop]; }
    set({ copiedStyles: copied });
  },

  pasteStyles: () => {
    const { copiedStyles, selectedIds, elements } = get();
    if (!copiedStyles || selectedIds.length === 0) return;
    set({ elements: elements.map((e: any) => selectedIds.includes(e.id) ? { ...e, ...copiedStyles } : e) });
    get().persist?.();
  },

  updateElement: (id, updates) => {
    set((s: any) => ({ elements: s.elements.map((e: any) => e.id === id ? { ...e, ...updates } : e) }));
    get().persist?.();
  },

  removeElement: (id) => {
    get().saveSnapshot();
    set((s: any) => {
      const newSelectedIds = s.selectedIds.filter((sid: string) => sid !== id);
      return { elements: s.elements.filter((e: any) => e.id !== id), selectedId: newSelectedIds.length > 0 ? newSelectedIds[0] : null, selectedIds: newSelectedIds, rightTab: newSelectedIds.length > 0 ? s.rightTab : null };
    });
    get().persist?.();
  },

  // ── Selection ──

  selectElement: (id, additive = false) => {
    if (!id) {
      set({ selectedId: null, selectedIds: [], rightTab: null, editingTextId: null, selectedGuideId: null });
      return;
    }
    const elements = get().elements;
    const el = elements.find((e: any) => e.id === id);
    const groupIds = el?.groupId ? elements.filter((e: any) => e.groupId === el.groupId).map((e: any) => e.id) : [id];
    if (additive) {
      set((s: any) => {
        const allInGroup = groupIds.every((gid: string) => s.selectedIds.includes(gid));
        const newIds = allInGroup ? s.selectedIds.filter((sid: string) => !groupIds.includes(sid)) : [...s.selectedIds.filter((sid: string) => !groupIds.includes(sid)), ...groupIds];
        return { selectedId: id, selectedIds: newIds, rightTab: "properties", selectedGuideId: null };
      });
    } else {
      set({ selectedId: id, selectedIds: groupIds, rightTab: "properties", editingTextId: null, selectedGuideId: null });
    }
  },

  selectAll: () => {
    const ids = get().elements.map((e: any) => e.id);
    set({ selectedId: ids[0] ?? null, selectedIds: ids });
  },

  clearSelection: () => {
    set({ selectedId: null, selectedIds: [], rightTab: null, editingTextId: null, selectedGuideId: null });
  },

  setSelectedGuideId: (id) => set({ selectedGuideId: id, selectedId: null, selectedIds: [], rightTab: id ? "properties" : null }),

  // ── Transform ──

  moveElement: (id, x, y) => {
    set((s: any) => {
      const el = s.elements.find((e: any) => e.id === id);
      if (!el) return s;
      const dx = x - el.x;
      const dy = y - el.y;
      const gid = el.groupId;
      return { elements: s.elements.map((e: any) => { if (e.id === id) return { ...e, x, y }; if (gid && e.groupId === gid) return { ...e, x: e.x + dx, y: e.y + dy }; return e; }) };
    });
  },

  moveElements: (ids, dx, dy) => {
    set((s: any) => ({ elements: s.elements.map((e: any) => ids.includes(e.id) ? { ...e, x: e.x + dx, y: e.y + dy } : e) }));
  },

  resizeElement: (id, w, h) => {
    set((s: any) => ({ elements: s.elements.map((e: any) => e.id === id ? { ...e, width: Math.max(10, w), height: Math.max(10, h) } : e) }));
  },

  rotateElement: (id, angle) => {
    set((s: any) => ({ elements: s.elements.map((e: any) => e.id === id ? { ...e, rotation: angle } : e) }));
  },

  setOpacity: (id, opacity) => {
    set((s: any) => ({ elements: s.elements.map((e: any) => e.id === id ? { ...e, opacity: Math.max(0, Math.min(1, opacity)) } : e) }));
  },

  // ── Align / Distribute ──

  alignElements: (dir) => {
    const { selectedIds, elements } = get();
    if (selectedIds.length < 2) return;
    get().saveSnapshot();
    const selected = elements.filter((e: any) => selectedIds.includes(e.id));
    const ops: Record<string, () => void> = {
      left: () => { const minX = Math.min(...selected.map((e: any) => e.x)); set((s: any) => ({ elements: s.elements.map((e: any) => selectedIds.includes(e.id) ? { ...e, x: minX } : e) })); },
      center: () => { const avgX = selected.reduce((s: any, e: any) => s + e.x + e.width / 2, 0) / selected.length; set((s: any) => ({ elements: s.elements.map((e: any) => selectedIds.includes(e.id) ? { ...e, x: avgX - e.width / 2 } : e) })); },
      right: () => { const maxR = Math.max(...selected.map((e: any) => e.x + e.width)); set((s: any) => ({ elements: s.elements.map((e: any) => selectedIds.includes(e.id) ? { ...e, x: maxR - e.width } : e) })); },
      top: () => { const minY = Math.min(...selected.map((e: any) => e.y)); set((s: any) => ({ elements: s.elements.map((e: any) => selectedIds.includes(e.id) ? { ...e, y: minY } : e) })); },
      middle: () => { const avgY = selected.reduce((s: any, e: any) => s + e.y + e.height / 2, 0) / selected.length; set((s: any) => ({ elements: s.elements.map((e: any) => selectedIds.includes(e.id) ? { ...e, y: avgY - e.height / 2 } : e) })); },
      bottom: () => { const maxB = Math.max(...selected.map((e: any) => e.y + e.height)); set((s: any) => ({ elements: s.elements.map((e: any) => selectedIds.includes(e.id) ? { ...e, y: maxB - e.height } : e) })); },
    };
    ops[dir]?.();
    get().persist?.();
  },

  distributeElements: (dir) => {
    const { selectedIds, elements } = get();
    if (selectedIds.length < 3) return;
    get().saveSnapshot();
    const selected = elements.filter((e: any) => selectedIds.includes(e.id)).sort((a: any, b: any) => dir === "horizontal" ? a.x - b.x : a.y - b.y);
    if (dir === "horizontal") {
      const first = selected[0], last = selected[selected.length - 1];
      const gap = (last.x - first.x - selected.slice(1, -1).reduce((s: any, e: any) => s + e.width, 0)) / (selected.length - 1);
      let cursor = first.x;
      set((s: any) => ({ elements: s.elements.map((e: any) => { const idx = selected.findIndex((se: any) => se.id === e.id); if (idx === -1) return e; if (idx === 0) return { ...e, x: first.x }; cursor += gap; const newX = cursor; cursor += e.width; return { ...e, x: newX }; }) }));
    } else {
      const first = selected[0], last = selected[selected.length - 1];
      const gap = (last.y - first.y - selected.slice(1, -1).reduce((s: any, e: any) => s + e.height, 0)) / (selected.length - 1);
      let cursor = first.y;
      set((s: any) => ({ elements: s.elements.map((e: any) => { const idx = selected.findIndex((se: any) => se.id === e.id); if (idx === -1) return e; if (idx === 0) return { ...e, y: first.y }; cursor += gap; const newY = cursor; cursor += e.height; return { ...e, y: newY }; }) }));
    }
    get().persist?.();
  },

  // ── Group ──

  groupSelected: () => {
    const { selectedIds, elements } = get();
    if (selectedIds.length < 2) return;
    get().saveSnapshot();
    const groupId = genId();
    set({ elements: elements.map((e: any) => selectedIds.includes(e.id) ? { ...e, groupId } : e) });
  },

  ungroupSelected: () => {
    const { selectedIds, elements } = get();
    set({ elements: elements.map((e: any) => selectedIds.includes(e.id) ? { ...e, groupId: undefined } : e) });
  },

  // ── Z-order ──

  bringToFront: (id) => {
    get().saveSnapshot();
    const maxZ = nextZIndex(get().elements);
    set((s: any) => ({ elements: s.elements.map((e: any) => e.id === id ? { ...e, zIndex: maxZ } : e) }));
  },

  sendToBack: (id) => {
    get().saveSnapshot();
    const minZ = Math.min(...get().elements.map((e: any) => e.zIndex));
    set((s: any) => ({ elements: s.elements.map((e: any) => e.id === id ? { ...e, zIndex: minZ - 1 } : e) }));
  },

  bringForward: (id) => {
    get().saveSnapshot();
    const sorted = [...get().elements].sort((a: any, b: any) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex((e: any) => e.id === id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const above = sorted[idx + 1];
    set((s: any) => ({ elements: s.elements.map((e: any) => { if (e.id === id) return { ...e, zIndex: above.zIndex }; if (e.id === above.id) return { ...e, zIndex: sorted[idx].zIndex }; return e; }) }));
  },

  sendBackward: (id) => {
    get().saveSnapshot();
    const sorted = [...get().elements].sort((a: any, b: any) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex((e: any) => e.id === id);
    if (idx <= 0) return;
    const below = sorted[idx - 1];
    set((s: any) => ({ elements: s.elements.map((e: any) => { if (e.id === id) return { ...e, zIndex: below.zIndex }; if (e.id === below.id) return { ...e, zIndex: sorted[idx].zIndex }; return e; }) }));
  },

  // ── Anchors ──

  recalculateAnchoredPositions: () => {
    const { elements, pages, guides, pageGap } = get();
    const svc = new AnchorService(guides, pages, pageGap);
    const updated = elements.map((el: any) => {
      const before = { x: el.x, y: el.y, width: el.width, height: el.height };
      const copy = { ...el };
      svc.resolveElement(copy);
      if (copy.x !== before.x || copy.y !== before.y || copy.width !== before.width || copy.height !== before.height) return copy;
      return el;
    });
    set({ elements: updated });
    get().persist?.();
  },
}
);
