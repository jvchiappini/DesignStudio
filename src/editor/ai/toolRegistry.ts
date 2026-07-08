import type { AiTool } from "./aiToolTypes";
import type { DesignElement, Page } from "../utils/types";
import { getWikiSection, listWikiSections } from "./wikiContent";
import { setPreview } from "./previewStore";
import { capturePageAsDataUrl } from "./capturePage";
import { applyJsxToStore } from "./jsxApplicator";
import { applyPatchTool } from "./applyPatchTool";
import { cssBackgroundToLayers } from "../utils/cssBackgroundParser";
import { useEditorStore } from "../store/editorStore";

// ─── Tool: Get canvas state ───

const getCanvasStateTool: AiTool = {
  name: "get_canvas_state",
  description: "Get a summary of the current canvas state, including all elements, their positions, types, and sizes. Use this first to understand what's on the canvas.",
  parameters: {
    type: "object",
    properties: {},
  },
  handler: async (_params, ctx) => {
    const summary = ctx.getElementsSummary();
    let elList = "";
    if (summary.length === 0) {
      elList = "No elements on canvas.";
    } else {
      const rows = summary.map((e, i) =>
        `${i + 1}. [${e.id}] ${e.type} at (${e.x},${e.y}) ${e.width}x${e.height}${e.text ? ` text="${e.text.slice(0, 40)}"` : ""}${e.src ? ` src="${e.src.slice(0, 40)}"` : ""}`
      );
      elList = rows.join("\n");
    }
    return {
      success: true,
      message: `Canvas ${ctx.canvasSize.width}x${ctx.canvasSize.height} | Page "${ctx.activePage.name}" (${ctx.activePage.width}x${ctx.activePage.height}) | ${summary.length} element(s):\n${elList}`,
      data: {
        canvasSize: ctx.canvasSize,
        activePage: ctx.activePage,
        elements: summary,
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
  description: "Change the text content and basic typography properties of a text element. ⚠️ PREREQUISITE: Read TEXTS.md first to ensure h, alignment, and spacing are correct.",
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
  description: "Create a new text element on the canvas. 🛑 PREREQUISITE: Read TEXTS.md first via read_wiki to calculate correct h and avoid clipped text.",
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

// ─── Tool: Update page ───

const updatePageTool: AiTool = {
  name: "update_page",
  description: "Update page-level properties: background color, background layers (mesh gradients), name, width, height. Use bgLayers as a JSON array for complex backgrounds like mesh gradients. For CSS-style backgrounds, use bgStyle instead (it will be auto-converted).",
  parameters: {
    type: "object",
    properties: {
      pageIndex: { type: "number", description: "Page index (0-based). Default: 0 (first page)." },
      bgColor: { type: "string", description: "New background color (hex, e.g. #1a1a2e)." },
      bgStyle: { type: "string", description: "CSS background string for mesh gradients (e.g. 'radial-gradient(ellipse at 20% 50%, rgba(102,126,234,0.3) 0%, transparent 50%)'). Auto-converted to bgLayers." },
      name: { type: "string", description: "New page name." },
      width: { type: "number", description: "New page width (px)." },
      height: { type: "number", description: "New page height (px)." },
    },
  },
  handler: async (params, ctx) => {
    const pageIndex = params.pageIndex !== undefined ? Number(params.pageIndex) : 0;
    const pages = ctx.pages;
    if (pageIndex < 0 || pageIndex >= pages.length) {
      return { success: false, message: `Page index ${pageIndex} out of range. Available: 0-${pages.length - 1}.` };
    }
    const page = pages[pageIndex];
    const updates: Partial<Page> = {};

    if (params.bgColor !== undefined) updates.bgColor = String(params.bgColor);
    if (params.name !== undefined) updates.name = String(params.name);
    if (params.width !== undefined) updates.width = Number(params.width);
    if (params.height !== undefined) updates.height = Number(params.height);
    if (params.bgStyle !== undefined) {
      const layers = cssBackgroundToLayers(String(params.bgStyle));
      if (layers.length > 0) updates.bgLayers = layers;
    }

    ctx.updatePage(page.id, updates);
    return { success: true, message: `Page ${pageIndex + 1} "${page.name}" updated.`, data: updates as Record<string, unknown> };
  },
};

// ─── Tool: Add page ───

const addPageTool: AiTool = {
  name: "add_page",
  description: "Add a new page to the project.",
  parameters: {
    type: "object",
    properties: {},
  },
  handler: async (_params, ctx) => {
    ctx.addPage();
    return { success: true, message: "New page added." };
  },
};

// ─── Tool: Apply project ───

const applyProjectTool: AiTool = {
  name: "apply_project",
  description: "Replace the ENTIRE design with a new <project> JSX string. This will REPLACE all pages, elements, and configuration. Use this for brand new designs or complete redesigns. For incremental changes, use apply_patch instead.",
  parameters: {
    type: "object",
    properties: {
      jsx: { type: "string", description: "The complete <project> JSX string." },
    },
    required: ["jsx"],
  },
  handler: async (params, _ctx) => {
    const jsx = String(params.jsx ?? "");
    if (!jsx) return { success: false, message: "No project JSX provided." };
    const result = applyJsxToStore(jsx);
    if (result.ok) {
      return { success: true, message: "Project applied successfully. The entire design has been replaced." };
    }
    return { success: false, message: `Failed to apply project: ${result.error}` };
  },
};

// ─── Tool: List guides ───

const listGuidesTool: AiTool = {
  name: "list_guides",
  description: "List all guides currently defined in the project. Returns each guide's ID, orientation (horizontal/vertical), position (px from top or left of page), and optional pageId scope.",
  parameters: {
    type: "object",
    properties: {
      filter: {
        type: "string",
        enum: ["all", "horizontal", "vertical"],
        description: "Optional: filter by orientation. Default: 'all'.",
      },
    },
  },
  handler: async (params, ctx) => {
    const filter = String(params.filter ?? "all");
    const guides = filter === "all"
      ? ctx.guides
      : ctx.guides.filter((g) => g.orientation === filter);
    if (guides.length === 0) return { success: true, message: "No hay guías definidas.", data: { guides: [] } };
    const summary = guides.map((g) =>
      `${g.id}: ${g.orientation} en ${g.position}px${g.pageId ? ` (página ${g.pageId})` : " (global)"}`,
    ).join("\n");
    return { success: true, message: `${guides.length} guía(s) encontrada(s):\n${summary}`, data: { guides } };
  },
};

// ─── Tool: Add guide ───

const addGuideTool: AiTool = {
  name: "add_guide",
  description: "Add a new guide line to the canvas. Vertical guides define an X-axis reference (left/right alignment). Horizontal guides define a Y-axis reference (top/bottom alignment). Position is in px from the top-left corner of the page.",
  parameters: {
    type: "object",
    properties: {
      orientation: {
        type: "string",
        enum: ["horizontal", "vertical"],
        description: "'horizontal' = a Y-position reference line. 'vertical' = an X-position reference line.",
      },
      position: {
        type: "number",
        description: "Position in px from top (horizontal) or left (vertical) of the page.",
      },
      pageIndex: {
        type: "number",
        description: "The 1-based page number to add the guide to. Will default to the active page if omitted.",
      },
      pageId: {
        type: "string",
        description: "Alternatively, the exact page ID. It is recommended to use pageIndex instead.",
      },
    },
    required: ["orientation", "position"],
  },
  handler: async (params, ctx) => {
    const orientation = String(params.orientation ?? "vertical") as "horizontal" | "vertical";
    const position = Number(params.position ?? 0);
    let pageId = ctx.activePage.id;
    if (params.pageIndex !== undefined) {
      const idx = Math.max(0, Number(params.pageIndex) - 1);
      if (ctx.pages[idx]) pageId = ctx.pages[idx].id;
    } else if (params.pageId) {
      const pidStr = String(params.pageId);
      // If AI passed "1", "2" instead of actual ID, try to resolve it
      const numericVal = parseInt(pidStr, 10);
      if (!isNaN(numericVal) && String(numericVal) === pidStr) {
        const idx = Math.max(0, numericVal - 1);
        if (ctx.pages[idx]) pageId = ctx.pages[idx].id;
      } else {
        pageId = pidStr;
      }
    }

    ctx.addGuide(position, orientation, pageId);
    return {
      success: true,
      message: `Guía ${orientation} añadida localmente en el lienzo en ${position}px y vinculada a la página ${pageId}.`,
      data: { orientation, position, pageId },
    };
  },
};

// ─── Tool: Remove guide ───

const removeGuideTool: AiTool = {
  name: "remove_guide",
  description: "Remove a guide by its ID. Use list_guides to find guide IDs.",
  parameters: {
    type: "object",
    properties: {
      guideId: { type: "string", description: "The ID of the guide to remove." },
    },
    required: ["guideId"],
  },
  handler: async (params, ctx) => {
    const id = String(params.guideId ?? "");
    const guide = ctx.guides.find((g) => g.id === id);
    if (!guide) return { success: false, message: `Guía "${id}" no encontrada.` };
    ctx.removeGuide(id);
    return { success: true, message: `Guía "${id}" eliminada.` };
  },
};

// ─── Tool: Update guide ───

const updateGuideTool: AiTool = {
  name: "update_guide",
  description: "Move an existing guide to a new position. Use list_guides to find guide IDs.",
  parameters: {
    type: "object",
    properties: {
      guideId: { type: "string", description: "The ID of the guide to update." },
      position: { type: "number", description: "New position in px from top (horizontal) or left (vertical) of the page." },
    },
    required: ["guideId", "position"],
  },
  handler: async (params, ctx) => {
    const id = String(params.guideId ?? "");
    const position = Number(params.position ?? 0);
    const guide = ctx.guides.find((g) => g.id === id);
    if (!guide) return { success: false, message: `Guía "${id}" no encontrada.` };
    ctx.updateGuidePosition(id, position);
    return {
      success: true,
      message: `Guía "${id}" movida a ${position}px.`,
      data: { guideId: id, position },
    };
  },
};

// ─── Tool: Clear guides ───

const clearGuidesTool: AiTool = {
  name: "clear_guides",
  description: "Remove all guides. Optionally restrict to only horizontal or vertical guides.",
  parameters: {
    type: "object",
    properties: {
      orientation: {
        type: "string",
        enum: ["all", "horizontal", "vertical"],
        description: "Which guides to remove. Default: 'all'.",
      },
    },
  },
  handler: async (params, ctx) => {
    const filter = String(params.orientation ?? "all");
    const toRemove = filter === "all"
      ? ctx.guides
      : ctx.guides.filter((g) => g.orientation === filter);
    if (toRemove.length === 0) return { success: true, message: "No había guías para eliminar." };
    toRemove.forEach((g) => ctx.removeGuide(g.id));
    return { success: true, message: `${toRemove.length} guía(s) eliminada(s).` };
  },
};

// ─── Tool: Snap elements to guide ───
/**
 * anchor values per orientation:
 *   vertical guide  (defines X) → "left" | "center" | "right"
 *   horizontal guide (defines Y) → "top"  | "middle" | "bottom"
 *
 * Snap math:
 *   vertical  + left   → el.x = guide.position
 *   vertical  + center → el.x = guide.position - el.width / 2
 *   vertical  + right  → el.x = guide.position - el.width
 *   horizontal + top    → el.y = guide.position
 *   horizontal + middle → el.y = guide.position - el.height / 2
 *   horizontal + bottom → el.y = guide.position - el.height
 */
const snapElementsToGuideTool: AiTool = {
  name: "snap_elements_to_guide",
  description: `Snap one or more elements to a guide with pixel-perfect precision by choosing WHICH part of the element aligns to the guide line.

For VERTICAL guides (X-axis reference):
  - anchor "left"   → element's left edge aligns to guide
  - anchor "center" → element's horizontal center aligns to guide
  - anchor "right"  → element's right edge aligns to guide

For HORIZONTAL guides (Y-axis reference):
  - anchor "top"    → element's top edge aligns to guide
  - anchor "middle" → element's vertical center aligns to guide
  - anchor "bottom" → element's bottom edge aligns to guide

Always call list_guides first to get guide IDs and positions.`,
  parameters: {
    type: "object",
    properties: {
      guideId: {
        type: "string",
        description: "ID of the guide to snap to. Use list_guides to find IDs.",
      },
      elementIds: {
        type: "array",
        items: { type: "string" },
        description: "List of element IDs to snap. Use get_canvas_state to find IDs.",
      },
      anchor: {
        type: "string",
        enum: ["left", "center", "right", "top", "middle", "bottom"],
        description: "Which reference point of the element to snap to the guide. For vertical guides use left/center/right. For horizontal guides use top/middle/bottom. Default: left for vertical, top for horizontal.",
      },
    },
    required: ["guideId", "elementIds"],
  },
  handler: async (params, ctx) => {
    const guideId = String(params.guideId ?? "");
    const anchor = String(params.anchor ?? "");
    const elementIds = (params.elementIds as string[]) ?? [];

    if (elementIds.length === 0) return { success: false, message: "Se requiere al menos un elementId." };

    const guide = ctx.guides.find((g) => g.id === guideId);
    if (!guide) return { success: false, message: `Guía "${guideId}" no encontrada. Usa list_guides para ver las IDs.` };

    const snapped: string[] = [];
    const errors: string[] = [];

    for (const id of elementIds) {
      const el = ctx.getElement(id);
      if (!el) { errors.push(`"${id}" no encontrado`); continue; }

      if (guide.orientation === "vertical") {
        // Vertical guide → controls X axis
        const resolvedAnchor = anchor || "left";
        let newX: number;
        if (resolvedAnchor === "left") {
          newX = guide.position;
        } else if (resolvedAnchor === "center") {
          newX = guide.position - el.width / 2;
        } else if (resolvedAnchor === "right") {
          newX = guide.position - el.width;
        } else {
          errors.push(`Anchor "${resolvedAnchor}" inválido para guía vertical. Usa left, center o right.`);
          continue;
        }
        ctx.updateElement(id, { x: Math.round(newX) });
        snapped.push(`"${id}" → x=${Math.round(newX)} (${resolvedAnchor} anclado a guía vertical en ${guide.position}px)`);

      } else {
        // Horizontal guide → controls Y axis
        const resolvedAnchor = anchor || "top";
        let newY: number;
        if (resolvedAnchor === "top") {
          newY = guide.position;
        } else if (resolvedAnchor === "middle") {
          newY = guide.position - el.height / 2;
        } else if (resolvedAnchor === "bottom") {
          newY = guide.position - el.height;
        } else {
          errors.push(`Anchor "${resolvedAnchor}" inválido para guía horizontal. Usa top, middle o bottom.`);
          continue;
        }
        ctx.updateElement(id, { y: Math.round(newY) });
        snapped.push(`"${id}" → y=${Math.round(newY)} (${resolvedAnchor} anclado a guía horizontal en ${guide.position}px)`);
      }
    }

    const msg = [
      snapped.length > 0 ? `✅ ${snapped.length} elemento(s) snappeado(s):\n${snapped.join("\n")}` : "",
      errors.length > 0 ? `⚠️ Errores:\n${errors.join("\n")}` : "",
    ].filter(Boolean).join("\n\n");

    return {
      success: snapped.length > 0,
      message: msg,
      data: { snapped: snapped.length, errors: errors.length },
    };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// New tools
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Tool: Create image ───

const createImageTool: AiTool = {
  name: "create_image",
  description: "Create a new image element on the canvas from a URL.",
  parameters: {
    type: "object",
    properties: {
      src: { type: "string", description: "Image URL (use https://picsum.photos/WIDTH/HEIGHT for placeholders)." },
      x: { type: "number", description: "X position (px). Default: centered." },
      y: { type: "number", description: "Y position (px). Default: 60." },
      width: { type: "number", description: "Width (px). Default: 300." },
      height: { type: "number", description: "Height (px). Default: 300." },
    },
    required: ["src"],
  },
  handler: async (params, ctx) => {
    const src = String(params.src ?? "");
    if (!src) return { success: false, message: "Image URL is required." };
    ctx.addImage(src, {
      x: params.x !== undefined ? Number(params.x) : ctx.canvasSize.width / 2 - 150,
      y: params.y !== undefined ? Number(params.y) : 60,
      width: params.width !== undefined ? Math.max(10, Number(params.width)) : 300,
      height: params.height !== undefined ? Math.max(10, Number(params.height)) : 300,
    });
    return { success: true, message: `Image created from ${src.slice(0, 60)}.` };
  },
};

// ─── Tool: Create SVG ───

const createSvgTool: AiTool = {
  name: "create_svg",
  description: "Create a new SVG element on the canvas with raw SVG markup.",
  parameters: {
    type: "object",
    properties: {
      svgContent: { type: "string", description: "Full SVG markup (e.g. '<svg ...>...</svg>')." },
      x: { type: "number", description: "X position (px). Default: centered." },
      y: { type: "number", description: "Y position (px). Default: 60." },
      width: { type: "number", description: "Width (px). Default: 300." },
      height: { type: "number", description: "Height (px). Default: 300." },
    },
    required: ["svgContent"],
  },
  handler: async (params, ctx) => {
    const svgContent = String(params.svgContent ?? "");
    if (!svgContent) return { success: false, message: "SVG content is required." };
    ctx.addSvg(svgContent, {
      x: params.x !== undefined ? Number(params.x) : ctx.canvasSize.width / 2 - 150,
      y: params.y !== undefined ? Number(params.y) : 60,
      width: params.width !== undefined ? Math.max(10, Number(params.width)) : 300,
      height: params.height !== undefined ? Math.max(10, Number(params.height)) : 300,
    });
    return { success: true, message: "SVG element created." };
  },
};

// ─── Tool: Rotate element ───

const rotateElementTool: AiTool = {
  name: "rotate_element",
  description: "Rotate an element to a specific angle in degrees (0-360).",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID to rotate." },
      angle: { type: "number", description: "Rotation angle in degrees. 0=upright, 90=clockwise quarter, -90=counter-clockwise." },
    },
    required: ["elementId", "angle"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const angle = Number(params.angle ?? 0);
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    ctx.rotateElement(id, angle);
    return { success: true, message: `Element "${id}" rotated to ${angle}°.` };
  },
};

// ─── Tool: Align elements ───

const alignElementsTool: AiTool = {
  name: "align_elements",
  description: "Align selected elements relative to each other. Requires at least 2 selected elements.",
  parameters: {
    type: "object",
    properties: {
      direction: {
        type: "string",
        enum: ["left", "center", "right", "top", "middle", "bottom"],
        description: "Alignment direction: 'left' align left edges, 'center' align horizontal centers, 'right' align right edges, 'top' align top edges, 'middle' align vertical centers, 'bottom' align bottom edges.",
      },
    },
    required: ["direction"],
  },
  handler: async (params, ctx) => {
    const dir = String(params.direction ?? "center") as "left" | "center" | "right" | "top" | "middle" | "bottom";
    ctx.alignElements(dir);
    return { success: true, message: `Elements aligned to ${dir}.` };
  },
};

// ─── Tool: Distribute elements ───

const distributeElementsTool: AiTool = {
  name: "distribute_elements",
  description: "Distribute selected elements evenly. Requires at least 3 selected elements.",
  parameters: {
    type: "object",
    properties: {
      direction: {
        type: "string",
        enum: ["horizontal", "vertical"],
        description: "'horizontal' = distribute X positions evenly (spacing). 'vertical' = distribute Y positions evenly.",
      },
    },
    required: ["direction"],
  },
  handler: async (params, ctx) => {
    const dir = String(params.direction ?? "horizontal") as "horizontal" | "vertical";
    ctx.distributeElements(dir);
    return { success: true, message: `Elements distributed ${dir}ly.` };
  },
};

// ─── Tool: Group elements ───

const groupElementsTool: AiTool = {
  name: "group_elements",
  description: "Group selected elements together so they move/resize as a unit. Requires at least 2 selected elements.",
  parameters: { type: "object", properties: {} },
  handler: async (_params, ctx) => {
    ctx.groupSelected();
    return { success: true, message: "Selected elements grouped." };
  },
};

// ─── Tool: Ungroup elements ───

const ungroupElementsTool: AiTool = {
  name: "ungroup_elements",
  description: "Ungroup the currently selected grouped elements so they can be edited independently.",
  parameters: { type: "object", properties: {} },
  handler: async (_params, ctx) => {
    ctx.ungroupSelected();
    return { success: true, message: "Selected elements ungrouped." };
  },
};

// ─── Tool: Reorder element (z-index) ───

const reorderElementTool: AiTool = {
  name: "reorder_element",
  description: "Change the z-order (stacking order) of an element. Options: 'front' = bring to front (top of stack), 'back' = send to back (bottom), 'forward' = bring one step up, 'backward' = send one step down.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID to reorder." },
      position: {
        type: "string",
        enum: ["front", "back", "forward", "backward"],
        description: "'front' = bring to very top, 'back' = send to very bottom, 'forward' = move up one layer, 'backward' = move down one layer.",
      },
    },
    required: ["elementId", "position"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const pos = String(params.position ?? "front");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    if (pos === "front") ctx.bringToFront(id);
    else if (pos === "back") ctx.sendToBack(id);
    else if (pos === "forward") ctx.bringForward(id);
    else if (pos === "backward") ctx.sendBackward(id);
    else return { success: false, message: `Unknown position "${pos}". Use front/back/forward/backward.` };
    return { success: true, message: `Element "${id}" moved to ${pos}.` };
  },
};

// ─── Tool: Undo ───

const undoTool: AiTool = {
  name: "undo",
  description: "Undo the last action. Restores the previous state from the undo history.",
  parameters: { type: "object", properties: {} },
  handler: async (_params, ctx) => {
    ctx.undo();
    return { success: true, message: "Undo applied." };
  },
};

// ─── Tool: Redo ───

const redoTool: AiTool = {
  name: "redo",
  description: "Redo the last undone action. Restores the next state from the redo history.",
  parameters: { type: "object", properties: {} },
  handler: async (_params, ctx) => {
    ctx.redo();
    return { success: true, message: "Redo applied." };
  },
};

// ─── Tool: Select all ───

const selectAllTool: AiTool = {
  name: "select_all",
  description: "Select ALL elements on the current page. Equivalent to Ctrl+A.",
  parameters: { type: "object", properties: {} },
  handler: async (_params, ctx) => {
    ctx.selectAll();
    return { success: true, message: `All ${ctx.elementCount} elements selected.` };
  },
};

// ─── Tool: Clear selection ───

const clearSelectionTool: AiTool = {
  name: "clear_selection",
  description: "Deselect all currently selected elements.",
  parameters: { type: "object", properties: {} },
  handler: async (_params, ctx) => {
    ctx.clearSelection();
    return { success: true, message: "Selection cleared." };
  },
};

// ─── Tool: Duplicate selected ───

const duplicateSelectedTool: AiTool = {
  name: "duplicate_selected",
  description: "Duplicate all currently selected elements. Copies are offset by 20px.",
  parameters: { type: "object", properties: {} },
  handler: async (_params, ctx) => {
    ctx.duplicateSelected();
    return { success: true, message: "Selected elements duplicated." };
  },
};

// ─── Tool: Remove page ───

const removePageTool: AiTool = {
  name: "remove_page",
  description: "Remove a page from the project by its index (1-based). Cannot remove the last remaining page.",
  parameters: {
    type: "object",
    properties: {
      pageIndex: { type: "number", description: "Page index (1-based). Default: active page." },
    },
  },
  handler: async (params, ctx) => {
    const pages = ctx.pages;
    if (pages.length <= 1) return { success: false, message: "Cannot remove the last page." };
    let targetId: string | undefined;
    if (params.pageIndex !== undefined) {
      const idx = Math.max(0, Number(params.pageIndex) - 1);
      targetId = pages[idx]?.id;
    } else {
      targetId = ctx.activePage.id;
    }
    if (!targetId) return { success: false, message: "Page not found." };
    ctx.removePage(targetId);
    return { success: true, message: `Page removed.` };
  },
};

// ─── Tool: Set active page ───

const setActivePageTool: AiTool = {
  name: "set_active_page",
  description: "Switch the active/visible page by index (1-based).",
  parameters: {
    type: "object",
    properties: {
      pageIndex: { type: "number", description: "Page index (1-based) to switch to." },
    },
    required: ["pageIndex"],
  },
  handler: async (params, ctx) => {
    const idx = Number(params.pageIndex ?? 1) - 1;
    if (idx < 0 || idx >= ctx.pages.length) {
      return { success: false, message: `Page index ${idx + 1} out of range. Available: 1-${ctx.pages.length}.` };
    }
    ctx.setActivePage(idx);
    return { success: true, message: `Switched to page ${idx + 1}: "${ctx.pages[idx].name}".` };
  },
};

// ─── Tool: New project ───

const newProjectTool: AiTool = {
  name: "new_project",
  description: "⚠️ DESTRUCTIVE: Create a brand new blank project, discarding ALL current work. A single blank page will be created.",
  parameters: { type: "object", properties: {} },
  handler: async (_params, ctx) => {
    ctx.newProject();
    return { success: true, message: "New blank project created." };
  },
};

// ─── Tool: Copy styles ───

const copyStylesTool: AiTool = {
  name: "copy_styles",
  description: "Copy all stylable properties (colors, fonts, borders, shadows, effects) from the currently selected element to the internal clipboard.",
  parameters: { type: "object", properties: {} },
  handler: async (_params, ctx) => {
    ctx.copyStyles();
    return { success: true, message: "Styles copied from selected element." };
  },
};

// ─── Tool: Paste styles ───

const pasteStylesTool: AiTool = {
  name: "paste_styles",
  description: "Paste previously copied styles onto all currently selected elements. Requires a prior copy_styles call and at least one selected target element.",
  parameters: { type: "object", properties: {} },
  handler: async (_params, ctx) => {
    ctx.pasteStyles();
    return { success: true, message: "Styles pasted to selected elements." };
  },
};

// ─── Tool: Set blend mode ───

const setBlendModeTool: AiTool = {
  name: "set_blend_mode",
  description: "Set the CSS mix-blend-mode for an element. Controls how the element visually blends with elements below it.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID." },
      blendMode: {
        type: "string",
        enum: ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion"],
        description: "CSS mix-blend-mode value. 'normal' = no blending.",
      },
    },
    required: ["elementId", "blendMode"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const mode = String(params.blendMode ?? "normal");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    ctx.updateElement(id, { mixBlendMode: mode });
    return { success: true, message: `Blend mode of "${id}" set to "${mode}".` };
  },
};

// ─── Tool: Toggle lock ───

const toggleLockTool: AiTool = {
  name: "toggle_lock",
  description: "Lock or unlock an element. Locked elements cannot be moved, resized, or selected on the canvas.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID to lock/unlock." },
      locked: { type: "boolean", description: "true = lock the element, false = unlock it." },
    },
    required: ["elementId", "locked"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const locked = params.locked === true;
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    ctx.updateElement(id, { locked });
    return { success: true, message: `Element "${id}" ${locked ? "locked" : "unlocked"}.` };
  },
};

