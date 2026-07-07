import type { AiContext } from "./aiToolTypes";
import type { DesignElement, ShapeKind } from "../utils/types";

export function buildAiContext(
  store: {
    elements: DesignElement[];
    pages: { id: string; name: string; width: number; height: number; bgColor: string }[];
    activePageIndex: number;
    updateElement: (id: string, updates: Partial<DesignElement>) => void;
    selectElement: (id: string | null) => void;
    removeElement: (id: string) => void;
    addElement: (el: DesignElement) => void;
    addText: (overrides?: Partial<DesignElement>) => void;
    addShape: (kind: ShapeKind, overrides?: Partial<DesignElement>) => void;
  },
): AiContext {
  const page = store.pages[store.activePageIndex];
  return {
    elements: store.elements,
    getElement: (id) => store.elements.find((e) => e.id === id),
    updateElement: store.updateElement,
    selectElement: store.selectElement,
    removeElement: store.removeElement,
    addElement: store.addElement,
    addText: store.addText,
    addShape: store.addShape,
    canvasSize: { width: page?.width ?? 1080, height: page?.height ?? 1920 },
    activePage: page ?? { id: "", name: "Default", width: 1080, height: 1920, bgColor: "#1a1a2e" },
    getElementsSummary: () =>
      store.elements.map((el) => ({
        id: el.id,
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        text: el.type === "text" ? el.text : undefined,
        src: el.type === "image" ? (el.src?.slice(0, 50) + "...") : undefined,
      })),
  };
}
