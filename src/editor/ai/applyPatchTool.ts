/**
 * applyPatchTool.ts
 *
 * Extremely robust <patch> XML handler with per-operation logging,
 * validation, and detailed error messages.
 *
 * The patch XML format:
 *   <patch>
 *     <delete id="..." />
 *     <add> ...element JSX... </add>
 *     <page id="..." bgColor="..." />
 *     <edit id="..." attr="val" ... />
 *     <editText id="...">New text content</editText>
 *   </patch>
 */

import type { AiTool, AiContext } from "./aiToolTypes";
import { useEditorStore } from "../store/editorStore";
import { cssBackgroundToLayers } from "../utils/cssBackgroundParser";
import { parseJsx, normalizeTextLines } from "../utils/jsxParser";
import { getRequiredTextHeight } from "../utils/textMeasure";
import { getAllNumericAttrs, getAllBooleanAttrs, getEnumValues, validateAttr as validateBehaviorAttr } from "../../core/behaviors/BehaviorRegistry";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatchOperation {
  tag: string;
  id?: string;
  status: "ok" | "warn" | "error";
  message: string;
  snippet?: string;
}

interface PatchResult {
  ok: boolean;
  error?: string;
  warnings?: string[];
  operations: PatchOperation[];
}

// ─── Known attribute schemas ──────────────────────────────────────────────────
// Element-level attributes are defined in each Behavior's attrSchema.
// Aggregates are fetched from BehaviorRegistry. Config/page-level attrs
// that aren't tied to an element type are defined here.
const PAGE_NUMERIC_ATTRS = new Set(["pageGap", "gridSize", "gap", "padding"]);
const PAGE_BOOLEAN_ATTRS = new Set(["showGrid", "snapToGrid", "showRulers"]);

const KNOWN_LAYOUT_DIRECTIONS = new Set(["row", "column"]);
const KNOWN_ALIGN_VALUES = new Set(["flex-start", "center", "flex-end", "stretch"]);
const KNOWN_JUSTIFY_VALUES = new Set(["flex-start", "center", "flex-end", "space-between", "space-around"]);