// ─── Tool: Toggle visibility ───

const toggleVisibilityTool: AiTool = {
  name: "toggle_visibility",
  description: "Show or hide an element. Hidden elements are invisible on the canvas but still exist in the project.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID to show/hide." },
      hidden: { type: "boolean", description: "true = hide the element, false = show it." },
    },
    required: ["elementId", "hidden"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const hidden = params.hidden === true;
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    ctx.updateElement(id, { hidden });
    return { success: true, message: `Element "${id}" ${hidden ? "hidden" : "shown"}.` };
  },
};

// ─── Tool: Flip element ───

const flipElementTool: AiTool = {
  name: "flip_element",
  description: "Flip an element horizontally (mirror left↔right), vertically (mirror top↔bottom), or both.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID to flip." },
      flipH: { type: "boolean", description: "Flip horizontally (left↔right mirror). Default: false." },
      flipV: { type: "boolean", description: "Flip vertically (top↔bottom mirror). Default: false." },
    },
    required: ["elementId"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    const flipH = params.flipH !== undefined ? params.flipH === true : (el.flipH ?? false);
    const flipV = params.flipV !== undefined ? params.flipV === true : (el.flipV ?? false);
    ctx.updateElement(id, { flipH, flipV });
    const dirs = [flipH ? "H" : "", flipV ? "V" : ""].filter(Boolean).join("+") || "none";
    return { success: true, message: `Element "${id}" flipped (${dirs}).` };
  },
};

