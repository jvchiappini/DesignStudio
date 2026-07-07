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

interface GuideData {
    id: string;
    position: number;
    orientation: "horizontal" | "vertical";
    pageId?: string;
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

// ── Attribute helpers ─────────────────────────────────────────────────────────

/** Quote a value for use as an XML attribute: "value" */
function q(v: unknown): string {
    return `"${String(v).replace(/"/g, "&quot;")}"`;
}

/** Emit ` key="value"` only when value !== undefined && value !== null && value !== default */
function a(k: string, v: unknown, def?: unknown): string {
    return v !== undefined && v !== null && v !== def ? ` ${k}=${q(v)}` : "";
}

/** Emit ` key="value"` for booleans only when value !== default */
function ab(k: string, v: unknown, def: boolean): string {
    return v !== undefined && v !== null && v !== def ? ` ${k}=${q(v)}` : "";
}

// ── Page offset helper ────────────────────────────────────────────────────────

export function pageOffset(pages: Page[], index: number, gap: number): number {
    let off = 0;
    for (let i = 0; i < index; i++) off += pages[i].width + gap;
    return off;
}

// ── Common attributes shared by ALL element types ─────────────────────────────

function commonAttrs(el: DesignElement, rx: number): string {
    return (
        ` id=${q(el.id)}` +
        a("x", rx) +
        a("y", el.y) +
        a("w", el.width) +
        a("h", el.height) +
        a("rotation", el.rotation, 0) +
        a("opacity", el.opacity !== undefined && el.opacity !== 1 ? el.opacity : undefined) +
        a("zIndex", el.zIndex) +
        a("mixBlendMode", el.mixBlendMode, "normal") +
        ab("flipH", el.flipH, false) +
        ab("flipV", el.flipV, false) +
        ab("locked", el.locked, false) +
        ab("hidden", el.hidden, false) +
        a("groupId", el.groupId) +
        a("shadowColor", el.shadowColor) +
        a("shadowBlur", el.shadowBlur, 0) +
        a("shadowOffsetX", el.shadowOffsetX, 0) +
        a("shadowOffsetY", el.shadowOffsetY, 0)
    );
}

// ── Per-type serializers ──────────────────────────────────────────────────────

function serializeText(el: DesignElement, rx: number): string {
    const textShadowsStr =
        el.textShadows && el.textShadows.length > 0
            ? `'${JSON.stringify(el.textShadows)}'`
            : null;
    const txt = (el.text ?? "").replace(/"/g, "&quot;");
    const clipStr = el.clipMask ? `${el.clipMask.type}:${el.clipMask.value}` : null;
    const elBgStyle = hasActiveLayers(el.bgLayers) ? layersToBackground(el.bgLayers) : null;

    return (
        `    <text${commonAttrs(el, rx)}` +
        a("fontSize", el.fontSize) +
        a("fontFamily", el.fontFamily, "system-ui, sans-serif") +
        a("fontWeight", el.fontWeight, 400) +
        a("fontStyle", el.fontStyle, "normal") +
        a("color", el.color, "#ffffff") +
        a("textAlign", el.textAlign, "left") +
        a("verticalAlign", el.verticalAlign, "top") +
        a("letterSpacing", el.letterSpacing, 0) +
        a("lineHeight", el.lineHeight, 1.2) +
        a("wordSpacing", el.wordSpacing, 0) +
        a("textIndent", el.textIndent, 0) +
        a("textTransform", el.textTransform, "none") +
        a("textDecoration", el.textDecoration, "none") +
        a("fontVariant", el.fontVariant, "normal") +
        a("charScaleX", el.charScaleX, 100) +
        a("charScaleY", el.charScaleY, 100) +
        a("textStrokeColor", el.textStrokeColor) +
        a("textStrokeWidth", el.textStrokeWidth, 0) +
        a("textBgColor", el.textBgColor) +
        a("textGradient", el.textGradient) +
        a("textGradientColors", el.textGradientColors?.join(",")) +
        (textShadowsStr ? ` textShadows=${textShadowsStr}` : "") +
        a("textPaddingLeft", el.textPaddingLeft, 4) +
        a("textPaddingRight", el.textPaddingRight, 4) +
        a("textPaddingTop", el.textPaddingTop, 4) +
        a("textPaddingBottom", el.textPaddingBottom, 4) +
        a("textOutlineColor", el.textOutlineColor) +
        a("textOutlineWidth", el.textOutlineWidth, 0) +
        a("textOverflow", el.textOverflow, "hidden") +
        a("clipMask", clipStr) +
        a("bgStyle", elBgStyle) +
        `>${txt}</text>\n`
    );
}

function serializeImage(el: DesignElement, rx: number, llmMode: boolean): string {
    const rawSrc = el.src ?? "";
    const isBase64 = rawSrc.startsWith("data:");
    // In LLM mode: replace base64 data URI with a short placeholder so we don't
    // flood the context window with encoded pixels. The LLM is instructed to
    // leave @base64_img_* values untouched.
    const src = llmMode && isBase64 ? `@base64_img_${el.id}` : rawSrc;
    const clipStr = el.clipMask ? `${el.clipMask.type}:${el.clipMask.value}` : null;
    const elBgStyle = hasActiveLayers(el.bgLayers) ? layersToBackground(el.bgLayers) : null;

    return (
        `    <image${commonAttrs(el, rx)}` +
        a("src", src) +
        // Filters — emit only when non-default (default = 100 for brightness/contrast/saturation, 0 for blur)
        a("imgBrightness", el.imgBrightness, 100) +
        a("imgContrast", el.imgContrast, 100) +
        a("imgSaturation", el.imgSaturation, 100) +
        a("imgBlur", el.imgBlur, 0) +
        // Crop — emit only when set
        a("cropX", el.cropX, 0) +
        a("cropY", el.cropY, 0) +
        a("cropW", el.cropW) +
        a("cropH", el.cropH) +
        a("clipMask", clipStr) +
        a("bgStyle", elBgStyle) +
        ` />\n`
    );
}

function serializeShape(el: DesignElement, rx: number): string {
    const clipStr = el.clipMask ? `${el.clipMask.type}:${el.clipMask.value}` : null;
    const elBgStyle = hasActiveLayers(el.bgLayers) ? layersToBackground(el.bgLayers) : null;

    return (
        `    <shape${commonAttrs(el, rx)}` +
        a("shapeKind", el.shapeKind, "rect") +
        a("backgroundColor", el.backgroundColor, "#cccccc") +
        a("borderColor", el.borderColor) +
        a("borderWidth", el.borderWidth, 0) +
        a("borderStyle", el.borderStyle, "solid") +
        a("borderRadius", el.borderRadius, 0) +
        a("borderRadiusTL", el.borderRadiusTL) +
        a("borderRadiusTR", el.borderRadiusTR) +
        a("borderRadiusBR", el.borderRadiusBR) +
        a("borderRadiusBL", el.borderRadiusBL) +
        a("fillGradient", el.fillGradient) +
        a("fillGradientColors", el.fillGradientColors?.join(",")) +
        a("clipMask", clipStr) +
        a("bgStyle", elBgStyle) +
        ` />\n`
    );
}

function serializeSvg(el: DesignElement, rx: number): string {
    const safeSvg = (el.svgContent ?? "").replace(/"/g, "&quot;");
    const elBgStyle = hasActiveLayers(el.bgLayers) ? layersToBackground(el.bgLayers) : null;
    return (
        `    <svg${commonAttrs(el, rx)}` +
        a("svgContent", safeSvg) +
        a("bgStyle", elBgStyle) +
        ` />\n`
    );
}

// ── Public: serialize a single element ───────────────────────────────────────

export function serializeElement(el: DesignElement, rx: number, llmMode: boolean): string {
    if (el.type === "text") return serializeText(el, rx);
    if (el.type === "image") return serializeImage(el, rx, llmMode);
    if (el.type === "shape") return serializeShape(el, rx);
    if (el.type === "svg") return serializeSvg(el, rx);
    return "";
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
        ca("pageGap", pageGap, 0) +
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
            ca("position", g.position) +
            ca("orientation", g.orientation) +
            (g.pageId ? ca("pageId", g.pageId) : "") +
            ` />\n`;
    }
    out += "  </config>\n";

    // <page> elements
    for (let pi = 0; pi < pages.length; pi++) {
        const pg = pages[pi];
        const startX = pageOffset(pages, pi, pageGap);
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
