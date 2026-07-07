import type { AiTool } from "./aiToolTypes";
import type { DesignElement } from "../utils/types";
import { getWikiSection, listWikiSections } from "./wikiContent";
import { setPreview } from "./previewStore";
import { capturePageAsDataUrl } from "./capturePage";

// ─── Tool: Get canvas state ───

const getCanvasStateTool: AiTool = {
  name: "get_canvas_state",
  description: "Get a summary of the current canvas state, including all elements, their positions, types, and sizes. Use this first to understand what's on the canvas.",
  parameters: {
    type: "object",
    properties: {},
  },
  handler: async (_params, ctx) => {
    return {
      success: true,
      message: `Canvas is ${ctx.canvasSize.width}x${ctx.canvasSize.height} with ${ctx.elements.length} element(s). Page: "${ctx.activePage.name}" (${ctx.activePage.width}x${ctx.activePage.height}).`,
      data: {
        canvasSize: ctx.canvasSize,
        activePage: ctx.activePage,
        elements: ctx.getElementsSummary(),
        elementCount: ctx.elements.length,
      },
    };
  },
};

// ─── Tool: Select element ───

const selectElementTool: AiTool = {
  name: "select_element",
  description: "Select an element by its ID to see its properties or prepare it for modification.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "The element ID to select." },
    },
    required: ["elementId"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    ctx.selectElement(id);
    return { success: true, message: `Selected element "${id}" (${el.type}).`, data: { element: el } };
  },
};

// ─── Tool: Delete element ───

const deleteElementTool: AiTool = {
  name: "delete_element",
  description: "Delete an element from the canvas by its ID.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "The element ID to delete." },
    },
    required: ["elementId"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    ctx.removeElement(id);
    return { success: true, message: `Deleted element "${id}".` };
  },
};

// ─── Tool: Move element ───

const moveElementTool: AiTool = {
  name: "move_element",
  description: "Move one or more elements to a new position. If multiple IDs are provided, they all move by the same delta.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID to move." },
      x: { type: "number", description: "New X position (px)." },
      y: { type: "number", description: "New Y position (px)." },
      multipleIds: { type: "array", items: { type: "string" }, description: "Optional: list of element IDs to move together." },
    },
    required: ["elementId", "x", "y"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const x = Number(params.x ?? 0);
    const y = Number(params.y ?? 0);
    const ids = params.multipleIds ? (params.multipleIds as string[]) : [id];
    ids.forEach((eid) => ctx.updateElement(eid, { x, y }));
    ctx.selectElement(id);
    return { success: true, message: `Moved ${ids.length} element(s) to (${x}, ${y}).`, data: { count: ids.length } };
  },
};

// ─── Tool: Resize element ───

const resizeElementTool: AiTool = {
  name: "resize_element",
  description: "Resize an element to specific dimensions.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID to resize." },
      width: { type: "number", description: "New width (px). Minimum 10." },
      height: { type: "number", description: "New height (px). Minimum 10." },
    },
    required: ["elementId", "width", "height"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const w = Math.max(10, Number(params.width ?? 10));
    const h = Math.max(10, Number(params.height ?? 10));
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    ctx.updateElement(id, { width: w, height: h });
    return { success: true, message: `Resized element "${id}" to ${w}x${h}.`, data: { width: w, height: h } };
  },
};

// ─── Tool: Update text ───

const updateTextTool: AiTool = {
  name: "update_text",
  description: "Change the text content of a text element.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Text element ID." },
      text: { type: "string", description: "New text content." },
      fontSize: { type: "number", description: "Optional: new font size (px)." },
      fontFamily: { type: "string", description: "Optional: font family name." },
      color: { type: "string", description: "Optional: text color (hex, e.g. #ffffff)." },
      textAlign: { type: "string", enum: ["left", "center", "right"], description: "Optional: text alignment." },
    },
    required: ["elementId", "text"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    if (el.type !== "text") return { success: false, message: `Element "${id}" is not a text element.` };

    const updates: Partial<DesignElement> = { text: String(params.text ?? "") };
    if (params.fontSize !== undefined) updates.fontSize = Number(params.fontSize);
    if (params.fontFamily !== undefined) updates.fontFamily = String(params.fontFamily);
    if (params.color !== undefined) updates.color = String(params.color);
    if (params.textAlign !== undefined) updates.textAlign = params.textAlign as "left" | "center" | "right";
    ctx.updateElement(id, updates);
    return { success: true, message: `Updated text on element "${id}".`, data: updates };
  },
};

