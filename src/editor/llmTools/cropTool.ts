import type { DesignElement, ClipMask, CropPreview } from "../utils/types";
import { applyCropByCoords, getCropRegion, type CropCoords } from "../utils/cropUtils";

// ─── Tool Schema (OpenAI / Anthropic function calling format) ───

const CROP_DESC =
  "Crop a specific element on the canvas. Two-step flow: first call with confirmed=false to show a visual " +
  "preview on the canvas, then call again with confirmed=true to apply. " +
  "Two crop modes: 'rect' (default) for a rectangular region, 'bezier' for an arbitrary SVG path. " +
  "For images in rect mode, pixels outside the area are permanently removed. " +
  "For other elements and bezier mode, a visual clip mask is applied without destroying content.";

export const cropElementTool = {
  name: "crop_element",
  description: CROP_DESC,
  parameters: {
    type: "object",
    properties: {
      elementId: {
        type: "string",
        description: "The ID of the element to crop (e.g., 'el_1_1234567890')",
      },
      confirmed: {
        type: "boolean",
        description:
          "false = show preview and ask user if location is correct (default). " +
          "true = user confirmed, apply the crop permanently.",
      },
      mode: {
        type: "string",
        enum: ["rect", "bezier"],
        description: "'rect' (default) = rectangular region via x/y/width/height. 'bezier' = arbitrary SVG path.",
      },
      x: {
        type: "number",
        description: "Rect mode only. Horizontal offset from the element's left edge (px). Defaults to 0.",
      },
      y: {
        type: "number",
        description: "Rect mode only. Vertical offset from the element's top edge (px). Defaults to 0.",
      },
      width: {
        type: "number",
        description: "Rect mode only. Width of the crop region (px). Defaults to element width minus x.",
      },
      height: {
        type: "number",
        description: "Rect mode only. Height of the crop region (px). Defaults to element height minus y.",
      },
      bezierPath: {
        type: "string",
        description:
          "Bezier mode only. SVG path 'd' attribute data defining the crop region. " +
          "Uses standard SVG commands: M (moveTo), L (lineTo), C (cubic bezier), Q (quadratic bezier), Z (close). " +
          "Coordinates should be within the element's bounding box (0,0 to width,height). " +
          "Example: 'M50,0 C77.6,0 100,22.4 100,50 C100,77.6 77.6,100 50,100 C22.4,100 0,77.6 0,50 C0,22.4 22.4,0 50,0 Z' (circle). " +
          "Example: 'M0,50 Q25,0 50,50 T100,50 V100 H0 Z' (wave). " +
          "Example: 'M50,30 C50,10 20,10 20,30 C20,55 50,75 50,85 C50,75 80,55 80,30 C80,10 50,10 50,30 Z' (heart).",
      },
    },
    required: ["elementId"],
  },
} as const;

export const confirmCropTool = {
  name: "crop_element_confirm",
  description:
    "Confirm and permanently apply the crop that was previously previewed. " +
    "After calling crop_element with confirmed=false, the user/LLM inspects the preview. " +
    "If the location is correct, call this tool to apply it. Otherwise call crop_element_cancel.",
  parameters: {
    type: "object",
    properties: {},
  },
} as const;

export const cancelCropTool = {
  name: "crop_element_cancel",
  description:
    "Cancel the pending crop preview and restore the element to its previous state. " +
    "Call this if the previewed crop location is incorrect.",
  parameters: {
    type: "object",
    properties: {},
  },
} as const;

export const resetCropTool = {
  name: "reset_crop",
  description: "Remove crop from an element, restoring full visibility.",
  parameters: {
    type: "object",
    properties: {
      elementId: {
        type: "string",
        description: "The ID of the element to reset crop on.",
      },
    },
    required: ["elementId"],
  },
} as const;

export const getCropInfoTool = {
  name: "get_crop_info",
  description: "Get the current crop region and dimensions of a specific element or all cropped elements.",
  parameters: {
    type: "object",
    properties: {
      elementId: {
        type: "string",
        description: "Optional. If provided, returns info for that element only. If omitted, returns all cropped elements.",
      },
    },
  },
} as const;

