/**
 * jsxParser.ts
 * Parses the Design Studio JSX DSL back into DesignElement[] + Pages.
 * 100% faithful to SKILL.md — supports all attributes for text, image, shape, svg.
 * Also supports the legacy <figure> tag for backwards compatibility.
 */

import type { DesignElement, Page, ClipMask } from "./types";
import { pageOffset } from "./jsxSerializer";
import { cssBackgroundToLayers } from "./cssBackgroundParser";
import { calculateOptimalFontSize } from "./textMeasure";

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

function strAttr<T extends string>(el: Element, attr: string): T | undefined {
    const v = el.getAttribute(attr);
    return (v !== null && v !== "" ? v : undefined) as T | undefined;
}

function boolAttr(el: Element, attr: string, def: boolean): boolean {
    const v = el.getAttribute(attr);
    return v !== null ? v === "true" : def;
}

function hasAttr(el: Element, attr: string): boolean {
    const v = el.getAttribute(attr);
    return v !== null && v !== "";
}

/** Parse "type:value" → ClipMask | undefined */
function parseClipMask(raw: string | null | undefined): ClipMask | undefined {
    if (!raw) return undefined;
    const idx = raw.indexOf(":");
    if (idx === -1) return undefined;
    return {
        type: raw.slice(0, idx) as ClipMask["type"],
        value: raw.slice(idx + 1),
    };
}

// ── Common attributes shared by ALL element types ─────────────────────────────

function parseCommon(el: Element, startX: number, elementCount: number): Partial<DesignElement> {
    return {
        x: numAttr(el, "x") + startX,
        y: numAttr(el, "y"),
        width: numAttr(el, "w", 100),
        height: numAttr(el, "h", 100),
        rotation: numAttr(el, "rotation", 0),
        opacity: numAttr(el, "opacity", 1),
        zIndex: hasAttr(el, "zIndex") ? numAttr(el, "zIndex") : elementCount + 1,
        mixBlendMode: strAttr(el, "mixBlendMode"),
        flipH: boolAttr(el, "flipH", false) || undefined,
        flipV: boolAttr(el, "flipV", false) || undefined,
        locked: boolAttr(el, "locked", false) || undefined,
        hidden: boolAttr(el, "hidden", false) || undefined,
        groupId: strAttr(el, "groupId"),
        shadowColor: strAttr(el, "shadowColor"),
        shadowBlur: hasAttr(el, "shadowBlur") ? numAttr(el, "shadowBlur") : undefined,
        shadowOffsetX: hasAttr(el, "shadowOffsetX") ? numAttr(el, "shadowOffsetX") : undefined,
        shadowOffsetY: hasAttr(el, "shadowOffsetY") ? numAttr(el, "shadowOffsetY") : undefined,
        clipMask: parseClipMask(el.getAttribute("clipMask")),
    };
}

// ── Per-type parsers ──────────────────────────────────────────────────────────