// ─── Tool: Change color ───

const changeColorTool: AiTool = {
  name: "change_color",
  description: "Change the background color or text color of an element.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID." },
      backgroundColor: { type: "string", description: "New background color (hex, e.g. #ff0000)." },
      color: { type: "string", description: "For text elements: new text color (hex)." },
    },
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    const updates: Partial<DesignElement> = {};
    if (params.backgroundColor !== undefined) updates.backgroundColor = String(params.backgroundColor);
    if (params.color !== undefined) updates.color = String(params.color);
    if (Object.keys(updates).length === 0) return { success: false, message: "No color parameters provided." };
    ctx.updateElement(id, updates);
    return { success: true, message: `Updated colors on element "${id}".`, data: updates };
  },
};

// ─── Tool: Get element info ───

const getElementInfoTool: AiTool = {
  name: "get_element_info",
  description: "Get detailed information about a specific element by its ID.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID." },
    },
    required: ["elementId"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    return { success: true, message: `Element "${id}": ${el.type}, at (${el.x}, ${el.y}), ${el.width}x${el.height}.`, data: el as unknown as Record<string, unknown> };
  },
};

// ─── Tool: Create text element ───

const createTextTool: AiTool = {
  name: "create_text",
  description: "Create a new text element on the canvas.",
  parameters: {
    type: "object",
    properties: {
      text: { type: "string", description: "Text content." },
      x: { type: "number", description: "X position (px). Default: center of canvas." },
      y: { type: "number", description: "Y position (px). Default: center of canvas." },
      fontSize: { type: "number", description: "Font size (px). Default: 32." },
      fontFamily: { type: "string", description: "Font family. Default: Inter." },
      color: { type: "string", description: "Text color (hex). Default: #ffffff." },
      width: { type: "number", description: "Text box width (px). Default: 300." },
      height: { type: "number", description: "Text box height (px). Default: auto." },
    },
    required: ["text"],
  },
  handler: async (params, ctx) => {
    const text = String(params.text ?? "");
    if (!text) return { success: false, message: "Text content is required." };
    const cx = ctx.canvasSize.width / 2 - 150;
    const cy = ctx.canvasSize.height / 2 - 16;
    ctx.addText({
      text,
      x: params.x !== undefined ? Number(params.x) : cx,
      y: params.y !== undefined ? Number(params.y) : cy,
      fontSize: params.fontSize !== undefined ? Number(params.fontSize) : 32,
      fontFamily: params.fontFamily !== undefined ? String(params.fontFamily) : "Inter",
      color: params.color !== undefined ? String(params.color) : "#ffffff",
      width: params.width !== undefined ? Math.max(50, Number(params.width)) : 300,
      height: params.height !== undefined ? Math.max(20, Number(params.height)) : 48,
    });
    return { success: true, message: `Created text element: "${text.slice(0, 40)}..."` };
  },
};

// ─── Tool: Create shape ───

const createShapeTool: AiTool = {
  name: "create_shape",
  description: "Create a new shape element on the canvas.",
  parameters: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["rect", "circle", "triangle", "star", "line"], description: "Shape type." },
      x: { type: "number", description: "X position. Default: center." },
      y: { type: "number", description: "Y position. Default: center." },
      width: { type: "number", description: "Width (px). Default: 100." },
      height: { type: "number", description: "Height (px). Default: 100." },
      backgroundColor: { type: "string", description: "Fill color (hex). Default: #6c5ce7." },
    },
    required: ["kind"],
  },
  handler: async (params, ctx) => {
    const kind = String(params.kind ?? "rect") as "rect" | "circle" | "triangle" | "star" | "line";
    const cx = ctx.canvasSize.width / 2 - 50;
    const cy = ctx.canvasSize.height / 2 - 50;
    ctx.addShape(kind, {
      x: params.x !== undefined ? Number(params.x) : cx,
      y: params.y !== undefined ? Number(params.y) : cy,
      width: params.width !== undefined ? Math.max(10, Number(params.width)) : 100,
      height: params.height !== undefined ? Math.max(10, Number(params.height)) : 100,
      backgroundColor: params.backgroundColor !== undefined ? String(params.backgroundColor) : "#6c5ce7",
    });
    return { success: true, message: `Created ${kind} shape.` };
  },
};

