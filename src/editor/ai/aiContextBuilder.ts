import type { AiContext } from "./aiToolTypes";
import type { DesignElement, ShapeKind, Page } from "../utils/types";
import { useEditorStore } from "../store/editorStore";

export function buildAiContext(
  store: {
    saveSnapshot: () => void;
    updateElement: (id: string, updates: Partial<DesignElement>) => void;
    selectElement: (id: string | null) => void;
    removeElement: (id: string) => void;
    addElement: (el: DesignElement) => void;
    addText: (overrides?: Partial<DesignElement>) => void;
    addShape: (kind: ShapeKind, overrides?: Partial<DesignElement>) => void;
    updatePage: (id: string, updates: Partial<Page>) => void;
    addPage: () => void;
    removePage: (id: string) => void;
    setActivePage: (index: number) => void;
    addGuide: (position: number, orientation: "horizontal" | "vertical", pageNumber?: number) => void;
    removeGuide: (id: string) => void;
    updateGuidePosition: (id: string, position: number) => void;
    rotateElement: (id: string, angle: number) => void;
    alignElements: (dir: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
    distributeElements: (dir: "horizontal" | "vertical") => void;
    groupSelected: () => void;
    ungroupSelected: () => void;
    bringToFront: (id: string) => void;
    sendToBack: (id: string) => void;
    bringForward: (id: string) => void;
    sendBackward: (id: string) => void;
    undo: () => void;
    redo: () => void;
    selectAll: () => void;
    clearSelection: () => void;
    duplicateSelected: () => void;
    newProject: () => void;
    copyStyles: () => void;
    pasteStyles: () => void;
  },
): AiContext {
  return {
    get elements() { return useEditorStore.getState().elements; },
    get pages() { return useEditorStore.getState().pages; },
    get elementCount() { return useEditorStore.getState().elements.length; },
    getElement: (id) => useEditorStore.getState().elements.find((e) => e.id === id),
    updateElement: (id, updates) => {
      store.saveSnapshot();
      store.updateElement(id, updates);
    },
    selectElement: store.selectElement,
    removeElement: store.removeElement,
    addElement: store.addElement,
    addText: store.addText,
    addShape: store.addShape,
    addImage: (src, overrides) => {
      const s = useEditorStore.getState();
      const el: DesignElement = {
        id: "",
        type: "image",
        x: s.canvasWidth / 2 - 150, y: 60, width: 300, height: 300,
        rotation: 0, opacity: 1, zIndex: s.elements.length,
        src,
        ...overrides,
      };
      store.saveSnapshot();
      store.addElement(el);
    },
    addSvg: (svgContent, overrides) => {
      const el: DesignElement = {
        id: "",
        type: "svg",
        x: 0, y: 0, width: 300, height: 300,
        rotation: 0, opacity: 1, zIndex: 0,
        svgContent,
        ...overrides,
      };
      store.addElement(el);
    },
    rotateElement: (id, angle) => {
      store.saveSnapshot();
      store.rotateElement(id, angle);
    },
    alignElements: (dir) => {
      store.saveSnapshot();
      store.alignElements(dir);
    },
    distributeElements: (dir) => {
      store.saveSnapshot();
      store.distributeElements(dir);
    },
    groupSelected: () => {
      store.saveSnapshot();
      store.groupSelected();
    },
    ungroupSelected: () => {
      store.saveSnapshot();
      store.ungroupSelected();
    },
    bringToFront: (id) => {
      store.saveSnapshot();
      store.bringToFront(id);
    },
    sendToBack: (id) => {
      store.saveSnapshot();
      store.sendToBack(id);
    },
    bringForward: (id) => {
      store.saveSnapshot();
      store.bringForward(id);
    },
    sendBackward: (id) => {
      store.saveSnapshot();
      store.sendBackward(id);
    },
    undo: () => store.undo(),
    redo: () => store.redo(),
    selectAll: () => store.selectAll(),
    clearSelection: () => store.clearSelection(),
    duplicateSelected: () => {
      store.saveSnapshot();
      store.duplicateSelected();
    },
    removePage: (id) => {
      store.saveSnapshot();
      store.removePage(id);
    },
    setActivePage: (index) => store.setActivePage(index),
    newProject: () => store.newProject(),
    copyStyles: () => store.copyStyles(),
    pasteStyles: () => {
      store.saveSnapshot();
      store.pasteStyles();
    },
    updatePage: store.updatePage,
    addPage: store.addPage,
    get guides() { return useEditorStore.getState().guides; },
    addGuide: store.addGuide,
    removeGuide: store.removeGuide,
    updateGuidePosition: store.updateGuidePosition,
    get canvasSize() {
      const s = useEditorStore.getState();
      const page = s.pages[s.activePageIndex];
      return { width: page?.width ?? 1080, height: page?.height ?? 1920 };
    },
    get activePage() {
      const s = useEditorStore.getState();
      const page = s.pages[s.activePageIndex];
      return page ?? { id: "", name: "Default", width: 1080, height: 1920, bgColor: "#1a1a2e" };
    },
    get activePageIndex() {
      return useEditorStore.getState().activePageIndex;
    },
    getElementsSummary: () =>
      useEditorStore.getState().elements.map((el) => ({
        id: el.id,
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        rotation: el.rotation ?? 0,
        opacity: el.opacity ?? 1,
        zIndex: el.zIndex ?? 0,
        locked: el.locked,
        hidden: el.hidden,
        groupId: el.groupId,
        shapeKind: el.type === "shape" ? el.shapeKind : undefined,
        text: el.type === "text" ? el.text?.slice(0, 80) : undefined,
        src: el.type === "image" ? (el.src?.slice(0, 50) + "...") : undefined,
      })),
  };
}
