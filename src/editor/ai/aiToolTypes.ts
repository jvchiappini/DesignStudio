import type { DesignElement, ShapeKind } from "../utils/types";

export interface AiTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (params: Record<string, unknown>, ctx: AiContext) => Promise<AiResult>;
}

export interface AiContext {
  /** All elements currently on the canvas */
  elements: DesignElement[];
  /** Get a single element by ID */
  getElement: (id: string) => DesignElement | undefined;
  /** Update an element's properties */
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
  /** Get the current canvas/page dimensions */
  canvasSize: { width: number; height: number };
  /** Get current page info */
  activePage: { id: string; name: string; width: number; height: number; bgColor: string };
  /** Get available elements summary */
  getElementsSummary: () => Array<{ id: string; type: string; x: number; y: number; width: number; height: number; text?: string }>;
}

export interface AiResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}
