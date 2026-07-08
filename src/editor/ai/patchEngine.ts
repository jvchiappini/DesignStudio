import { useEditorStore } from "../store/editorStore";
import { cssBackgroundToLayers } from "../utils/cssBackgroundParser";
import { parseJsx, normalizeTextLines } from "../utils/jsxParser";
import { getRequiredTextHeight } from "../utils/textMeasure";

// Certain properties need specific parsing rather than auto-inferencing from existing state
function getPatchId(el: Element): string | null {
    return el.getAttribute("id") || el.getAttribute("elementId");
}

function parseSpecialValue(key: string, val: string): any {
    if (key === "textShadows") {
        try { return JSON.parse(val); } catch { return undefined; }
    }
    if (key === "bgLayers") {
        try { return JSON.parse(val); } catch { return undefined; }
    }
    if (key.endsWith("Colors") && val) {
        return val.split(",");
    }
    if (key === "clipMask" && val) {
        const idx = val.indexOf(":");
        if (idx !== -1) return { type: val.slice(0, idx), value: val.slice(idx + 1) };
        return undefined;
    }

    if (val === "true") return true;
    if (val === "false") return false;

    const numProps = [
        "x", "y", "w", "width", "h", "height", "rotation", "opacity", "zIndex",
        "shadowBlur", "shadowOffsetX", "shadowOffsetY", "fontSize", "fontWeight",
        "letterSpacing", "lineHeight", "wordSpacing", "textIndent", "charScaleX", "charScaleY",
        "textStrokeWidth", "textPaddingLeft", "textPaddingRight", "textPaddingTop", "textPaddingBottom",
        "textOutlineWidth", "imgBrightness", "imgContrast", "imgSaturation", "imgBlur",
        "cropX", "cropY", "cropW", "cropH", "borderWidth", "borderRadius", "borderRadiusTL",
        "borderRadiusTR", "borderRadiusBR", "borderRadiusBL",
    ];
    if (numProps.includes(key)) {
        return parseFloat(val);
    }

    return val;
}

/**
 * Parse an XML/HTML string into a DOM document.
 * Uses text/html for tolerant parsing (handles JSX-like syntax better than strict XML).
 */
function parseXml(xml: string): Document {
    // Try HTML-first for tolerance, then fall back to XML
    const doc = new DOMParser().parseFromString(`<div id="__patch_root">${xml}</div>`, "text/html");
    return doc;
}

export function applyPatch(xml: string): { ok: boolean; error?: string; warnings?: string[] } {
    try {
        const doc = parseXml(xml);
        const root = doc.querySelector("#__patch_root")?.firstElementChild;
        if (!root || root.tagName.toLowerCase() !== "patch") {
            return { ok: false, error: "Root tag must be <patch>." };
        }

        const store = useEditorStore.getState();
        const updateElement = store.updateElement;
        const addElement = store.addElement;
        const warnings: string[] = [];

        const doDelete = (id: string) => {
            useEditorStore.setState(s => ({
                elements: s.elements.filter(e => e.id !== id),
                selectedIds: s.selectedIds.filter(sel => sel !== id),
                selectedId: s.selectedId === id ? null : s.selectedId,
            }));
        };

        const children = Array.from(root.children);
        for (const child of children) {
            const tag = child.tagName.toLowerCase();

            if (tag === "delete") {
                const id = getPatchId(child);
                if (id) {
                    if (useEditorStore.getState().elements.find(e => e.id === id)) {
                        doDelete(id);
                    } else {
                        warnings.push(`delete: element "${id}" not found`);
                    }
                }
            }
            else if (tag === "add") {
                const inner = child.innerHTML.trim();
                const wrapper = inner.startsWith("<page")
                    ? `<project>${inner}</project>`
                    : `<project><page width="1080" height="1920">${inner}</page></project>`;

                const result = parseJsx(wrapper);
                if (result.ok) {
                    if (inner.startsWith("<page")) {
                        for (const p of result.data.pages) {
                            useEditorStore.setState(s => {
                                const newPages = [...s.pages, p];
                                return {
                                    pages: newPages,
                                    activePageIndex: newPages.length - 1,
                                    canvasWidth: p.width,
                                    canvasHeight: p.height,
                                    canvasBgColor: p.bgColor
                                };
                            });
                        }
                        warnings.push(`add: ${result.data.pages.length} page(s) added`);
                    }
                    for (const el of result.data.elements) {
                        if (el.type === "text") {
                            const h = getRequiredTextHeight(el);
                            if (h !== null) el.height = h;
                        }
                        addElement(el);
                    }
                    if (result.data.elements.length > 0) {
                        warnings.push(`add: ${result.data.elements.length} element(s) added`);
                    }
                } else {
                    warnings.push(`add: parse error — ${result.error}`);
                }
            }
            else if (tag === "page") {
                const currentState = useEditorStore.getState();
                const pageId = getPatchId(child) || currentState.pages[currentState.activePageIndex]?.id;
                const pagePartial: Record<string, any> = {};
                for (const attr of Array.from(child.attributes)) {
                    const key = attr.name;
                    const val = attr.value;
                    if (key === "id" || key === "elementId") continue;
                    if (key === "w" || key === "width") { pagePartial.width = parseFloat(val); continue; }
                    if (key === "h" || key === "height") { pagePartial.height = parseFloat(val); continue; }
                    if (key === "bgStyle") {
                        const layers = cssBackgroundToLayers(val);
                        if (layers.length > 0) pagePartial.bgLayers = layers;
                        continue;
                    }
                    pagePartial[key] = parseSpecialValue(key, val);
                }
                if (Object.keys(pagePartial).length > 0 && pageId) {
                    currentState.updatePage(pageId, pagePartial);
                    warnings.push(`page "${pageId}" updated`);
                } else if (!pageId) {
                    warnings.push("page: no valid page ID found to update");
                }
            }
            else if (tag.startsWith("edit")) {
                const id = getPatchId(child);
                if (!id) { warnings.push(`${tag}: missing id attribute`); continue; }
                const currentElements = useEditorStore.getState().elements;
                const existing = currentElements.find(e => e.id === id);
                if (!existing) { warnings.push(`${tag}: element "${id}" not found`); continue; }

                const partial: Record<string, any> = {};
                for (const attr of Array.from(child.attributes)) {
                    const key = attr.name;
                    const val = attr.value;
                    if (key === "id" || key === "elementId") continue;
                    if (key === "w") { partial.width = parseSpecialValue("width", val); continue; }
                    if (key === "h") { partial.height = parseSpecialValue("height", val); continue; }
                    partial[key] = parseSpecialValue(key, val);
                }

                if (tag === "edittext" && child.textContent) {
                    partial.text = normalizeTextLines(child.textContent);
                }

                updateElement(id, partial);

                const current = useEditorStore.getState();
                const updated = current.elements.find(e => e.id === id);
                if (updated && updated.type === "text") {
                    const h = getRequiredTextHeight(updated);
                    if (h !== null) {
                        useEditorStore.getState().updateElement(id, { height: h });
                    }
                }
            }
            else {
                warnings.push(`unrecognized tag <${tag}> skipped`);
            }
        }

        return { ok: true, warnings: warnings.length > 0 ? warnings : undefined };
    } catch (e: any) {
        return { ok: false, error: e.message || String(e) };
    }
}