// ─── Tool: Set shadow ───

const setShadowTool: AiTool = {
  name: "set_shadow",
  description: "Set the drop shadow properties for an element (box shadow for shapes/images, text shadow for text elements). Use offsets of 0 for a glow/neon effect.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID." },
      shadowColor: { type: "string", description: "Shadow color (hex, e.g. #000000 or rgba(...)). Use 'none' to remove shadow." },
      shadowBlur: { type: "number", description: "Blur radius in px. 0 = hard shadow. Higher = softer. Default: 10." },
      shadowOffsetX: { type: "number", description: "Horizontal offset in px. Positive = right. Default: 0." },
      shadowOffsetY: { type: "number", description: "Vertical offset in px. Positive = down. Default: 4." },
    },
    required: ["elementId"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    if (params.shadowColor === "none" || params.shadowColor === undefined && params.shadowBlur === undefined && params.shadowOffsetX === undefined && params.shadowOffsetY === undefined) {
      ctx.updateElement(id, { shadowColor: undefined, shadowBlur: undefined, shadowOffsetX: undefined, shadowOffsetY: undefined });
      return { success: true, message: `Shadow removed from "${id}".` };
    }
    const updates: Partial<DesignElement> = {};
    if (params.shadowColor !== undefined) updates.shadowColor = String(params.shadowColor);
    if (params.shadowBlur !== undefined) updates.shadowBlur = Number(params.shadowBlur);
    if (params.shadowOffsetX !== undefined) updates.shadowOffsetX = Number(params.shadowOffsetX);
    if (params.shadowOffsetY !== undefined) updates.shadowOffsetY = Number(params.shadowOffsetY);
    ctx.updateElement(id, updates);
    return { success: true, message: `Shadow updated on "${id}".` };
  },
};

