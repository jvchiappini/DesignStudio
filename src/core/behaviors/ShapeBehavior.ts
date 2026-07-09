import type { DesignElement } from "../../editor/utils/types";
import type { ElementBehavior, ParseContext, SerializeContext } from "./ElementBehavior";
import { numAttr, strAttr, hasAttr, boolAttr, parseClipMask, a, ab, q } from "./parseHelpers";

export const ShapeBehavior: ElementBehavior<DesignElement> = {
  type: "shape",

  attrSchema: {
    numeric: new Set(["x", "y", "w", "h", "width", "height", "rotation", "opacity", "zIndex", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "borderWidth", "borderRadius", "borderRadiusTL", "borderRadiusTR", "borderRadiusBR", "borderRadiusBL", "leftAnchorOffset", "rightAnchorOffset", "topAnchorOffset", "bottomAnchorOffset"]),
    boolean: new Set(["flipH", "flipV", "locked", "hidden"]),
    enums: {
      shapeKind: new Set(["rect", "circle", "triangle", "star", "line"]),
      borderStyle: new Set(["solid", "dashed", "dotted"]),
      mixBlendMode: new Set(["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion"]),
    },
    strings: new Set(["id", "backgroundColor", "borderColor", "fillGradient", "fillGradientColors", "shadowColor", "leftAnchor", "rightAnchor", "topAnchor", "bottomAnchor", "groupId", "clipMask"]),
  },

  parse(ctx: ParseContext, id: string): DesignElement {
    const { el, startX, elementCount } = ctx;
    const tag = el.tagName.toLowerCase();
    const fillGradColors = el.getAttribute("fillGradientColors");
    const shapeKind = el.getAttribute("shapeKind") || el.getAttribute("type") || "rect";
    const backgroundColor = el.getAttribute("backgroundColor") || el.getAttribute("bgColor") || "#cccccc";
    return {
      id, type: "shape" as const,
      x: numAttr(el, "x") + startX, y: numAttr(el, "y"),
      width: numAttr(el, "w", 100), height: numAttr(el, "h", 100),
      rotation: numAttr(el, "rotation", 0), opacity: numAttr(el, "opacity", 1),
      zIndex: hasAttr(el, "zIndex") ? numAttr(el, "zIndex") : elementCount + 1,
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
      ...(tag === "figure" ? { borderColor: "transparent", borderWidth: 0 } : {}),
    } as DesignElement;
  },

  serialize(el: DesignElement, ctx: SerializeContext): string {
    const { rx } = ctx;
    return (
      `    <shape id=${q(el.id)}` +
      a("x", rx) + a("y", el.y) + a("w", el.width) + a("h", el.height) +
      a("rotation", el.rotation, 0) +
      a("opacity", el.opacity !== undefined && el.opacity !== 1 ? el.opacity : undefined) +
      a("zIndex", el.zIndex) +
      a("mixBlendMode", el.mixBlendMode, "normal") +
      ab("flipH", el.flipH, false) + ab("flipV", el.flipV, false) +
      ab("locked", el.locked, false) + ab("hidden", el.hidden, false) +
      a("groupId", el.groupId) +
      a("shadowColor", el.shadowColor) + a("shadowBlur", el.shadowBlur, 0) +
      a("shadowOffsetX", el.shadowOffsetX, 0) + a("shadowOffsetY", el.shadowOffsetY, 0) +
      a("shapeKind", el.shapeKind, "rect") +
      a("backgroundColor", el.backgroundColor, "#cccccc") +
      a("borderColor", el.borderColor) + a("borderWidth", el.borderWidth, 0) +
      a("borderStyle", el.borderStyle, "solid") + a("borderRadius", el.borderRadius, 0) +
      a("borderRadiusTL", el.borderRadiusTL) + a("borderRadiusTR", el.borderRadiusTR) +
      a("borderRadiusBR", el.borderRadiusBR) + a("borderRadiusBL", el.borderRadiusBL) +
      a("fillGradient", el.fillGradient) + a("fillGradientColors", el.fillGradientColors?.join(",")) +
      (el.clipMask ? a("clipMask", `${el.clipMask.type}:${el.clipMask.value}`) : "") +
      ` />\n`
    );
  },

  render(): any {
    return { style: {}, content: null };
  },

  validate(el: DesignElement): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];
    if (!el.shapeKind) errors.push({ field: "shapeKind", message: "Shape kind is required" });
    return errors;
  },

  createDefault(overrides?: Partial<DesignElement>): DesignElement {
    return { id: `shape_${Date.now()}`, type: "shape", x: 60, y: 60, width: 200, height: 200, rotation: 0, opacity: 1, zIndex: 1, shapeKind: "rect", backgroundColor: "#4f46e5", ...overrides } as DesignElement;
  },
};