function parseText(el: Element, id: string, common: Partial<DesignElement>): DesignElement {
    let textShadows: DesignElement["textShadows"];
    const ts = el.getAttribute("textShadows");
    if (ts) {
        try { textShadows = JSON.parse(ts); } catch { /* ignore malformed JSON */ }
    }

    const gradColors = el.getAttribute("textGradientColors");
    const autoFit = boolAttr(el, "autoFitSize", false);
    let fontSize = numAttr(el, "fontSize", 32);
    const base = {
        ...common,
        id,
        type: "text",
        text: normalizeTextLines(el.textContent || ""),
        fontSize,
        autoFitSize: autoFit || undefined,
        fontFamily: el.getAttribute("fontFamily") || "system-ui, sans-serif",
        fontWeight: hasAttr(el, "fontWeight") ? numAttr(el, "fontWeight", 400) : 400,
        fontStyle: (el.getAttribute("fontStyle") as "normal" | "italic") || "normal",
        color: el.getAttribute("color") || "#ffffff",
        textAlign: (el.getAttribute("textAlign") as "left" | "center" | "right") || "left",
        verticalAlign: (el.getAttribute("verticalAlign") as "top" | "middle" | "bottom") || "top",
        letterSpacing: hasAttr(el, "letterSpacing") ? numAttr(el, "letterSpacing") : undefined,
        lineHeight: hasAttr(el, "lineHeight") ? numAttr(el, "lineHeight") : undefined,
        wordSpacing: hasAttr(el, "wordSpacing") ? numAttr(el, "wordSpacing") : undefined,
        textIndent: hasAttr(el, "textIndent") ? numAttr(el, "textIndent") : undefined,
        textTransform: strAttr(el, "textTransform") as any,
        textDecoration: strAttr(el, "textDecoration") as any,
        fontVariant: strAttr(el, "fontVariant") as any,
        charScaleX: hasAttr(el, "charScaleX") ? numAttr(el, "charScaleX") : undefined,
        charScaleY: hasAttr(el, "charScaleY") ? numAttr(el, "charScaleY") : undefined,
        textStrokeColor: strAttr(el, "textStrokeColor"),
        textStrokeWidth: hasAttr(el, "textStrokeWidth") ? numAttr(el, "textStrokeWidth") : undefined,
        textBgColor: strAttr(el, "textBgColor"),
        textGradient: strAttr(el, "textGradient"),
        textGradientColors: gradColors ? gradColors.split(",") : undefined,
        textShadows,
        textPaddingLeft: hasAttr(el, "textPaddingLeft") ? numAttr(el, "textPaddingLeft") : undefined,
        textPaddingRight: hasAttr(el, "textPaddingRight") ? numAttr(el, "textPaddingRight") : undefined,
        textPaddingTop: hasAttr(el, "textPaddingTop") ? numAttr(el, "textPaddingTop") : undefined,
        textPaddingBottom: hasAttr(el, "textPaddingBottom") ? numAttr(el, "textPaddingBottom") : undefined,
        textOutlineColor: strAttr(el, "textOutlineColor"),
        textOutlineWidth: hasAttr(el, "textOutlineWidth") ? numAttr(el, "textOutlineWidth") : undefined,
        textOverflow: strAttr(el, "textOverflow") as any,
        leftAnchor: strAttr(el, "leftAnchor"),
        leftAnchorOffset: hasAttr(el, "leftAnchorOffset") ? numAttr(el, "leftAnchorOffset") : undefined,
        rightAnchor: strAttr(el, "rightAnchor"),
        rightAnchorOffset: hasAttr(el, "rightAnchorOffset") ? numAttr(el, "rightAnchorOffset") : undefined,
    } as DesignElement;
    if (autoFit) {
        const autoSize = calculateOptimalFontSize(base as DesignElement);
        if (autoSize !== null) {
            base.fontSize = autoSize;
        }
    }
    return base as DesignElement;
}

function parseImage(el: Element, id: string, common: Partial<DesignElement>): DesignElement {
    return {
        ...common,
        id,
        type: "image",
        // Preserve src as-is; @base64_img_* placeholders stay as empty string or placeholder
        // (the LLM is instructed never to touch them).
        src: el.getAttribute("src") || "",
        // Filters — undefined when absent (not default values, to allow correct round-trip)
        imgBrightness: hasAttr(el, "imgBrightness") ? numAttr(el, "imgBrightness") : undefined,
        imgContrast: hasAttr(el, "imgContrast") ? numAttr(el, "imgContrast") : undefined,
        imgSaturation: hasAttr(el, "imgSaturation") ? numAttr(el, "imgSaturation") : undefined,
        imgBlur: hasAttr(el, "imgBlur") ? numAttr(el, "imgBlur") : undefined,
        // Crop — undefined when absent
        cropX: hasAttr(el, "cropX") ? numAttr(el, "cropX") : undefined,
        cropY: hasAttr(el, "cropY") ? numAttr(el, "cropY") : undefined,
        cropW: hasAttr(el, "cropW") ? numAttr(el, "cropW") : undefined,
        cropH: hasAttr(el, "cropH") ? numAttr(el, "cropH") : undefined,
    } as DesignElement;
}

function parseShape(el: Element, id: string, common: Partial<DesignElement>, tag: string): DesignElement {
    const fillGradColors = el.getAttribute("fillGradientColors");

    // Attribute name mapping: new DSL uses shapeKind/backgroundColor,
    // legacy <figure> used type/bgColor.
    const shapeKind =
        el.getAttribute("shapeKind") ||
        el.getAttribute("type") ||
        "rect";
    const backgroundColor =
        el.getAttribute("backgroundColor") ||
        el.getAttribute("bgColor") ||
        "#cccccc";

    return {
        ...common,
        id,
        type: "shape",
        shapeKind: shapeKind as any,
        backgroundColor,
        borderColor: strAttr(el, "borderColor"),
        borderWidth: hasAttr(el, "borderWidth") ? numAttr(el, "borderWidth") : 0,
        borderStyle: (el.getAttribute("borderStyle") as any) || "solid",
        borderRadius: hasAttr(el, "borderRadius") ? numAttr(el, "borderRadius") : 0,
        borderRadiusTL: hasAttr(el, "borderRadiusTL") ? numAttr(el, "borderRadiusTL") : undefined,
        borderRadiusTR: hasAttr(el, "borderRadiusTR") ? numAttr(el, "borderRadiusTR") : undefined,
        borderRadiusBR: hasAttr(el, "borderRadiusBR") ? numAttr(el, "borderRadiusBR") : undefined,
        borderRadiusBL: hasAttr(el, "borderRadiusBL") ? numAttr(el, "borderRadiusBL") : undefined,
        fillGradient: strAttr(el, "fillGradient"),
        fillGradientColors: fillGradColors ? fillGradColors.split(",") : undefined,
        // Legacy <figure> compatibility: they had no borderColor/Width attrs
        ...(tag === "figure" ? { borderColor: "transparent", borderWidth: 0 } : {}),
    } as DesignElement;
}