// ─── Tool type ───

export interface LLMTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (params: Record<string, unknown>, context: LLMToolContext) => Promise<LLMToolResult>;
}

export interface LLMToolContext {
  elements: DesignElement[];
  getElement: (id: string) => DesignElement | undefined;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  selectElement: (id: string | null) => void;
  setCropPreview: (preview: CropPreview | null) => void;
  getCropPreview?: () => CropPreview | null;
}

export interface LLMToolResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

// ─── Handlers ───

async function handleCropElement(
  params: Record<string, unknown>,
  ctx: LLMToolContext,
): Promise<LLMToolResult> {
  const elementId = String(params.elementId ?? "");
  const el = ctx.getElement(elementId);
  if (!el) {
    return { success: false, message: `Element with ID "${elementId}" not found.` };
  }

  const confirmed = params.confirmed === true;
  const mode = String(params.mode ?? "rect");

  // Validate parameters
  if (mode === "bezier") {
    const bezierPath = String(params.bezierPath ?? "");
    if (!bezierPath) {
      return { success: false, message: "Bezier mode requires a 'bezierPath' parameter with SVG path data." };
    }

    if (!confirmed) {
      // Step 1: show preview
      ctx.setCropPreview({ elementId, mode: "bezier", bezierPath });
      ctx.selectElement(elementId);
      return {
        success: true,
        message: [
          `Preview of bezier crop on element "${elementId}" is now visible on the canvas.`,
          `The element is ${el.width}x${el.height}px.`,
          "Is this crop location correct? If yes, call crop_element_confirm. If not, call crop_element_cancel.",
        ].join(" "),
        data: { elementId, mode: "bezier", elementBounds: { width: el.width, height: el.height }, pending: true },
      };
    }

    // Step 2: apply confirmed bezier crop
    const clipMask: ClipMask = { type: "path", value: bezierPath };
    ctx.updateElement(elementId, { clipMask });
    ctx.setCropPreview(null);
    ctx.selectElement(elementId);
    return {
      success: true,
      message: `Applied bezier clip path to element "${elementId}".`,
      data: { elementId, mode: "bezier", clipMask },
    };
  }

  // Rect mode
  const x = typeof params.x === "number" ? params.x : 0;
  const y = typeof params.y === "number" ? params.y : 0;
  const width = typeof params.width === "number" ? params.width : el.width - x;
  const height = typeof params.height === "number" ? params.height : el.height - y;

  if (width <= 0 || height <= 0) {
    return { success: false, message: `Invalid crop dimensions: width=${width}, height=${height}. Both must be positive.` };
  }
  if (x + width > el.width || y + height > el.height) {
    return {
      success: false,
      message: `Crop region (${x},${y},${width}x${height}) exceeds element bounds (${el.width}x${el.height}).`,
    };
  }

  if (!confirmed) {
    // Step 1: show preview
    ctx.setCropPreview({ elementId, mode: "rect", rect: { x, y, width, height } });
    ctx.selectElement(elementId);
    return {
      success: true,
      message: [
        `Preview of rect crop on element "${elementId}" is now visible on the canvas.`,
        `Crop region: x=${x}, y=${y}, width=${width}, height=${height}. Element is ${el.width}x${el.height}px.`,
        "Is this crop location correct? If yes, call crop_element_confirm. If not, call crop_element_cancel.",
      ].join(" "),
      data: { elementId, mode: "rect", cropRegion: { x, y, width, height }, elementBounds: { width: el.width, height: el.height }, pending: true },
    };
  }

  // Step 2: apply confirmed rect crop
  const coords: CropCoords = { x, y, width, height };
  const updates = await applyCropByCoords(el, coords);
  if (!updates) {
    return { success: false, message: "Failed to crop element." };
  }

  ctx.updateElement(elementId, updates);
  ctx.setCropPreview(null);
  ctx.selectElement(elementId);

  return {
    success: true,
    message: `Cropped element "${elementId}" to region (${x},${y},${width}x${height}).`,
    data: { elementId, cropRegion: { x, y, width, height }, elementType: el.type },
  };
}

