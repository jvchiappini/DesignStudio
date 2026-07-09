import type { DesignElement } from "../../editor/utils/types";
import type { ElementBehavior, ParseContext, SerializeContext } from "./ElementBehavior";
import { numAttr, strAttr, hasAttr, boolAttr, a, ab, q } from "./parseHelpers";

export const SvgBehavior: ElementBehavior<DesignElement> = {
  type: "svg",

  attrSchema: {
    numeric: new Set(["x", "y", "w", "h", "width", "height", "rotation", "opacity", "zIndex", "shadowBlur", "shadowOffsetX", "shadowOffsetY"]),
    boolean: new Set(["flipH", "flipV", "locked", "hidden"]),
    enums: {
      mixBlendMode: new Set(["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion"]),
    },
    strings: new Set(["id", "svgContent", "shadowColor", "groupId", "clipMask"]),
  },

  parse(ctx: ParseContext, id: string): DesignElement {
    const { el, startX, elementCount } = ctx;
    return {
      id, type: "svg" as const,
      x: numAttr(el, "x") + startX, y: numAttr(el, "y"),
      width: numAttr(el, "w", 100), height: numAttr(el, "h", 100),
      rotation: numAttr(el, "rotation", 0), opacity: numAttr(el, "opacity", 1),
      zIndex: hasAttr(el, "zIndex") ? numAttr(el, "zIndex") : elementCount + 1,
      svgContent: el.getAttribute("svgContent") || "",
      mixBlendMode: strAttr(el, "mixBlendMode"),
      flipH: boolAttr(el, "flipH", false) || undefined,
      flipV: boolAttr(el, "flipV", false) || undefined,
      locked: boolAttr(el, "locked", false) || undefined,
      hidden: boolAttr(el, "hidden", false) || undefined,
      groupId: strAttr(el, "groupId"),
    } as DesignElement;
  },

  serialize(el: DesignElement, ctx: SerializeContext): string {
    const { rx } = ctx;
    const safeSvg = (el.svgContent ?? "").replace(/"/g, "&quot;");
    return (
      `    <svg id=${q(el.id)}` +
      a("x", rx) + a("y", el.y) + a("w", el.width) + a("h", el.height) +
      a("rotation", el.rotation, 0) +
      a("opacity", el.opacity !== undefined && el.opacity !== 1 ? el.opacity : undefined) +
      a("zIndex", el.zIndex) +
      a("mixBlendMode", el.mixBlendMode, "normal") +
      ab("flipH", el.flipH, false) + ab("flipV", el.flipV, false) +
      ab("locked", el.locked, false) + ab("hidden", el.hidden, false) +
      a("groupId", el.groupId) +
      a("svgContent", safeSvg) +
      ` />\n`
    );
  },

  render(): any {
    return { style: {}, content: null };
  },

  validate(el: DesignElement): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];
    if (!el.svgContent) errors.push({ field: "svgContent", message: "SVG content is empty" });
    return errors;
  },

  createDefault(overrides?: Partial<DesignElement>): DesignElement {
    return { id: `svg_${Date.now()}`, type: "svg", x: 60, y: 60, width: 300, height: 300, rotation: 0, opacity: 1, zIndex: 1, svgContent: "", ...overrides } as DesignElement;
  },
};