// ─── Tool: Set opacity ───

const setOpacityTool: AiTool = {
  name: "set_opacity",
  description: "Change the opacity of an element.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID." },
      opacity: { type: "number", description: "Opacity value (0 to 1). 0=invisible, 1=fully opaque." },
    },
    required: ["elementId", "opacity"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const opacity = Math.max(0, Math.min(1, Number(params.opacity ?? 1)));
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    ctx.updateElement(id, { opacity });
    return { success: true, message: `Set opacity of "${id}" to ${opacity}.` };
  },
};

// ─── Tool: Update image ───

const updateImageTool: AiTool = {
  name: "update_image",
  description: "Change the source URL of an image element.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Image element ID." },
      src: { type: "string", description: "New image URL or data URL." },
    },
    required: ["elementId", "src"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const src = String(params.src ?? "");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    if (el.type !== "image") return { success: false, message: `Element "${id}" is not an image.` };
    ctx.updateElement(id, { src });
    return { success: true, message: `Updated image source for "${id}".` };
  },
};

// ─── Tool: Duplicate element ───

const duplicateElementTool: AiTool = {
  name: "duplicate_element",
  description: "Duplicate an element. The copy will be offset by 30px.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID to duplicate." },
    },
    required: ["elementId"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    const maxZ = ctx.elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
    const newId = `el_${Date.now()}`;
    const copy: DesignElement = { ...JSON.parse(JSON.stringify(el)), id: newId, x: el.x + 30, y: el.y + 30, zIndex: maxZ + 1 };
    ctx.addElement(copy);
    return { success: true, message: `Duplicated element "${id}" -> "${newId}".`, data: { newId } };
  },
};

// ─── Tool: Read wiki section ───

const readWikiTool: AiTool = {
  name: "read_wiki",
  description: "Read a SPECIFIC section from the AI wiki (ia_wiki). Use this to learn about page parameters, text styling, figures, backgrounds, patches, and examples. Pass a section slug (e.g. 'atributos-del-text', 'formato-de-datos', 'tipos-de-shape'). Use read_wiki_toc first to see available sections. NEVER read entire files — always specify a section.",
  parameters: {
    type: "object",
    properties: {
      file: {
        type: "string",
        enum: ["PAGE", "TEXTS", "FIGURES", "IMAGES", "PARCHES", "FONDOS", "EJEMPLOS"],
        description: "AI wiki file to read from.",
      },
      section: {
        type: "string",
        description: "Section slug to read (find slugs via read_wiki_toc). REQUIRED — do not read whole files.",
      },
    },
    required: ["file", "section"],
  },
  handler: async (params, _ctx) => {
    const file = String(params.file ?? "PAGE");
    const section = String(params.section ?? "");
    const knownFiles = ["PAGE", "TEXTS", "FIGURES", "IMAGES", "PARCHES", "FONDOS", "EJEMPLOS"];
    const f = knownFiles.includes(file) ? file : "PAGE";
    if (!section) return { success: false, message: 'Specify a section slug. Use read_wiki_toc first to see available sections.' };

    // Try ia_wiki first, then fall back to wiki/elements
    const iaPaths = [`/ia_wiki/${f}.md`];
    const humanPaths = [`/wiki/elements/${f}.md`];
    const paths = [...iaPaths, ...humanPaths];

    for (const p of paths) {
      const content = getWikiSection(p, section);
      if (content) {
        return { success: true, message: `Wiki section "${section}" from ${p}:`, data: { content, file: `${f}.md`, section } };
      }
    }

    // Not found in any path — suggest close matches
    for (const p of paths) {
      const slugs = listWikiSections(p);
      if (slugs) {
        const close = slugs.filter((s) => s.slug.includes(section.slice(0, 10)) || s.heading.toLowerCase().includes(section.toLowerCase())).slice(0, 5);
        if (close.length) {
          return { success: false, message: `Section "${section}" not found. Did you mean: ${close.map((c) => c.slug).join(", ")}?` };
        }
      }
    }
    return { success: false, message: `Section "${section}" not found in ${f}.md.` };
  },
};