async function handleConfirmCrop(
  _params: Record<string, unknown>,
  ctx: LLMToolContext,
): Promise<LLMToolResult> {
  if (!ctx.getCropPreview) {
    return { success: false, message: "Host does not support reading crop preview." };
  }
  const preview = ctx.getCropPreview();
  if (!preview) {
    return {
      success: false,
      message: "No pending crop preview found to confirm. Call crop_element first with confirmed=false.",
    };
  }

  const { elementId, mode, rect, bezierPath } = preview;

  if (mode === "bezier") {
    return handleCropElement({ elementId, mode, bezierPath, confirmed: true }, ctx);
  }

  return handleCropElement({ elementId, mode, confirmed: true, ...rect }, ctx);
}

async function handleCancelCrop(
  _params: Record<string, unknown>,
  ctx: LLMToolContext,
): Promise<LLMToolResult> {
  ctx.setCropPreview(null);
  return {
    success: true,
    message: "Crop preview cancelled. Element restored to its previous state.",
    data: { cancelled: true },
  };
}

async function handleResetCrop(
  params: Record<string, unknown>,
  ctx: LLMToolContext,
): Promise<LLMToolResult> {
  const elementId = String(params.elementId ?? "");
  const el = ctx.getElement(elementId);
  if (!el) {
    return { success: false, message: `Element with ID "${elementId}" not found.` };
  }

  const updates: Partial<DesignElement> = {};

  if (el.type === "image") {
    updates.cropX = undefined;
    updates.cropY = undefined;
    updates.cropW = undefined;
    updates.cropH = undefined;
  }
  if (el.clipMask) {
    updates.clipMask = undefined;
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, message: `Element "${elementId}" has no crop to reset.` };
  }

  ctx.updateElement(elementId, updates);

  return {
    success: true,
    message: `Reset crop on element "${elementId}".`,
    data: { elementId },
  };
}

async function handleGetCropInfo(
  params: Record<string, unknown>,
  ctx: LLMToolContext,
): Promise<LLMToolResult> {
  const elementId = params.elementId ? String(params.elementId) : null;

  if (elementId) {
    const el = ctx.getElement(elementId);
    if (!el) {
      return { success: false, message: `Element with ID "${elementId}" not found.` };
    }
    const region = getCropRegion(el);
    const isCropped = region.x !== 0 || region.y !== 0 || region.width !== el.width || region.height !== el.height;
    return {
      success: true,
      message: isCropped
        ? `Element "${elementId}" is cropped to ${region.width}x${region.height} at offset (${region.x},${region.y}).`
        : `Element "${elementId}" has no crop applied.`,
      data: { elementId, isCropped, cropRegion: region, elementType: el.type, originalSize: { width: el.width, height: el.height } },
    };
  }

  const cropped = ctx.elements.filter((e) => {
    const r = getCropRegion(e);
    return r.x !== 0 || r.y !== 0 || r.width !== e.width || r.height !== e.height;
  }).map((e) => ({
    id: e.id,
    type: e.type,
    cropRegion: getCropRegion(e),
    originalSize: { width: e.width, height: e.height },
  }));

  return {
    success: true,
    message: cropped.length > 0
      ? `Found ${cropped.length} cropped element(s).`
      : "No elements have crop applied.",
    data: { croppedElements: cropped, count: cropped.length },
  };
}

// ─── Tool registry ───

export const cropTools: LLMTool[] = [
  {
    ...cropElementTool,
    handler: handleCropElement,
  },
  {
    ...confirmCropTool,
    handler: handleConfirmCrop,
  },
  {
    ...cancelCropTool,
    handler: handleCancelCrop,
  },
  {
    ...resetCropTool,
    handler: handleResetCrop,
  },
  {
    ...getCropInfoTool,
    handler: handleGetCropInfo,
  },
];
