import { create } from "zustand";
import type { DesignElement, Page } from "../utils/types";
import { createElementSlice } from "./slices/elementSlice";
import { createPageSlice, computeCarouselSize } from "./slices/pageSlice";
import { createGuideSlice } from "./slices/guideSlice";
import { createUiSlice } from "./slices/uiSlice";
import { createHistorySlice } from "./slices/historySlice";
import type { EditorStore } from "./storeTypes";

// ── Persistence ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "design-studio-project";
let _persistTimer: ReturnType<typeof setTimeout> | null = null;

function persist(state: {
  elements: DesignElement[]; pages: Page[]; guides?: any[];
  pageGap?: number; projectName?: string;
}) {
  if (_persistTimer) clearTimeout(_persistTimer);
  _persistTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { /* quota exceeded */ }
    _persistTimer = null;
  }, 800);
}

function loadSaved(): Partial<Record<string, any>> {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}

let nextPageId = 1;
function genPageId(): string {
  return `page_${nextPageId++}_${Date.now()}`;
}

function defaultPages(): Page[] {
  return [
    { id: genPageId(), name: "Página 1", width: 1080, height: 1920, bgColor: "#1a1a2e" },
    { id: genPageId(), name: "Página 2", width: 1080, height: 1920, bgColor: "#1e1e2e" },
    { id: genPageId(), name: "Página 3", width: 1080, height: 1920, bgColor: "#2a1a2e" },
  ];
}

// ── Store composition ────────────────────────────────────────────────────────────

const saved = loadSaved();
const initialPages = saved.pages ?? defaultPages();

/** Shared persist helper attached to store so slices can call get().persist?.() */
function makePersistable(get: () => any) {
  return () => {
    const { elements, pages, guides, pageGap, projectName } = get();
    persist({ elements, pages, guides, pageGap, projectName });
  };
}

export const useEditorStore = create<EditorStore>()((set, get) => {
  // Wrap set/get so that persist is available to all slices
  const slices = {
    ...createPageSlice(set, get),
    ...createElementSlice(set, get),
    ...createGuideSlice(set, get),
    ...createUiSlice(set, get),
    ...createHistorySlice(set, get),
  };

  // Override initial state from saved data
  const first = initialPages[0];
  const carousel = computeCarouselSize(initialPages, saved.pageGap ?? 40);

  // Attach persist helper
  const persistFn = makePersistable(get);

  return {
    ...slices,

    // Override initial values
    projectName: saved.projectName ?? "Sin título",
    elements: saved.elements ?? [],
    selectedId: saved.selectedId ?? null,
    selectedIds: [],
    selectedGuideId: null,
    pages: initialPages,
    activePageIndex: 0,
    canvasWidth: first?.width ?? 1080,
    canvasHeight: first?.height ?? 1920,
    canvasBgColor: first?.bgColor ?? "#1a1a2e",
    carouselWidth: carousel.carouselWidth,
    carouselHeight: carousel.carouselHeight,
    guides: saved.guides ?? [],
    pageGap: saved.pageGap ?? 40,

    // Cross-cutting methods ────────────────────────────────────────────────────────

    persist: persistFn,
    forcePersist: () => persistFn(),

    newProject: () => {
      const blankPage: Page = { id: genPageId(), name: "Página 1", width: 1080, height: 1920, bgColor: "#1a1a2e" };
      set({
        projectName: "Sin título", elements: [], pages: [blankPage], guides: [],
        pageGap: 40, activePageIndex: 0, selectedId: null, selectedIds: [],
        selectedGuideId: null, history: [], historyIndex: -1,
        canvasWidth: blankPage.width, canvasHeight: blankPage.height, canvasBgColor: blankPage.bgColor,
      });
      persistFn();
    },

    loadProject: (data: string) => {
      try {
        const parsed = JSON.parse(data);
        if (!parsed.elements || !parsed.pages) return false;
        const firstPg = parsed.pages[0];
        set({
          projectName: parsed.projectName ?? "Sin título",
          elements: parsed.elements, pages: parsed.pages, guides: parsed.guides ?? [],
          pageGap: parsed.pageGap ?? 40, activePageIndex: 0, selectedId: null,
          selectedIds: [], selectedGuideId: null, history: [], historyIndex: -1,
          canvasWidth: firstPg.width, canvasHeight: firstPg.height, canvasBgColor: firstPg.bgColor,
        });
        persistFn();
        return true;
      } catch { return false; }
    },
  };
});
