/**
 * jsxParser.ts
 * Parses the Design Studio JSX DSL back into DesignElement[] + Pages.
 * 100% faithful to SKILL.md — supports all attributes for text, image, shape, svg.
 * Also supports the legacy <figure> tag for backwards compatibility.
 */

import type { DesignElement, Page } from "./types";
import { cssBackgroundToLayers } from "./cssBackgroundParser";
import { AnchorService } from "../../core/services/AnchorService";
import { getPageOffset } from "../store/slices/pageSlice";

export function normalizeTextLines(text: string): string {
    return text
        .trim()
        .split("\n")
        .map(l => l.trim())
        .join("\n");
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface GuideData {
    id: string;
    position: number;
    orientation: "horizontal" | "vertical";
    pageNumber?: number;
}

export interface ParsedProject {
    elements: DesignElement[];
    pages: Page[];
    pageGap: number;
    guides: GuideData[];
    /** True when the <config> block explicitly contained at least one <guide> element.
     *  False means the JSX had NO guide declarations — existing guides should be preserved. */
    hasGuideElements: boolean;
    config: Record<string, string>;
}

// ── DOM attribute helpers ─────────────────────────────────────────────────────

function numAttr(el: Element, attr: string, def = 0): number {
    const v = el.getAttribute(attr);
    return v !== null && v !== "" ? parseFloat(v) : def;
}

// ── Per-type parsing via BehaviorRegistry ─────────────────────────────────────
// Each element type encapsulates its own parsing logic in a Behavior file
// under src/core/behaviors/. To add a new type, create a new Behavior and
// register it in BehaviorRegistry — no changes needed here.
import { parseElement } from "../../core/behaviors/BehaviorRegistry";

// ── Public: parse JSX string → ParsedProject ─────────────────────────────────

export function parseJsx(
    xml: string,
): { ok: true; data: ParsedProject } | { ok: false; error: string } {
    try {
        // Pre-escape angle brackets and ampersands inside svgContent='...' attribute values
        // so that DOMParser does not choke on raw `<svg ...>` markup or `&` in the attribute.
        xml = xml.replace(/svgContent='([^']*)'/g, (_m, content: string) => {
            const escaped = content
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            return `svgContent='${escaped}'`;
        });

        // Escape bare `&` that are not already part of a valid XML entity.
        // This handles cases like "CEO & Fundadora" in text content.
        xml = xml.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;");

        const doc = new DOMParser().parseFromString(xml, "text/xml");

        const errEl = doc.querySelector("parsererror");
        if (errEl) {
            return { ok: false, error: `XML parse error: ${errEl.textContent?.slice(0, 300)}` };
        }

        const root = doc.documentElement;
        if (!root) return { ok: false, error: "Empty document" };
        if (root.tagName !== "project") {
            return { ok: false, error: `Root tag must be <project>, got <${root.tagName}>` };
        }

        // ── Config + Guides ──────────────────────────────────────────────────────
        const configEl = root.querySelector(":scope > config");
        const config: Record<string, string> = {};
        const guides: GuideData[] = [];

        if (configEl) {
            for (const { name, value } of Array.from(configEl.attributes)) {
                config[name] = value;
            }
            const guideNodes = Array.from(configEl.querySelectorAll(":scope > guide"));
            for (const guideEl of guideNodes) {
                const pos = parseFloat(guideEl.getAttribute("position") || "0");
                const orient = guideEl.getAttribute("orientation") as "horizontal" | "vertical";
                const pNumStr = guideEl.getAttribute("pageNumber");
                const pIdStr = guideEl.getAttribute("pageId");

                let pageNumber: number | undefined = undefined;
                if (pNumStr) {
                    pageNumber = parseInt(pNumStr, 10);
                } else if (pIdStr) {
                    if (pIdStr.startsWith("page_")) {
                        pageNumber = parseInt(pIdStr.split("_")[1], 10);
                    } else {
                        pageNumber = parseInt(pIdStr, 10);
                    }
                }

                if (pageNumber !== undefined && isNaN(pageNumber)) {
                    pageNumber = undefined;
                }

                const gid = guideEl.getAttribute("id") || `guide_${guides.length + 1}`;
                if (orient) {
                    guides.push({
                        id: gid,
                        position: pos,
                        orientation: orient,
                        pageNumber,
                    });
                }
            }
            // Track whether the JSX explicitly contained guide elements
            (config as any).__hasGuideElements = guideNodes.length > 0;
        }

        // ── Pages ────────────────────────────────────────────────────────────────
        const pageNodes = root.querySelectorAll(":scope > page");
        if (pageNodes.length === 0) {
            return { ok: false, error: "No <page> elements found inside <project>" };
        }

        const pages: Page[] = [];
        const elements: DesignElement[] = [];
        const pageGap = config.pageGap ? parseInt(config.pageGap, 10) : 40;
        let elCounter = 1;

        for (let pi = 0; pi < pageNodes.length; pi++) {
            const pg = pageNodes[pi];
            const w = numAttr(pg, "width", 1080);
            const h = numAttr(pg, "height", 1920);
            const bg = pg.getAttribute("bgColor") || "#1a1a2e";
            const pgName = pg.getAttribute("name") || `Página ${pi + 1}`;

            const page: Page = { id: `page_${pi + 1}`, name: pgName, width: w, height: h, bgColor: bg };

            // Parse bgStyle into bgLayers for mesh/complex gradients
            const bgStyle = pg.getAttribute("bgStyle");
            if (bgStyle) {
                const layers = cssBackgroundToLayers(bgStyle);
                if (layers.length > 0) page.bgLayers = layers;
            }

            pages.push(page);

            const startX = getPageOffset(pages, pi, pageGap);

            // ── Elements (new DSL + legacy <figure>) ──────────────────────────────
            const children = Array.from(
                pg.querySelectorAll(":scope > text, :scope > image, :scope > shape, :scope > svg, :scope > figure"),
            );

            for (const el of children) {
                const rawId = el.getAttribute("id");
                const elId = rawId || `el_${Date.now()}_${elCounter++}_${Math.random().toString(36).slice(2, 6)}`;
                const parsed = parseElement(el, startX, elements.length, elId);
                if (parsed) elements.push(parsed);
            }
        }

        const hasGuideElements = !!(config as any).__hasGuideElements;
        delete (config as any).__hasGuideElements;

        // ── Anchor offset resolution ─────────────────────────────────────────
        // Delegated to the centralised AnchorService so that all 5 consumers
        // share the exact same algorithm (parser, applicator, store, canvas, guides).
        const anchorSvc = new AnchorService(guides, pages, pageGap);
        for (const el of elements) {
            anchorSvc.defaultOffsets(el);
            anchorSvc.resolveElement(el);
        }

        return { ok: true, data: { elements, pages, pageGap, guides, hasGuideElements, config } };
    } catch (e: any) {
        return { ok: false, error: e?.message || String(e) };
    }
}