// ─── Tool: Set border ───

const setBorderTool: AiTool = {
  name: "set_border",
  description: "Set border properties on a shape element: color, width, style, and individual corner radii.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID." },
      borderColor: { type: "string", description: "Border color (hex, e.g. #ffffff). Use 'none' to remove border." },
      borderWidth: { type: "number", description: "Border width in px (0 = no border). Default: 2." },
      borderStyle: { type: "string", enum: ["solid", "dashed", "dotted"], description: "Border line style. Default: 'solid'." },
      borderRadius: { type: "number", description: "Border radius in px for ALL corners. Default: 0." },
      borderRadiusTL: { type: "number", description: "Top-left corner radius (overrides borderRadius)." },
      borderRadiusTR: { type: "number", description: "Top-right corner radius." },
      borderRadiusBR: { type: "number", description: "Bottom-right corner radius." },
      borderRadiusBL: { type: "number", description: "Bottom-left corner radius." },
    },
    required: ["elementId"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    if (params.borderColor === "none") {
      ctx.updateElement(id, { borderColor: "transparent", borderWidth: 0 });
      return { success: true, message: `Border removed from "${id}".` };
    }
    const updates: Partial<DesignElement> = {};
    if (params.borderColor !== undefined) updates.borderColor = String(params.borderColor);
    if (params.borderWidth !== undefined) updates.borderWidth = Number(params.borderWidth);
    if (params.borderStyle !== undefined) updates.borderStyle = params.borderStyle as "solid" | "dashed" | "dotted";
    if (params.borderRadius !== undefined) updates.borderRadius = Number(params.borderRadius);
    if (params.borderRadiusTL !== undefined) updates.borderRadiusTL = Number(params.borderRadiusTL);
    if (params.borderRadiusTR !== undefined) updates.borderRadiusTR = Number(params.borderRadiusTR);
    if (params.borderRadiusBR !== undefined) updates.borderRadiusBR = Number(params.borderRadiusBR);
    if (params.borderRadiusBL !== undefined) updates.borderRadiusBL = Number(params.borderRadiusBL);
    ctx.updateElement(id, updates);
    return { success: true, message: `Border updated on "${id}".` };
  },
};