// ─── Tool: Read wiki table of contents ───

const readWikiTocTool: AiTool = {
  name: "read_wiki_toc",
  description: "List all available sections in an AI wiki file. ALWAYS call this first to find section slugs before using read_wiki.",
  parameters: {
    type: "object",
    properties: {
      file: {
        type: "string",
        enum: ["PAGE", "TEXTS", "FIGURES", "IMAGES", "PARCHES", "FONDOS", "EJEMPLOS"],
        description: "AI wiki file to list sections for.",
      },
    },
    required: ["file"],
  },
  handler: async (params, _ctx) => {
    const file = String(params.file ?? "PAGE");
    const knownFiles = ["PAGE", "TEXTS", "FIGURES", "IMAGES", "PARCHES", "FONDOS", "EJEMPLOS"];
    const f = knownFiles.includes(file) ? file : "PAGE";

    // Try ia_wiki first, then fall back to wiki/elements
    const iaPaths = [`/ia_wiki/${f}.md`];
    const humanPaths = [`/wiki/elements/${f}.md`];

    for (const p of [...iaPaths, ...humanPaths]) {
      const sections = listWikiSections(p);
      if (sections) {
        return { success: true, message: `Sections in ${f}.md (${sections.length}):`, data: { sections, file: `${f}.md` } };
      }
    }
    return { success: false, message: `Wiki file "${f}.md" not found.` };
  },
};

// ─── Tool: List available tools ───

const renderPreviewTool: AiTool = {
  name: "render_preview",
  description: "Render a specific page as a PNG or JPG image so the AI can visually verify the design. The image is fed directly to vision-capable models.",
  parameters: {
    type: "object",
    properties: {
      page: { type: "number", description: "Page index (0-based). Default: 0 (first page)." },
      format: { type: "string", enum: ["png", "jpg"], description: "Image format. 'png' for quality (supports transparency), 'jpg' for smaller file size. Default: png." },
    },
  },
  handler: async (params, _ctx) => {
    try {
      const pageIndex = params.page !== undefined ? Number(params.page) : 0;
      const format = params.format === "jpg" ? "jpg" : "png" as "png" | "jpg";

      const canvasRoot = document.querySelector<HTMLElement>('[data-canvas-root="true"]');
      if (!canvasRoot) return { success: false, message: "Canvas element not found." };

      const pageEls = canvasRoot.querySelectorAll<HTMLElement>("[data-page]");
      if (pageEls.length === 0) return { success: false, message: "No pages found on canvas." };
      if (pageIndex < 0 || pageIndex >= pageEls.length) {
        return {
          success: false,
          message: `Page index ${pageIndex} out of range. Available pages: 0-${pageEls.length - 1} (${pageEls.length} total).`,
        };
      }

      const dataUrl = await capturePageAsDataUrl(pageEls[pageIndex], format);
      setPreview(dataUrl);
      return { success: true, message: `Página ${pageIndex + 1} capturada en ${format.toUpperCase()}. La imagen se me ha entregado para que la vea.` };
    } catch (e: any) {
      return { success: false, message: `Failed to render preview: ${e.message}` };
    }
  },
};

const listToolsTool: AiTool = {
  name: "list_available_tools",
  description: "List all available AI tools with their descriptions.",
  parameters: { type: "object", properties: {} },
  handler: async (_params, _ctx) => {
    const descriptions = allTools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
    return { success: true, message: `Available tools: ${allTools.length}`, data: { tools: descriptions } };
  },
};

// ─── Export all tools ───

export const allTools: AiTool[] = [
  readWikiTool,
  readWikiTocTool,
  renderPreviewTool,
  getCanvasStateTool,
  selectElementTool,
  deleteElementTool,
  moveElementTool,
  resizeElementTool,
  updateTextTool,
  changeColorTool,
  getElementInfoTool,
  createTextTool,
  createShapeTool,
  setOpacityTool,
  updateImageTool,
  duplicateElementTool,
  listToolsTool,
];