/** Validate a single attribute value and return a parsed value or error */
function validateAttr(
  key: string, val: string, tagName: string,
  elementType?: string | null,
): { valid: true; value: any } | { valid: false; error: string } {
  // ── Element-level attrs (delegated to BehaviorRegistry) ──────────────────
  if (elementType) {
    const result = validateBehaviorAttr(elementType as any, key, val, tagName);
    if (!result.valid) return result;
    // Numeric validation passed — skip remaining checks
    if (typeof result.value === "number") return result;
    // Boolean validation passed
    if (typeof result.value === "boolean") return result;
  } else {
    // When no element type context, check against all aggregated schemas
    const allNumeric = getAllNumericAttrs();
    const allBoolean = getAllBooleanAttrs();

    if (val === "" && allNumeric.has(key)) {
      return { valid: false, error: `attribute "${key}" in <${tagName}> has empty value` };
    }

    if (allNumeric.has(key)) {
      const n = parseFloat(val);
      if (isNaN(n)) return { valid: false, error: `attribute "${key}"="${val}" in <${tagName}> is not a valid number` };
      if (key === "opacity" && (n < 0 || n > 1)) return { valid: false, error: `opacity must be between 0 and 1, got ${n}` };
      if ((key === "w" || key === "width" || key === "h" || key === "height" || key === "fontSize") && n <= 0) {
        return { valid: false, error: `"${key}" must be > 0, got ${n}` };
      }
      return { valid: true, value: n };
    }

    if (allBoolean.has(key)) {
      if (val !== "true" && val !== "false") {
        return { valid: false, error: `attribute "${key}"="${val}" in <${tagName}> must be "true" or "false"` };
      }
      return { valid: true, value: val === "true" };
    }

    // Enum validation from all behaviors
    const enumVals = getEnumValues(key);
    if (enumVals) {
      if (!enumVals.has(val)) {
        return { valid: false, error: `"${key}" must be one of: ${[...enumVals].join(", ")}, got "${val}"` };
      }
      return { valid: true, value: val };
    }
  }

  // ── Config/page-level attrs ──────────────────────────────────────────────
  if (PAGE_NUMERIC_ATTRS.has(key)) {
    const n = parseFloat(val);
    if (isNaN(n)) return { valid: false, error: `attribute "${key}"="${val}" in <${tagName}> is not a valid number` };
    return { valid: true, value: n };
  }
  if (PAGE_BOOLEAN_ATTRS.has(key)) {
    if (val !== "true" && val !== "false") {
      return { valid: false, error: `attribute "${key}"="${val}" in <${tagName}> must be "true" or "false"` };
    }
    return { valid: true, value: val === "true" };
  }

  // ── Layout enums ─────────────────────────────────────────────────────────
  if (key === "direction") {
    if (!KNOWN_LAYOUT_DIRECTIONS.has(val)) return { valid: false, error: `layout direction must be one of: ${[...KNOWN_LAYOUT_DIRECTIONS].join(", ")}, got "${val}"` };
    return { valid: true, value: val };
  }
  if (key === "align") {
    if (!KNOWN_ALIGN_VALUES.has(val)) return { valid: false, error: `align must be one of: ${[...KNOWN_ALIGN_VALUES].join(", ")}, got "${val}"` };
    return { valid: true, value: val };
  }
  if (key === "justify") {
    if (!KNOWN_JUSTIFY_VALUES.has(val)) return { valid: false, error: `justify must be one of: ${[...KNOWN_JUSTIFY_VALUES].join(", ")}, got "${val}"` };
    return { valid: true, value: val };
  }

  // ── Special JSON/parse values ────────────────────────────────────────────
  if (key === "textShadows") {
    try { return { valid: true, value: JSON.parse(val) }; }
    catch { return { valid: false, error: `textShadows is not valid JSON: "${val.slice(0, 80)}"` }; }
  }
  if (key === "bgLayers") {
    try { return { valid: true, value: JSON.parse(val) }; }
    catch { return { valid: false, error: `bgLayers is not valid JSON: "${val.slice(0, 80)}"` }; }
  }
  if (key.endsWith("Colors") && val) {
    return { valid: true, value: val.split(",").map((s: string) => s.trim()) };
  }
  if (key === "clipMask" && val) {
    const idx = val.indexOf(":");
    if (idx === -1) return { valid: false, error: `clipMask must be in "type:value" format, got "${val}"` };
    return { valid: true, value: { type: val.slice(0, idx), value: val.slice(idx + 1) } };
  }
  if (key === "bgStyle") {
    return { valid: true, value: val };
  }

  // Default: pass through as string
  return { valid: true, value: val };
}

// ─── XML parsing ──────────────────────────────────────────────────────────────

function patchId(el: Element): string | null {
  return el.getAttribute("id") || el.getAttribute("elementId");
}

function parsePatchXml(xml: string): { doc: Document | null; error?: string } {
  try {
    const doc = new DOMParser().parseFromString(`<div id="__patch_root">${xml}</div>`, "text/html");
    return { doc };
  } catch (e: any) {
    return { doc: null, error: `XML parse error: ${e.message}` };
  }
}

// ─── Operation helpers ────────────────────────────────────────────────────────

function getElementSnippet(child: Element, maxLen = 120): string {
  const outer = child.outerHTML;
  return outer.length > maxLen ? outer.slice(0, maxLen) + "..." : outer;
}

// ─── Main patch application ───────────────────────────────────────────────────