// ─── Tool: Set auto layout ───

const setAutoLayoutTool: AiTool = {
  name: "set_auto_layout",
  description: "Configure Auto Layout on an element (flexbox-like layout for its children). Controls direction, gap, padding, alignment, justification, and wrap.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID (should have child elements with parentId set)." },
      direction: { type: "string", enum: ["row", "column"], description: "Layout direction. 'row' = horizontal, 'column' = vertical." },
      gap: { type: "number", description: "Spacing between child elements in px. Default: 10." },
      padding: { type: "number", description: "Padding inside the layout container in px. Default: 0." },
      align: { type: "string", enum: ["flex-start", "center", "flex-end", "stretch"], description: "Cross-axis alignment. Default: 'center'." },
      justify: { type: "string", enum: ["flex-start", "center", "flex-end", "space-between", "space-around"], description: "Main-axis justification. Default: 'center'." },
      wrap: { type: "boolean", description: "Whether children should wrap to next line. Default: false." },
    },
    required: ["elementId"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    const layout = {
      direction: (params.direction as "row" | "column") ?? el.layout?.direction ?? "row",
      gap: params.gap !== undefined ? Number(params.gap) : (el.layout?.gap ?? 10),
      padding: params.padding !== undefined ? Number(params.padding) : (el.layout?.padding ?? 0),
      align: (params.align as "flex-start" | "center" | "flex-end" | "stretch") ?? el.layout?.align ?? "center",
      justify: (params.justify as "flex-start" | "center" | "flex-end" | "space-between" | "space-around") ?? el.layout?.justify ?? "center",
      wrap: params.wrap !== undefined ? params.wrap === true : (el.layout?.wrap ?? false),
    };
    ctx.updateElement(id, { layout });
    return { success: true, message: `Auto layout set on "${id}": ${layout.direction}, gap=${layout.gap}.` };
  },
};

