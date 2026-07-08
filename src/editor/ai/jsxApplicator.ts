/**
 * jsxApplicator.ts
 *
 * Applies a full <project> JSX string to the editor store.
 *
 * This is the "load project from LLM output" pathway. It:
 *   1. Parses the JSX string with parseJsx
 *   2. Restores in-memory base64 image data that the LLM never sees
 *      (the LLM uses @base64_img_<id> placeholders instead)
 *   3. Atomically updates the Zustand editor store
 *
 * For <patch> responses, use applyPatch() from patchEngine.ts instead.
 */

import { useEditorStore } from "../store/editorStore";
import { parseJsx } from "../utils/jsxParser";
import { getTextHeightFixes } from "../utils/textMeasure";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApplyJsxResult {
    ok: boolean;
    error?: string;
}

// ─── Applicator ───────────────────────────────────────────────────────────────

/**
 * Parse a full Design Studio JSX project string and apply it to the editor store.
 *
 * Base64 image sources are preserved from the current session so users don't
 * lose uploaded images when the LLM sends back a full project replacement.
 *
 * @returns { ok: true } on success, { ok: false, error } on failure.
 */
export function applyJsxToStore(jsx: string): ApplyJsxResult {
    try {
        const store = useEditorStore.getState();
        const result = parseJsx(jsx);

        if (!result.ok) {
            return { ok: false, error: result.error };
        }

        const { elements, pages, pageGap, guides, hasGuideElements, config } = result.data;

        // ── Restore base64 image data ──────────────────────────────────────────────
        // The LLM uses @base64_img_<id> placeholders to avoid flooding its context
        // window with encoded pixel data. We swap them back with the live data URIs
        // from the current store so uploaded images are never lost.
        for (const el of elements) {
            if (el.type === "image" && el.src?.startsWith("@base64_img_")) {
                const existing = store.elements.find((e) => e.id === el.id);
                if (existing?.type === "image" && existing.src) {
                    el.src = existing.src;
                }
            }
        }

        // Preserve existing page IDs so that any preserved guides remain attached to the correct pages
        for (let i = 0; i < pages.length; i++) {
            if (store.pages[i]) {
                pages[i].id = store.pages[i].id;
            }
        }

        // If the AI explicitly provided guides and used numeric page numbers (like "1"), 
        // translate them to the actual preserved page IDs.
        if (hasGuideElements) {
            for (const g of guides) {
                if (g.pageId) {
                    const numericVal = parseInt(g.pageId, 10);
                    if (!isNaN(numericVal) && String(numericVal) === g.pageId) {
                        const idx = Math.max(0, numericVal - 1);
                        if (pages[idx]) g.pageId = pages[idx].id;
                    }
                }
            }
        }

        // ── Build the state patch ──────────────────────────────────────────────────
        const firstPage = pages[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statePatch: Record<string, any> = {
            elements,
            pages,
            pageGap,
            // Preserve existing guides when the JSX has no explicit <guide> declarations.
            // This prevents the AI's final <project> response from wiping guides that were
            // added via add_guide tool calls earlier in the same conversation turn.
            // Guides are only replaced when the JSX actively includes guide elements.
            guides: hasGuideElements ? guides : store.guides,
            activePageIndex: 0,
            selectedId: null,
            selectedIds: [],
            // Preserve undo/redo history so the user can still undo after AI changes
            history: store.history,
            historyIndex: store.historyIndex,
            // Mirror first-page dimensions into the flat canvas fields
            canvasWidth: firstPage.width,
            canvasHeight: firstPage.height,
            canvasBgColor: firstPage.bgColor,
        };

        // Apply optional config overrides from <config> element
        if (config.showGrid !== undefined) statePatch.showGrid = config.showGrid === "true";
        if (config.snapToGrid !== undefined) statePatch.snapToGrid = config.snapToGrid === "true";
        if (config.showRulers !== undefined) statePatch.showRulers = config.showRulers === "true";
        if (config.guideMode) statePatch.guideMode = config.guideMode;
        if (config.gridSize) statePatch.gridSize = parseInt(config.gridSize, 10);
        if (config.zoom) statePatch.zoom = parseFloat(config.zoom);

        // Auto-fix text element heights to prevent clipping
        const fixes = getTextHeightFixes(elements);
        if (fixes.length > 0) {
            const fixMap = new Map(fixes.map((f) => [f.id, f.height]));
            statePatch.elements = elements.map((el) => {
                const newH = fixMap.get(el.id);
                return newH !== undefined ? { ...el, height: newH } : el;
            });
        }

        useEditorStore.setState(statePatch);
        return { ok: true };
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, error: msg };
    }
}
