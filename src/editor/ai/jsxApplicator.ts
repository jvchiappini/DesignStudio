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
 *
 * ── Why the deferred autoFit pass? ────────────────────────────────────────────
 * jsxParser already calls calculateOptimalFontSize() for elements with
 * autoFitSize=true at parse time, but that call happens synchronously while
 * Google Fonts (Inter, Poppins, etc.) may not yet be available in the browser's
 * canvas context.  canvas.measureText() silently falls back to system-ui when
 * the requested font isn't loaded, producing wrong measurements.  We therefore
 * run a SECOND pass via requestAnimationFrame after setState() so that React
 * has painted and the FontFaceSet is likely resolved.  A document.fonts.ready
 * gate is included for robustness.
 */

import { useEditorStore } from "../store/editorStore";
import { parseJsx } from "../utils/jsxParser";
import { getTextHeightFixes, calculateOptimalFontSize } from "../utils/textMeasure";
import { optimizeBase64Image } from "../utils/imageOptimizer";
import type { DesignElement } from "../utils/types";

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

// ─── Deferred autoFit pass ────────────────────────────────────────────────────

/**
 * Schedule a post-render pass that recomputes the optimal font size for every
 * text element that has autoFitSize=true.
 *
 * This runs AFTER React has painted (requestAnimationFrame) AND after all
 * web fonts are loaded (document.fonts.ready), so canvas.measureText() uses
 * the correct glyph metrics instead of the system-ui fallback.
 */
function scheduleAutoFitPass(elements: DesignElement[]): void {
    const autoFitIds = elements
        .filter((el) => el.type === "text" && el.autoFitSize)
        .map((el) => el.id);

    if (autoFitIds.length === 0) return;

    const runPass = () => {
        const currentElements = useEditorStore.getState().elements;
        const updates: Array<{ id: string; fontSize: number }> = [];

        for (const id of autoFitIds) {
            const el = currentElements.find((e) => e.id === id);
            if (!el || el.type !== "text" || !el.autoFitSize) continue;
            const optimal = calculateOptimalFontSize(el);
            if (optimal !== null && Math.abs(optimal - (el.fontSize ?? 0)) > 0.5) {
                updates.push({ id, fontSize: optimal });
            }
        }

        if (updates.length > 0) {
            useEditorStore.setState((s) => ({
                elements: s.elements.map((el) => {
                    const u = updates.find((u) => u.id === el.id);
                    return u ? { ...el, fontSize: u.fontSize } : el;
                }),
            }));
        }
    };

    // Wait for fonts, then paint, then measure.
    const schedule = () => requestAnimationFrame(runPass);
    if (typeof document !== "undefined" && document.fonts?.ready) {
        document.fonts.ready.then(schedule);
    } else {
        schedule();
    }
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

        // Guide's pageNumber (which is an index) remains valid exactly as is.

        // ── Decide which guides go into the store ──────────────────────────────────
        // alwaysReplaceGuides=true  → file open: always use what the file provides
        // alwaysReplaceGuides=false → AI mode:   only replace if the JSX had <guide>
        //   elements; a bare <project> block must not silently wipe guides that were
        //   added by add_guide tool calls earlier in the same turn.
        const resolvedGuides =
            alwaysReplaceGuides || hasGuideElements ? guides : store.guides;

        // ── Post-parse anchor recalculation ────────────────────────────────────────
        // The JSX parser resolves anchor offsets from the <guide> elements it
        // finds inside the <config> block. When the AI generates JSX without
        // embedded <guide> declarations (because we preserve the store's guides),
        // the parser runs with guides=[] and cannot resolve offsets. We do a second
        // pass here using the definitive resolvedGuides.
        //
        // CONTRACT (same as the parser's Pass 1):
        //   - If leftAnchorOffset is absent → it was 0 (serialiser omits defaults).
        //   - NEVER back-calculate from el.x; the AI may write a placeholder x.
        if (resolvedGuides.length > 0) {
            // In AI mode (preserveHistory=true) always use the store's pageGap
            // for anchor math. Both store and JSX default to 40, but an explicit
            // mismatch (e.g. user had a custom gap) must not corrupt page offsets.
            // For file-open (preserveHistory=false) we trust the JSX value as-is.
            const effectivePageGap = preserveHistory ? store.pageGap : pageGap;
            const pageOffFn = (pageNumber: number | undefined): number => {
                const idx = pageNumber !== undefined ? pageNumber - 1 : 0;
                let off = 0;
                for (let i = 0; i < idx && i < pages.length - 1; i++) {
                    off += pages[i].width + effectivePageGap;
                }
                return off;
            };

            for (const el of elements) {
                if (!el.leftAnchor && !el.rightAnchor) continue;

                // Pass A: default any still-undefined offsets to 0
                if (el.leftAnchor && el.leftAnchorOffset === undefined) {
                    el.leftAnchorOffset = 0;
                }
                if (el.rightAnchor && el.rightAnchorOffset === undefined) {
                    el.rightAnchorOffset = 0;
                }

                // Pass B: recompute el.x from the canonical formula.
                // This only matters when the parser couldn't resolve the guide
                // (empty guides list); if the parser already ran Pass 2 correctly,
                // this recalculation is idempotent.
                if (el.leftAnchor && el.leftAnchorOffset !== undefined) {
                    const g = resolvedGuides.find((gd) => gd.id === el.leftAnchor);
                    if (g) {
                        const ps = pageOffFn(g.pageNumber);
                        el.x = g.position + ps + el.leftAnchorOffset;
                    }
                }
                if (el.rightAnchor && el.rightAnchorOffset !== undefined) {
                    const g = resolvedGuides.find((gd) => gd.id === el.rightAnchor);
                    if (g) {
                        const ps = pageOffFn(g.pageNumber);
                        const newRight = g.position + ps + el.rightAnchorOffset;
                        if (el.leftAnchor) {
                            el.width = Math.max(10, newRight - el.x);
                        } else {
                            el.x = newRight - el.width;
                        }
                    }
                }
            }
        }

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
        if (config.guideMode) statePatch.guideMode = config.guideMode;
        if (config.gridSize) statePatch.gridSize = parseInt(config.gridSize, 10);
        if (config.zoom) statePatch.zoom = parseFloat(config.zoom);

        // showRulers logic:
        // • If config explicitly sets it → use that value.
        // • If the JSX has <guide> elements, auto-enable rulers so they are visible
        //   immediately (the AI virtually always forgets showRulers="true").
        // • Otherwise fall through to the existing store value (no change).
        if (config.showRulers !== undefined) {
            statePatch.showRulers = config.showRulers === "true";
        } else if (resolvedGuides.length > 0) {
            statePatch.showRulers = true;
        }

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
        useEditorStore.getState().forcePersist();

        // ── Deferred autoFit pass (post-render, post-fonts) ───────────────────────
        // jsxParser already called calculateOptimalFontSize() synchronously, but web
        // fonts (Inter, Poppins, etc.) may not be in the canvas context yet at that
        // point.  We schedule a second pass after React paints + fonts are ready so
        // the measurements are accurate.
        scheduleAutoFitPass(statePatch.elements ?? elements);

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