// ─── Tool: Set clip mask ───

const setClipMaskTool: AiTool = {
  name: "set_clip_mask",
  description: "Apply a CSS clip-path to an element. Common presets: 'circle:50% at center', 'ellipse:50% 50% at center', 'polygon:50% 0%, 100% 100%, 0% 100%' (triangle), 'polygon:50% 0%, 100% 100%, 0% 100%' (hexagon), 'inset:10% 5%'. Use 'none' to remove.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element ID." },
      clipMask: {
        type: "string",
        description: "CSS clip-path value in format 'type:value'. E.g. 'circle:50% at center', 'polygon:50% 0%, 100% 100%, 0% 100%'. Use 'none' to remove.",
      },
    },
    required: ["elementId", "clipMask"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const raw = String(params.clipMask ?? "none");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    if (raw === "none") {
      ctx.updateElement(id, { clipMask: undefined });
      return { success: true, message: `Clip mask removed from "${id}".` };
    }
    const colonIdx = raw.indexOf(":");
    const clipMask = colonIdx !== -1
      ? { type: raw.slice(0, colonIdx) as any, value: raw.slice(colonIdx + 1) }
      : { type: "circle", value: raw };
    ctx.updateElement(id, { clipMask });
    return { success: true, message: `Clip mask set on "${id}": ${raw}.` };
  },
};