function parseSvg(el: Element, id: string, common: Partial<DesignElement>): DesignElement {
    return {
        ...common,
        id,
        type: "svg",
        svgContent: el.getAttribute("svgContent") || "",
    } as DesignElement;
}

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
        const pageGap = config.pageGap ? parseInt(config.pageGap, 10) : 0;
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

            const startX = pageOffset(pages, pi, pageGap);

            // ── Elements (new DSL + legacy <figure>) ──────────────────────────────
            const children = Array.from(
                pg.querySelectorAll(":scope > text, :scope > image, :scope > shape, :scope > svg, :scope > figure"),
            );

            for (const el of children) {
                const tag = el.tagName.toLowerCase();
                const rawId = el.getAttribute("id");
                // Generate a unique fallback ID if none provided.
                // Using timestamp+random to avoid collisions with existing elements.
                const elId = rawId || `el_${Date.now()}_${elCounter++}_${Math.random().toString(36).slice(2, 6)}`;
                const common = parseCommon(el, startX, elements.length);

                let parsed: DesignElement | null = null;

                if (tag === "text") {
                    parsed = parseText(el, elId, common);
                } else if (tag === "image") {
                    parsed = parseImage(el, elId, common);
                } else if (tag === "shape" || tag === "figure") {
                    parsed = parseShape(el, elId, common, tag);
                } else if (tag === "svg") {
                    parsed = parseSvg(el, elId, common);
                }

                if (parsed) elements.push(parsed);
            }
        }

        const hasGuideElements = !!(config as any).__hasGuideElements;
        delete (config as any).__hasGuideElements;

        // ── Anchor offset resolution ─────────────────────────────────────────
        // Helper: resolve canvas-global page start from a guide's pageNumber.
        // Using guide.pageNumber is the authoritative method; inferring from el.x
        // is unreliable because the AI may write a placeholder x (e.g. x="0")
        // knowing the anchor will override it.
        const guidePageStart = (g: GuideData): number => {
            const pageIdx = g.pageNumber !== undefined ? g.pageNumber - 1 : 0;
            let off = 0;
            for (let i = 0; i < pageIdx && i < pages.length - 1; i++) {
                off += pages[i].width + pageGap;
            }
            return off;
        };

        // Pass 1 — Fill in missing offset values.
        // CONTRACT: when leftAnchorOffset is absent from the JSX the serialiser
        // omitted it because it was 0 (0 is the default). So we default to 0 here.
        // We NEVER back-calculate from el.x because el.x may be a placeholder.
        for (const el of elements) {
            if (!el.leftAnchor && !el.rightAnchor) continue;
            if (el.leftAnchor && el.leftAnchorOffset === undefined) {
                el.leftAnchorOffset = 0;
            }
            if (el.rightAnchor && el.rightAnchorOffset === undefined) {
                el.rightAnchorOffset = 0;
            }
        }

        // Pass 2 — Recompute el.x (and el.width when both anchors are set) from
        // the authoritative formula: position = guide.position + pageStart + offset.
        // This overrides whatever placeholder x the AI wrote in the JSX.
        for (const el of elements) {
            if (!el.leftAnchor && !el.rightAnchor) continue;
            if (el.leftAnchor && el.leftAnchorOffset !== undefined) {
                const g = guides.find((gd) => gd.id === el.leftAnchor);
                if (g) {
                    const ps = guidePageStart(g);
                    el.x = g.position + ps + el.leftAnchorOffset;
                }
            }
            if (el.rightAnchor && el.rightAnchorOffset !== undefined) {
                const g = guides.find((gd) => gd.id === el.rightAnchor);
                if (g) {
                    const ps = guidePageStart(g);
                    const newRight = g.position + ps + el.rightAnchorOffset;
                    if (el.leftAnchor) {
                        el.width = Math.max(10, newRight - el.x);
                    } else {
                        el.x = newRight - el.width;
                    }
                }
            }
        }

        return { ok: true, data: { elements, pages, pageGap, guides, hasGuideElements, config } };
    } catch (e: any) {
        return { ok: false, error: e?.message || String(e) };
    }
}