export function applyPatch(xml: string): PatchResult {
  const operations: PatchOperation[] = [];

  // ── Parse ────────────────────────────────────────────────────────────────
  const { doc, error: parseError } = parsePatchXml(xml);
  if (!doc || parseError) {
    return { ok: false, error: parseError ?? "Unknown parse error", operations };
  }

  const root = doc.querySelector("#__patch_root")?.firstElementChild;
  if (!root || root.tagName.toLowerCase() !== "patch") {
    return {
      ok: false,
      error: 'Root tag must be <patch>. Got: <' + (root?.tagName?.toLowerCase() ?? 'none') + '>',
      operations: [{ tag: "patch", status: "error", message: `Expected <patch> root, got <${root?.tagName?.toLowerCase() ?? "none"}>`, snippet: xml.slice(0, 100) }],
    };
  }

  const store = useEditorStore.getState();
  const updateElement = store.updateElement;
  const addElement = store.addElement;
  const updatePage = store.updatePage;
  const children = Array.from(root.children);

  if (children.length === 0) {
    return { ok: false, error: "<patch> is empty — no operations to perform.", operations };
  }

  // ── Process each child ───────────────────────────────────────────────────
  for (const child of children) {
    const tag = child.tagName.toLowerCase();
    const snippet = getElementSnippet(child);

    // ── <delete> ────────────────────────────────────────────────────────────
    if (tag === "delete") {
      const id = patchId(child);
      if (!id) {
        operations.push({ tag, status: "error", message: "Missing id or elementId attribute on <delete>", snippet });
        continue;
      }
      const el = useEditorStore.getState().elements.find((e) => e.id === id);
      if (!el) {
        operations.push({ tag, status: "error", message: `Element "${id}" not found — cannot delete`, snippet });
        continue;
      }
      useEditorStore.setState((s) => ({
        elements: s.elements.filter((e) => e.id !== id),
        selectedIds: s.selectedIds.filter((sel) => sel !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      }));
      operations.push({ tag, id, status: "ok", message: `Deleted element "${id}" (${el.type})`, snippet });
      continue;
    }

    // ── <add> ───────────────────────────────────────────────────────────────
    if (tag === "add") {
      const inner = child.innerHTML.trim();
      if (!inner) {
        operations.push({ tag, status: "error", message: "<add> block is empty", snippet });
        continue;
      }
      const wrapper = inner.startsWith("<page")
        ? `<project>${inner}</project>`
        : `<project><page width="1080" height="1920">${inner}</page></project>`;

      const result = parseJsx(wrapper);
      if (!result.ok) {
        operations.push({ tag, status: "error", message: `Parse error: ${result.error}`, snippet });
        continue;
      }

      // Check for duplicate IDs before adding
      const existingIds = new Set(useEditorStore.getState().elements.map((e) => e.id));
      const duplicates = result.data.elements.filter((e) => existingIds.has(e.id));
      if (duplicates.length > 0) {
        operations.push({
          tag, status: "warn",
          message: `${duplicates.length} element(s) have IDs that already exist: ${duplicates.map((d) => d.id).join(", ")}. They will be regenerated.`,
          snippet,
        });
      }

      if (inner.startsWith("<page")) {
        for (const p of result.data.pages) {
          useEditorStore.setState((s) => {
            const newPages = [...s.pages, p];
            return { pages: newPages, activePageIndex: newPages.length - 1, canvasWidth: p.width, canvasHeight: p.height, canvasBgColor: p.bgColor };
          });
        }
        operations.push({ tag, status: "ok", message: `Added ${result.data.pages.length} page(s)`, snippet });
      }

      let addedCount = 0;
      for (const el of result.data.elements) {
        if (el.type === "text") {
          const h = getRequiredTextHeight(el);
          if (h !== null) el.height = h;
        }
        addElement(el);
        addedCount++;
      }
      if (addedCount > 0) {
        operations.push({ tag, status: "ok", message: `Added ${addedCount} element(s)`, snippet });
      }
      continue;
    }

    // ── <page> ──────────────────────────────────────────────────────────────
    if (tag === "page") {
      const currentPages = useEditorStore.getState().pages;
      const currentPageIndex = useEditorStore.getState().activePageIndex;
      const id = patchId(child) || currentPages[currentPageIndex]?.id;
      if (!id) {
        operations.push({ tag, status: "error", message: "No valid page ID found to update", snippet });
        continue;
      }
      const pageExists = currentPages.find((p) => p.id === id);
      if (!pageExists) {
        operations.push({ tag, status: "error", message: `Page "${id}" not found`, snippet });
        continue;
      }

      const pagePartial: Record<string, any> = {};
      let hasErrors = false;
      for (const attr of Array.from(child.attributes)) {
        const key = attr.name;
        const val = attr.value;
        if (key === "id" || key === "elementId") continue;

        if (key === "w" || key === "width") {
          const n = parseFloat(val);
          if (isNaN(n)) { operations.push({ tag, status: "error", message: `Invalid page width "${val}"`, snippet }); hasErrors = true; continue; }
          pagePartial.width = n;
          continue;
        }
        if (key === "h" || key === "height") {
          const n = parseFloat(val);
          if (isNaN(n)) { operations.push({ tag, status: "error", message: `Invalid page height "${val}"`, snippet }); hasErrors = true; continue; }
          pagePartial.height = n;
          continue;
        }
        if (key === "bgStyle") {
          const layers = cssBackgroundToLayers(val);
          if (layers.length > 0) pagePartial.bgLayers = layers;
          continue;
        }
        if (key === "bgColor") {
          if (!val.startsWith("#") && !val.startsWith("rgba") && !val.startsWith("rgb(")) {
            operations.push({ tag, status: "warn", message: `bgColor "${val}" may not be a valid color (expected hex or rgb)`, snippet });
          }
          pagePartial.bgColor = val;
          continue;
        }
        pagePartial[key] = val;
      }

      if (hasErrors) continue;
      if (Object.keys(pagePartial).length > 0) {
        updatePage(id, pagePartial);
        operations.push({ tag, id, status: "ok", message: `Page "${id}" updated: ${Object.keys(pagePartial).join(", ")}`, snippet });
      } else {
        operations.push({ tag, id, status: "warn", message: `Page "${id}" — no valid attributes to update`, snippet });
      }
      continue;
    }

    // ── <edit> / <editText> ─────────────────────────────────────────────────
    if (tag === "edit" || tag === "edittext") {
      const id = patchId(child);
      if (!id) {
        operations.push({ tag, status: "error", message: `Missing id/elementId attribute on <${tag}>`, snippet });
        continue;
      }
      const existingElements = useEditorStore.getState().elements;
      const existing = existingElements.find((e) => e.id === id);
      if (!existing) {
        operations.push({ tag, id, status: "error", message: `Element "${id}" not found. Available IDs: ${existingElements.slice(0, 5).map((e) => e.id).join(", ")}${existingElements.length > 5 ? "..." : ""}`, snippet });
        continue;
      }

      // Check if trying to edit wrong type
      if (tag === "edittext" && existing.type !== "text") {
        operations.push({ tag, id, status: "error", message: `Element "${id}" is type "${existing.type}", not "text". Cannot edit text content.`, snippet });
        continue;
      }

      // Validate and collect attributes
      const partial: Record<string, any> = {};
      let attrErrors = 0;
      for (const attr of Array.from(child.attributes)) {
        const key = attr.name;
        const val = attr.value;
        if (key === "id" || key === "elementId") continue;

        // Normalize w/h to width/height
        const resolvedKey = key === "w" ? "width" : key === "h" ? "height" : key;

        // Use existing element's type for schema-based validation
        const elementType = existing.type;

        const result = validateAttr(resolvedKey, val, tag, elementType);
        if (!result.valid) {
          operations.push({ tag, id, status: "error", message: result.error, snippet });
          attrErrors++;
          continue;
        }
        partial[resolvedKey] = result.value;
      }

      if (attrErrors > 0) continue;

      // Text content for <editText>
      if (tag === "edittext" && child.textContent) {
        partial.text = normalizeTextLines(child.textContent);
      }

      if (Object.keys(partial).length === 0) {
        operations.push({ tag, id, status: "warn", message: `No valid attributes to update on "${id}"`, snippet });
        continue;
      }

      // Apply
      updateElement(id, partial);

      // Auto-fix text heights after text change
      if (existing.type === "text" && (partial.text !== undefined || partial.fontSize !== undefined || partial.width !== undefined)) {
        const current = useEditorStore.getState();
        const updated = current.elements.find((e) => e.id === id);
        if (updated) {
          const h = getRequiredTextHeight(updated);
          if (h !== null) {
            useEditorStore.getState().updateElement(id, { height: h });
          }
        }
      }

      operations.push({
        tag, id, status: "ok",
        message: `Updated ${Object.keys(partial).length} prop(s) on "${id}": ${Object.keys(partial).join(", ")}`,
        snippet,
      });
      continue;
    }

    // ── Unknown tag ─────────────────────────────────────────────────────────
    operations.push({ tag, status: "error", message: `Unrecognized tag <${tag}> in <patch>. Supported: <delete>, <add>, <page>, <edit>, <editText>`, snippet });
  }

  // ── Build result ─────────────────────────────────────────────────────────
  const errors = operations.filter((o) => o.status === "error");
  const warnings = operations.filter((o) => o.status === "warn");

  // Force persist all batch state changes made by <patch> 
  useEditorStore.getState().forcePersist();

  let summaryMessage = `Patch: ${operations.length} operation(s). `;
  const okCount = operations.filter((o) => o.status === "ok").length;
  const errCount = errors.length;
  const warnCount = warnings.length;
  summaryMessage += `${okCount} ok, ${warnCount} warnings, ${errCount} errors.`;

  const warningStrings = warnings.map((w) => `[${w.tag}${w.id ? " " + w.id : ""}] ${w.message}`);

  if (errCount > 0) {
    const errorDetails = errors.map((e) => `  ❌ <${e.tag}${e.id ? ' id="' + e.id + '"' : ""}>: ${e.message}`).join("\n");
    const fullError = `${summaryMessage}\n\nErrors:\n${errorDetails}`;
    return { ok: false, error: fullError, warnings: warningStrings, operations };
  }

  return { ok: true, warnings: warningStrings.length > 0 ? warningStrings : undefined, operations };
}

// ─── Tool definition ──────────────────────────────────────────────────────────

export const applyPatchTool: AiTool = {
  name: "apply_patch",
  description: `Apply a <patch> XML to edit existing elements or page properties. Supports <edit>, <editText>, <add>, <delete>, <page>. 

🔴 CRITICAL RULES:
1. Before patching any <text> element, you MUST have read TEXTS.md via read_wiki first — otherwise h/alignment values will be wrong.
2. Before patching shapes, read FIGURES.md.
3. BEFORE applying a patch, you MUST call get_canvas_state to get the current element IDs. You cannot guess IDs.
4. ALWAYS use the EXACT element IDs returned by get_canvas_state. Never invent IDs.
5. After applying a patch, ALWAYS call get_canvas_state again to verify the changes took effect visually.
6. If get_canvas_state returns IDs you don't recognize, use get_element_info to inspect them.

Patch XML format:
<patch>
  <edit id="el_123" x="100" y="200" width="300" backgroundColor="#ff0000" />
  <editText id="el_456" fontSize="48" color="#ffffff">New text here</editText>
  <add>
    <text x="100" y="100" w="300" h="80" fontSize="32" color="#ffffff">Hello</text>
    <shape x="500" y="100" w="100" h="100" shapeKind="circle" backgroundColor="#6c5ce7" />
  </add>
  <delete id="el_789" />
  <page id="page_1" bgColor="#1a1a2e" />
</patch>`,
  parameters: {
    type: "object",
    properties: {
      xml: {
        type: "string",
        description: `The complete <patch> XML string. Must start with <patch> and end with </patch>. Each operation is a child element.

Examples:

1. Edit position and size of an element:
<patch><edit id="el_1" x="100" y="200" w="300" h="400" backgroundColor="#ff0000" /></patch>

2. Edit text content and style:
<patch><editText id="el_2" fontSize="48" color="#ffffff" textAlign="center">Nuevo texto aquí</editText></patch>

3. Add new elements:
<patch><add><text x="100" y="100" w="300" h="80" fontSize="32">Hello</text></add></patch>

4. Delete an element:
<patch><delete id="el_3" /></patch>

5. Multiple operations:
<patch>
  <edit id="el_1" x="50" y="50" />
  <editText id="el_2" fontSize="36">Updated text</editText>
  <add><shape x="400" y="200" w="80" h="80" shapeKind="star" backgroundColor="#ffd700" /></add>
  <delete id="el_3" />
</patch>`,
      },
    },
    required: ["xml"],
  },
  handler: async (params, _ctx: AiContext) => {
    const xml = String(params.xml ?? "");
    if (!xml) {
      return { success: false, message: "❌ No patch XML provided. Provide a <patch>...</patch> XML string." };
    }

    // Trim whitespace and ensure it starts with <patch>
    const trimmed = xml.trim();
    if (!trimmed.startsWith("<patch>")) {
      return { success: false, message: `❌ Patch XML must start with <patch>. Got: "${trimmed.slice(0, 80)}..."` };
    }
    if (!trimmed.endsWith("</patch>")) {
      return { success: false, message: `❌ Patch XML must end with </patch>. Got: "..."${trimmed.slice(-80)}"` };
    }

    const result = applyPatch(trimmed);

    if (result.ok) {
      let msg = `✅ Patch applied successfully. ${result.operations.length} operation(s) processed.`;
      const okOps = result.operations.filter((o) => o.status === "ok");
      if (okOps.length > 0) {
        msg += `\n\nChanges:`;
        for (const op of okOps) {
          msg += `\n  ✅ <${op.tag}>: ${op.message}`;
        }
      }
      if (result.warnings && result.warnings.length > 0) {
        msg += `\n\n⚠️ Warnings (${result.warnings.length}):`;
        for (const w of result.warnings) {
          msg += `\n  ⚠️ ${w}`;
        }
      }
      return { success: true, message: msg, data: { operationCount: result.operations.length, okCount: okOps.length, warnings: result.warnings } };
    }

    // Error case — build detailed message
    let msg = `❌ Patch FAILED. ${result.operations.length} operation(s) attempted.`;
    msg += `\n\nRoot cause: ${result.error}`;

    const okOps = result.operations.filter((o) => o.status === "ok");
    const errOps = result.operations.filter((o) => o.status === "error");
    const warnOps = result.operations.filter((o) => o.status === "warn");

    if (okOps.length > 0) {
      msg += `\n\n✅ Successful operations (${okOps.length}):`;
      for (const op of okOps) {
        msg += `\n  ✅ <${op.tag}>: ${op.message}`;
      }
    }
    if (errOps.length > 0) {
      msg += `\n\n❌ Failed operations (${errOps.length}):`;
      for (const op of errOps) {
        msg += `\n  ❌ <${op.tag}>${op.id ? ' id="' + op.id + '"' : ""}: ${op.message}`;
      }
    }
    if (warnOps.length > 0) {
      msg += `\n\n⚠️ Warnings (${warnOps.length}):`;
      for (const op of warnOps) {
        msg += `\n  ⚠️ ${op.message}`;
      }
    }

    msg += `\n\n💡 Fix the errors above and try again. Use get_canvas_state to check current element IDs.`;

    return { success: false, message: msg, data: { operationCount: result.operations.length, okCount: okOps.length, errCount: errOps.length } };
  },
};
