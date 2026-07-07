import { useEditorStore } from "../store/editorStore";

// Certain properties need specific parsing rather than auto-inferencing from existing state
function parseSpecialValue(key: string, val: string): any {
    if (key === "textShadows") {
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

    // Auto infer type
    if (val === "true") return true;
    if (val === "false") return false;

    // If it looks like a number and existing is a number or undefined (fallback numeric properties)
    const numProps = [
        "x", "y", "w", "width", "h", "height", "rotation", "opacity", "zIndex",
        "shadowBlur", "shadowOffsetX", "shadowOffsetY", "fontSize", "fontWeight",
        "letterSpacing", "lineHeight", "wordSpacing", "textIndent", "charScaleX", "charScaleY",
        "textStrokeWidth", "textPaddingLeft", "textPaddingRight", "textPaddingTop", "textPaddingBottom",
        "textOutlineWidth", "imgBrightness", "imgContrast", "imgSaturation", "imgBlur",
        "cropX", "cropY", "cropW", "cropH", "borderWidth", "borderRadius", "borderRadiusTL",
        "borderRadiusTR", "borderRadiusBR", "borderRadiusBL"
    ];
    if (numProps.includes(key)) {
        return parseFloat(val);
    }

    return val;
}

import { parseJsx } from "../utils/jsxParser";

export function applyPatch(xml: string): { ok: boolean; error?: string } {
    try {
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const errEl = doc.querySelector("parsererror");
        if (errEl) return { ok: false, error: `Patch XML parse error: ${errEl.textContent}` };

        const root = doc.documentElement;
        if (!root || root.tagName !== "patch") {
            return { ok: false, error: "Root tag must be <patch>." };
        }

        const store = useEditorStore.getState();
        const updateElement = store.updateElement;
        const addElement = store.addElement;

        const doDelete = (id: string) => {
            useEditorStore.setState(s => ({
                elements: s.elements.filter(e => e.id !== id),
                selectedIds: s.selectedIds.filter(sel => sel !== id),
                selectedId: s.selectedId === id ? null : s.selectedId
            }));
        };

        const children = Array.from(root.children);
        for (const child of children) {
            const tag = child.tagName.toLowerCase();

            if (tag === "delete") {
                const id = child.getAttribute("id");
                if (id) doDelete(id);
            }
            else if (tag === "add") {
                // Wrap children in a dummy project to reuse parseJsx
                const wrapper = `<project><page width="1080" height="1920">${child.innerHTML}</page></project>`;
                const result = parseJsx(wrapper);
                if (result.ok) {
                    for (const el of result.data.elements) {
                        // For additions, ensure unique id if it already exists?
                        // The LLM tries to generate new IDs. Let's merge them directly:
                        addElement(el);
                    }
                } else {
                    console.error("Failed to parse <add> contents:", result.error);
                }
            }
            else if (tag.startsWith("edit")) {
                const id = child.getAttribute("id");
                if (!id) continue;
                const existing = store.elements.find(e => e.id === id);
                if (!existing) continue;

                const partial: Record<string, any> = {};
                for (const attr of Array.from(child.attributes)) {
                    const key = attr.name;
                    const val = attr.value;
                    if (key === "id") continue;
                    if (key === "w") { partial["width"] = parseSpecialValue("width", val); continue; }
                    if (key === "h") { partial["height"] = parseSpecialValue("height", val); continue; }

                    partial[key] = parseSpecialValue(key, val);
                }

                // If the LLM passed textContent (for text element editing)
                if (tag === "edittext" && child.textContent) {
                    partial.text = child.textContent;
                }

                updateElement(id, partial);
            }
        }

        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: e.message || String(e) };
    }
}
