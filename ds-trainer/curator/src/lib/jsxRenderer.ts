// ─────────────────────────────────────────────────────────────────────────────
// jsxRenderer.ts
// Lightweight parser + renderer for DesignStudio JSX format.
// Self-contained, zero dependencies on the editor.
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedPage {
    width: number;
    height: number;
    bgColor: string;
    name: string;
    elements: ParsedElement[];
}

export interface ParsedGuide {
    id: string;
    position: number;
    orientation: "horizontal" | "vertical";
    pageNumber?: number;
}

export interface ParsedElement {
    type: "text" | "image" | "shape" | "unknown";
    x: number; y: number;
    w: number; h: number;
    // text
    text?: string;
    fontSize?: number;
    fontWeight?: number | string;
    fontFamily?: string;
    color?: string;
    textAlign?: string;
    letterSpacing?: number;
    textTransform?: string;
    lineHeight?: number;
    verticalAlign?: string;
    fontStyle?: string;
    // image
    src?: string;
    // shape
    bgColor?: string;
    borderRadius?: number;
    // anchors (raw strings for display only)
    leftAnchor?: string;
    rightAnchor?: string;
}

export interface ParsedProject {
    pages: ParsedPage[];
    guides: ParsedGuide[];
    pageGap: number;
    ok: boolean;
    error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function numAttr(el: Element, attr: string, def = 0): number {
    const v = el.getAttribute(attr);
    return v !== null && v !== "" ? parseFloat(v) : def;
}

function strAttr(el: Element, attr: string, def = ""): string {
    return el.getAttribute(attr) ?? def;
}

// ─── Main parser ─────────────────────────────────────────────────────────────

export function parseDesignJsx(jsxStr: string): ParsedProject {
    try {
        let xml = jsxStr.trim();
        // Escape bare & not part of an entity
        xml = xml.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;");

        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const err = doc.querySelector("parsererror");
        if (err) return { pages: [], guides: [], pageGap: 60, ok: false, error: err.textContent?.slice(0, 200) };

        const root = doc.documentElement;
        if (root.tagName !== "project") return { pages: [], guides: [], pageGap: 60, ok: false, error: "Root must be <project>" };

        // Config & guides
        const configEl = root.querySelector(":scope > config");
        const pageGap = configEl ? parseInt(strAttr(configEl, "pageGap", "60"), 10) : 60;
        const guides: ParsedGuide[] = [];

        if (configEl) {
            configEl.querySelectorAll(":scope > guide").forEach((g, i) => {
                const orient = strAttr(g, "orientation") as "horizontal" | "vertical";
                const pn = g.getAttribute("pageNumber");
                guides.push({
                    id: strAttr(g, "id", `g_${i}`),
                    position: numAttr(g, "position"),
                    orientation: orient || "vertical",
                    pageNumber: pn ? parseInt(pn, 10) : undefined,
                });
            });
        }

        // Pages
        const pageNodes = root.querySelectorAll(":scope > page");
        const pages: ParsedPage[] = [];

        pageNodes.forEach((pg, pi) => {
            const w = numAttr(pg, "width", 2480);
            const h = numAttr(pg, "height", 3508);
            const bg = strAttr(pg, "bgColor", "#1a1a2e");
            const name = strAttr(pg, "name", `Page ${pi + 1}`);
            const elements: ParsedElement[] = [];

            // Resolve guide positions for this page (for anchor resolution)
            const pageGuides: Record<string, number> = {};
            guides.filter(g => g.pageNumber === undefined || g.pageNumber === pi + 1)
                .forEach(g => { pageGuides[g.id] = g.position; });

            const elNodes = pg.querySelectorAll(":scope > text, :scope > image, :scope > shape, :scope > svg");
            elNodes.forEach((el) => {
                const tag = el.tagName.toLowerCase();
                let x = numAttr(el, "x");
                let elW = numAttr(el, "w", numAttr(el, "width", 100));

                // Resolve left/right anchors approximately
                const la = el.getAttribute("leftAnchor");
                const ra = el.getAttribute("rightAnchor");
                const lao = numAttr(el, "leftAnchorOffset");
                const rao = numAttr(el, "rightAnchorOffset");

                if (la && pageGuides[la] !== undefined) {
                    x = pageGuides[la] + lao;
                }
                if (ra && pageGuides[ra] !== undefined) {
                    elW = pageGuides[ra] + rao - x;
                }

                const base = {
                    x,
                    y: numAttr(el, "y"),
                    w: Math.max(elW, 0),
                    h: numAttr(el, "h", numAttr(el, "height", 60)),
                    leftAnchor: la ?? undefined,
                    rightAnchor: ra ?? undefined,
                };

                if (tag === "text") {
                    elements.push({
                        type: "text",
                        ...base,
                        text: el.textContent?.trim() ?? "",
                        fontSize: numAttr(el, "fontSize", 16),
                        fontWeight: el.getAttribute("fontWeight") ?? "400",
                        fontFamily: el.getAttribute("fontFamily") ?? "Inter, sans-serif",
                        color: el.getAttribute("color") ?? "#ffffff",
                        textAlign: el.getAttribute("textAlign") ?? "left",
                        letterSpacing: numAttr(el, "letterSpacing"),
                        textTransform: el.getAttribute("textTransform") ?? "none",
                        lineHeight: numAttr(el, "lineHeight", 1.4),
                        verticalAlign: el.getAttribute("verticalAlign") ?? "top",
                        fontStyle: el.getAttribute("fontStyle") ?? "normal",
                    });
                } else if (tag === "image") {
                    elements.push({ type: "image", ...base, src: el.getAttribute("src") ?? "" });
                } else if (tag === "shape") {
                    elements.push({
                        type: "shape", ...base,
                        bgColor: el.getAttribute("backgroundColor") ?? el.getAttribute("bgColor") ?? "#888",
                        borderRadius: numAttr(el, "borderRadius"),
                    });
                } else {
                    elements.push({ type: "unknown", ...base });
                }
            });

            pages.push({ width: w, height: h, bgColor: bg, name, elements });
        });

        return { pages, guides, pageGap, ok: true };
    } catch (e: any) {
        return { pages: [], guides: [], pageGap: 60, ok: false, error: e?.message };
    }
}
