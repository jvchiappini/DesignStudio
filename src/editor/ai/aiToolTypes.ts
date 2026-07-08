import type { DesignElement, ShapeKind, Page } from "../utils/types";

export interface AiGuide {
  id: string;
  position: number;
  orientation: "horizontal" | "vertical";
  pageId?: string;
}

export interface AiTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (params: Record<string, unknown>, ctx: AiContext) => Promise<AiResult>;
}

export interface AiContext {
  /** All elements currently on the canvas */
  elements: DesignElement[];
  /** All pages in the project */
  pages: Page[];
  /** Get a single element by ID */
  getElement: (id: string) => DesignElement | undefined;
  /** Update an element's properties (saves undo snapshot) */
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  /** Select an element */
  selectElement: (id: string | null) => void;
  /** Delete an element */
  removeElement: (id: string) => void;
  /** Add a new element */
  addElement: (el: DesignElement) => void;
  /** Add text element */
  addText: (overrides?: Partial<DesignElement>) => void;
  /** Add shape element */
  addShape: (kind: ShapeKind, overrides?: Partial<DesignElement>) => void;
  /** Add image element */
  addImage: (src: string, overrides?: Partial<DesignElement>) => void;
  /** Add SVG element */
  addSvg: (svgContent: string, overrides?: Partial<DesignElement>) => void;
  /** Rotate an element */
  rotateElement: (id: string, angle: number) => void;
  /** Align selected elements */
  alignElements: (dir: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  /** Distribute selected elements */
  distributeElements: (dir: "horizontal" | "vertical") => void;
  /** Group selected elements */
  groupSelected: () => void;
  /** Ungroup selected elements */
  ungroupSelected: () => void;
  /** Bring element to front */
  bringToFront: (id: string) => void;
  /** Send element to back */
  sendToBack: (id: string) => void;
  /** Bring element forward */
  bringForward: (id: string) => void;
  /** Send element backward */
  sendBackward: (id: string) => void;
  /** Undo last action */
  undo: () => void;
  /** Redo last undone action */
  redo: () => void;
  /** Select all elements */
  selectAll: () => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Duplicate selected elements */
  duplicateSelected: () => void;
  /** Remove a page by ID */
  removePage: (id: string) => void;
  /** Set active page by index */
  setActivePage: (index: number) => void;
  /** Create a new blank project */
  newProject: () => void;
  /** Copy styles from selected element */
  copyStyles: () => void;
  /** Paste copied styles to selected elements */
  pasteStyles: () => void;
  /** Get the current canvas/page dimensions */
  canvasSize: { width: number; height: number };
  /** Get current page info */
  activePage: { id: string; name: string; width: number; height: number; bgColor: string };
  /** Get available elements summary with richer data */
  getElementsSummary: () => Array<{
    id: string; type: string;
    x: number; y: number; width: number; height: number;
    rotation: number; opacity: number; zIndex: number;
    locked?: boolean; hidden?: boolean; groupId?: string;
    shapeKind?: string; text?: string; src?: string;
  }>;
  /** Update a page's properties (bgColor, bgLayers, name, width, height) */
  updatePage: (id: string, updates: Partial<Page>) => void;
  /** Add a new page to the project */
  addPage: () => void;
  /** Get total element count */
  elementCount: number;
  /** All guides in the project */
  guides: AiGuide[];
  /** Add a guide to the active page (or global if no pageId) */
  addGuide: (position: number, orientation: "horizontal" | "vertical", pageId?: string) => void;
  /** Remove a guide by ID */
  removeGuide: (id: string) => void;
  /** Move a guide to a new position */
  updateGuidePosition: (id: string, position: number) => void;
}

export interface AiResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}