// ─── Tool: Export project ───

const exportProjectTool: AiTool = {
  name: "export_project",
  description: "Export the current page as a PNG image and trigger a download. Use render_preview first to see the result visually.",
  parameters: {
    type: "object",
    properties: {
      format: { type: "string", enum: ["png", "jpg"], description: "Export format. 'png' for transparent background support. Default: 'png'." },
      scale: { type: "number", description: "Export scale. 1=normal, 2=2x quality. Default: 2." },
      pageIndex: { type: "number", description: "1-based page index to export. Default: active page (1)." },
      filename: { type: "string", description: "Optional filename (without extension). Default: 'design-export'." },
    },
  },
  handler: async (params, _ctx) => {
    try {
      const format = params.format === "jpg" ? "jpg" : "png" as "png" | "jpg";
      const scale = Math.max(1, Math.min(4, Number(params.scale ?? 2)));
      const pageIndex = params.pageIndex !== undefined ? Number(params.pageIndex) - 1 : 0;
      const filename = String(params.filename ?? "design-export");

      const canvasRoot = document.querySelector<HTMLElement>('[data-canvas-root="true"]');
      if (!canvasRoot) return { success: false, message: "Canvas element not found." };

      const pageEls = canvasRoot.querySelectorAll<HTMLElement>("[data-page]");
      if (pageEls.length === 0) return { success: false, message: "No pages found." };
      if (pageIndex < 0 || pageIndex >= pageEls.length) {
        return { success: false, message: `Page index ${pageIndex + 1} out of range. Available: 1-${pageEls.length}.` };
      }

      const dataUrl = await capturePageAsDataUrl(pageEls[pageIndex], format, scale);

      // Trigger download
      const link = document.createElement("a");
      link.download = `${filename}.${format}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, message: `Page ${pageIndex + 1} exported as ${format.toUpperCase()} (${scale}x).` };
    } catch (e: any) {
      return { success: false, message: `Export failed: ${e.message}` };
    }
  },
};

// ─── Tool: Crop image ───

const cropImageTool: AiTool = {
  name: "crop_image",
  description: "Set the crop region on an image element. Defines which portion of the source image is visible.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Image element ID." },
      cropX: { type: "number", description: "X offset of the crop window from the image left edge (px)." },
      cropY: { type: "number", description: "Y offset of the crop window from the image top edge (px)." },
      cropW: { type: "number", description: "Width of the crop window (px)." },
      cropH: { type: "number", description: "Height of the crop window (px)." },
      reset: { type: "boolean", description: "Set to true to remove the crop and show the full image." },
    },
    required: ["elementId"],
  },
  handler: async (params, ctx) => {
    const id = String(params.elementId ?? "");
    const el = ctx.getElement(id);
    if (!el) return { success: false, message: `Element "${id}" not found.` };
    if (el.type !== "image") return { success: false, message: `Element "${id}" is not an image.` };
    if (params.reset === true) {
      ctx.updateElement(id, { cropX: undefined, cropY: undefined, cropW: undefined, cropH: undefined });
      return { success: true, message: `Crop removed from "${id}".` };
    }
    const updates: Partial<DesignElement> = {};
    if (params.cropX !== undefined) updates.cropX = Number(params.cropX);
    if (params.cropY !== undefined) updates.cropY = Number(params.cropY);
    if (params.cropW !== undefined) updates.cropW = Number(params.cropW);
    if (params.cropH !== undefined) updates.cropH = Number(params.cropH);
    ctx.updateElement(id, updates);
    return { success: true, message: `Crop updated on "${id}".` };
  },
};

// ─── Tool: Set zoom ───

const setZoomTool: AiTool = {
  name: "set_zoom",
  description: "Set the canvas zoom level. 1.0 = 100%, 0.5 = 50%, 2.0 = 200%. Use 'fit' to center all elements on the canvas.",
  parameters: {
    type: "object",
    properties: {
      zoom: { type: "number", description: "Zoom level (0.1 to 5.0). 1.0 = 100%." },
      fit: { type: "boolean", description: "Set to true to auto-fit/center all elements (ignores zoom param)." },
    },
  },
  handler: async (params, ctx) => {
    const store = useEditorStore.getState();
    if (params.fit === true) {
      if (ctx.elementCount === 0) {
        store.setPan(0, 0);
        return { success: true, message: "Canvas centered (no elements to fit)." };
      }
      store.centerOnElements();
      return { success: true, message: `Canvas zoomed to fit ${ctx.elementCount} elements.` };
    }
    if (params.zoom === undefined) return { success: false, message: "Provide a zoom value (0.1-5.0) or set fit=true." };
    const z = Math.max(0.1, Math.min(5, Number(params.zoom)));
    store.setZoom(z);
    return { success: true, message: `Zoom set to ${z.toFixed(1)}x (${Math.round(z * 100)}%).` };
  },
};

// ─── Tool: Set page background (bgLayers) ───

const setPageBackgroundTool: AiTool = {
  name: "set_page_background",
  description: "Set the background of a page using CSS background syntax for complex backgrounds (mesh gradients, patterns, noise). The CSS is auto-converted to the editor's layer system.",
  parameters: {
    type: "object",
    properties: {
      pageIndex: { type: "number", description: "Page index (1-based). Default: active page." },
      bgStyle: { type: "string", description: "CSS background string. Supports multiple layers separated by comma. E.g. 'radial-gradient(ellipse at 20% 50%, rgba(102,126,234,0.3) 0%, transparent 50%), #1a1a2e' for mesh gradients." },
      bgColor: { type: "string", description: "Background color hex (e.g. #1a1a2e). Use when no complex CSS is needed." },
    },
  },
  handler: async (params, ctx) => {
    const pages = ctx.pages;
    const pageIndex = params.pageIndex !== undefined ? Math.max(0, Number(params.pageIndex) - 1) : 0;
    if (pageIndex < 0 || pageIndex >= pages.length) {
      return { success: false, message: `Page index ${pageIndex + 1} out of range. Available: 1-${pages.length}.` };
    }
    const page = pages[pageIndex];
    const updates: Partial<Page> = {};
    if (params.bgStyle !== undefined) {
      const layers = cssBackgroundToLayers(String(params.bgStyle));
      if (layers.length > 0) updates.bgLayers = layers;
    }
    if (params.bgColor !== undefined) updates.bgColor = String(params.bgColor);
    if (Object.keys(updates).length === 0) return { success: false, message: "Provide bgStyle, bgColor, or both." };
    ctx.updatePage(page.id, updates);
    return { success: true, message: `Page ${pageIndex + 1} background updated.` };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Export all tools
// ═══════════════════════════════════════════════════════════════════════════════

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
  applyPatchTool,
  updatePageTool,
  addPageTool,
  applyProjectTool,
  // ─── Guide tools ───
  listGuidesTool,
  addGuideTool,
  removeGuideTool,
  updateGuideTool,
  clearGuidesTool,
  snapElementsToGuideTool,
  // ─── New tools ───
  createImageTool,
  createSvgTool,
  rotateElementTool,
  alignElementsTool,
  distributeElementsTool,
  groupElementsTool,
  ungroupElementsTool,
  reorderElementTool,
  undoTool,
  redoTool,
  selectAllTool,
  clearSelectionTool,
  duplicateSelectedTool,
  removePageTool,
  setActivePageTool,
  newProjectTool,
  copyStylesTool,
  pasteStylesTool,
  setBlendModeTool,
  toggleLockTool,
  toggleVisibilityTool,
  flipElementTool,
  setShadowTool,
  setBorderTool,
  setAutoLayoutTool,
  setClipMaskTool,
  exportProjectTool,
  cropImageTool,
  setZoomTool,
  setPageBackgroundTool,
];
