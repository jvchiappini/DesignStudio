/**
 * jsxSerializer.ts
 * Serializes DesignElement[] + Pages into the Design Studio JSX DSL (SKILL.md-compliant).
 * 
 * Two modes:
 *   llmMode=false (default) — full fidelity, including base64 image src. Use for Save/Open.
 *   llmMode=true            — strips base64 src, replaces with @base64_img_<id> placeholder.
 *                             Use for LLM context to avoid flooding the token window.
 */

import type { DesignElement, Page } from "./types";
import { layersToBackground, hasActiveLayers } from "./backgroundUtils";
import { getPageOffset } from "../store/slices/pageSlice";

interface GuideData {
    id: string;
    position: number;
    orientation: "horizontal" | "vertical";
    pageNumber?: number;
}

interface StoreSnapshot {
    showGrid: boolean;
    snapToGrid: boolean;
    showRulers: boolean;
    guideMode: string;
    gridSize: number;
    zoom: number;
    guides: GuideData[];
}

// ── Common attributes shared by ALL element types ─────────────────────────────

// ── Per-type serialization delegated to BehaviorRegistry ──────────────────────
import { serializeElement as serializeViaBehavior } from "../../core/behaviors/BehaviorRegistry";

// ── Public: serialize a single element ───────────────────────────────────────

export function serializeElement(el: DesignElement, rx: number, llmMode: boolean): string {
    return serializeViaBehavior(el, rx, llmMode);
}

// ── Public: serialize entire project ─────────────────────────────────────────

export function generateJsx(
    elements: DesignElement[],
    pages: Page[],
    pageGap: number,
    store: StoreSnapshot,
    llmMode = false,
): string {
    const ca = (k: string, v: unknown, def?: unknown) =>
        v !== undefined && v !== null && v !== def
            ? ` ${k}="${String(v).replace(/"/g, "&quot;")}"`
            : "";

    let out = "<project>\n";

    // <config>
    out +=
        `  <config` +
        ca("pageGap", pageGap, 40) +
        ca("showGrid", store.showGrid, false) +
        ca("snapToGrid", store.snapToGrid, true) +
        ca("showRulers", store.showRulers, false) +
        ca("guideMode", store.guideMode, "page") +
        ca("gridSize", store.gridSize, 20) +
        ca("zoom", store.zoom !== 0.5 ? Math.round(store.zoom * 100) / 100 : undefined) +
        `>\n`;

    for (const g of store.guides) {
        out +=
            `    <guide` +
            ca("id", g.id) +
            ca("position", g.position) +
            ca("orientation", g.orientation) +
            (g.pageNumber ? ca("pageNumber", g.pageNumber) : "") +
            ` />\n`;
    }
    out += "  </config>\n";

    // <page> elements
    for (let pi = 0; pi < pages.length; pi++) {
        const pg = pages[pi];
        const startX = getPageOffset(pages, pi, pageGap);
        const endX = startX + pg.width;
        const pageBgStyle = hasActiveLayers(pg.bgLayers) ? layersToBackground(pg.bgLayers) : null;

        out +=
            `  <page` +
            ` width="${pg.width}"` +
            ` height="${pg.height}"` +
            ` bgColor="${pg.bgColor}"` +
            (pg.name ? ca("name", pg.name) : "") +
            (pageBgStyle ? ca("bgStyle", pageBgStyle) : "") +
            `>\n`;

        // Emit elements sorted by zIndex so output order matches visual stacking
        const pageEls = elements
            .filter((el) => el.x >= startX && el.x < endX)
            .sort((a, b) => a.zIndex - b.zIndex);

        for (const el of pageEls) {
            const rx = el.x - startX;
            out += serializeElement(el, rx, llmMode);
        }

        out += "  </page>\n";
    }

    out += "</project>\n";
    return out;
}
