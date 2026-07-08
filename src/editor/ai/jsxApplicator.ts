/**
 * jsxApplicator.ts
 *
 * Single source-of-truth for loading a <project> JSX string into the editor store.
 *
 * Both pathways (opening a .jsx file from TopBar AND applying an AI response) call
 * the same `loadJsxIntoStore` function so that features like auto-fit text heights
 * and guide rendering are ALWAYS processed identically.
 *
 * Options let each caller control the handful of things that legitimately differ:
 *
 *  • AI apply_project  →  preserveHistory:true,  preservePageIds:true,  alwaysReplaceGuides:false
 *  • TopBar open file  →  preserveHistory:false,  preservePageIds:false, alwaysReplaceGuides:true
 *
 * For <patch> responses use applyPatch() from patchEngine.ts instead.
 */

import { useEditorStore } from "../store/editorStore";
import { parseJsx } from "../utils/jsxParser";
import { getTextHeightFixes } from "../utils/textMeasure";
import { optimizeBase64Image } from "../utils/imageOptimizer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApplyJsxResult {
    ok: boolean;
    error?: string;
}

export interface LoadJsxOptions {
    /**
     * When true the existing undo/redo history stack is kept so the user can
     * still Ctrl+Z after an AI update.  When false (file open) history is reset.
     */
    preserveHistory?: boolean;

    /**
     * When true existing page IDs are reused so guides that reference those IDs
     * stay attached.  When false (file open) fresh page IDs are accepted as-is.
     */
    preservePageIds?: boolean;

    /**
     * When true guides from the JSX are ALWAYS applied, even if the element list
     * is empty.  When false (AI mode) guides are only replaced when the JSX
     * explicitly contains <guide> elements; otherwise the store's current guides
     * are kept so a bare <project> block doesn't silently erase them.
     */
    alwaysReplaceGuides?: boolean;

    /**
     * If provided the store's projectName is set to this value.
     * Ignored when undefined (AI updates do not rename the project).
     */
    projectName?: string;
}

// ─── Core loader (single source of truth) ─────────────────────────────────────

/**
 * Parse a Design Studio JSX project string and load it into the editor store.
 *
 * This is the **one function** that must be called regardless of whether the
 * JSX came from an AI response or from opening a file.  All post-processing
 * (auto-fit text heights, image restoration, guide translation, config
 * application) happens here so that both pathways are always in sync.
 */
export async function loadJsxIntoStore(
    jsx: string,
    options: LoadJsxOptions = {}
): Promise<ApplyJsxResult> {
    const {
        preserveHistory = false,
        preservePageIds = false,
        alwaysReplaceGuides = true,
        projectName,
    } = options;

    try {
        const store = useEditorStore.getState();
        const result = parseJsx(jsx);

        if (!result.ok) {
            return { ok: false, error: result.error };
        }

        const { elements, pages, pageGap, guides, hasGuideElements, config } = result.data;

        // ── Restore base64 image data ──────────────────────────────────────────────
        // The LLM uses @base64_img_<id> placeholders to avoid flooding its context
        // window with encoded pixel data.  We swap them back with the live data URIs
        // from the current store so uploaded images are never lost.
        for (const el of elements) {
            if (el.type === "image" && el.src) {
                if (el.src.startsWith("@base64_img_")) {
                    const existing = store.elements.find((e) => e.id === el.id);
                    if (existing?.type === "image" && existing.src) {
                        el.src = existing.src;
                    } else {
                        console.warn(`Could not restore image data for ${el.id}`);
                    }
                }

                // Auto-compress raw base64 data to WebP if applicable
                if (el.src.startsWith("data:image/")) {
                    try {
                        const { dataUrl, summary } = await optimizeBase64Image(el.src);
                        console.log(`[Load optimization] ${summary}`);
                        el.src = dataUrl;
                    } catch (err) {
                        console.error("Error optimizando imagen al cargar:", err);
                    }
                }
            }
        }

        // ── Optionally preserve existing page IDs ──────────────────────────────────
        // Keeping the same UUIDs ensures that guide records (which reference pageId)
        // remain valid after an AI update.
        if (preservePageIds) {
            for (let i = 0; i < pages.length; i++) {
                if (store.pages[i]) {
                    pages[i].id = store.pages[i].id;
                }
            }
        }

        // ── Translate numeric page IDs in guide elements (AI mode) ─────────────────
        // When the AI writes pageId="1" we convert it to the real UUID of page 0.
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

        // ── Decide which guides go into the store ──────────────────────────────────
        // alwaysReplaceGuides=true  → file open: always use what the file provides
        // alwaysReplaceGuides=false → AI mode:   only replace if the JSX had <guide>
        //   elements; a bare <project> block must not silently wipe guides that were
        //   added by add_guide tool calls earlier in the same turn.
        const resolvedGuides =
            alwaysReplaceGuides || hasGuideElements ? guides : store.guides;

        // ── Build state patch ──────────────────────────────────────────────────────
        const firstPage = pages[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statePatch: Record<string, any> = {
            elements,
            pages,
            pageGap,
            guides: resolvedGuides,
            activePageIndex: 0,
            selectedId: null,
            selectedIds: [],
            // History: keep for AI updates, reset for file opens
            history: preserveHistory ? store.history : [],
            historyIndex: preserveHistory ? store.historyIndex : -1,
            // Mirror first-page dimensions into the flat canvas fields
            canvasWidth: firstPage.width,
            canvasHeight: firstPage.height,
            canvasBgColor: firstPage.bgColor,
        };

        // Rename project if a name was provided (file open)
        if (projectName !== undefined) {
            statePatch.projectName = projectName;
        }

        // ── Apply optional <config> overrides ─────────────────────────────────────
        if (config.showGrid !== undefined) statePatch.showGrid = config.showGrid === "true";
        if (config.snapToGrid !== undefined) statePatch.snapToGrid = config.snapToGrid === "true";
        if (config.showRulers !== undefined) statePatch.showRulers = config.showRulers === "true";
        if (config.guideMode) statePatch.guideMode = config.guideMode;
        if (config.gridSize) statePatch.gridSize = parseInt(config.gridSize, 10);
        if (config.zoom) statePatch.zoom = parseFloat(config.zoom);

        // ── Auto-fix text element heights to prevent clipping ─────────────────────
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

// ─── Convenience wrappers ──────────────────────────────────────────────────────

/**
 * Apply an AI-generated <project> JSX to the store.
 *
 * Differences from opening a file:
 *  - History is preserved (user can still Ctrl+Z)
 *  - Page IDs are reused (guides stay attached)
 *  - Guides are only replaced when the JSX explicitly includes <guide> elements
 */
export async function applyJsxToStore(jsx: string): Promise<ApplyJsxResult> {
    return loadJsxIntoStore(jsx, {
        preserveHistory: true,
        preservePageIds: true,
        alwaysReplaceGuides: false,
    });
}
