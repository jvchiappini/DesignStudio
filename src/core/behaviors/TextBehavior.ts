import type { DesignElement } from "../../editor/utils/types";
import type { ElementBehavior, ParseContext, SerializeContext } from "./ElementBehavior";
import { numAttr, strAttr, boolAttr, hasAttr, parseClipMask } from "./parseHelpers";

function normalizeTextLines(text: string): string {
  return text.trim().split("\n").map(l => l.trim()).join("\n");
}

export const TextBehavior: ElementBehavior<DesignElement> = {
  type: "text",

  attrSchema: {
    numeric: new Set(["x", "y", "w", "h", "width", "height", "rotation", "opacity", "zIndex", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "fontSize", "fontWeight", "letterSpacing", "lineHeight", "wordSpacing", "textIndent", "charScaleX", "charScaleY", "textStrokeWidth", "textPaddingLeft", "textPaddingRight", "textPaddingTop", "textPaddingBottom", "textOutlineWidth", "leftAnchorOffset", "rightAnchorOffset", "topAnchorOffset", "bottomAnchorOffset"]),
    boolean: new Set(["flipH", "flipV", "locked", "hidden", "autoFitSize"]),
    enums: {
      textAlign: new Set(["left", "center", "right"]),
      verticalAlign: new Set(["top", "middle", "bottom"]),
      fontStyle: new Set(["normal", "italic"]),
      fontVariant: new Set(["normal", "small-caps"]),
      textDecoration: new Set(["none", "underline", "line-through"]),
      textTransform: new Set(["none", "uppercase", "lowercase", "capitalize"]),
      textOverflow: new Set(["visible", "hidden", "clip", "ellipsis"]),
      mixBlendMode: new Set(["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion"]),
    },
    strings: new Set(["id", "fontFamily", "color", "textBgColor", "textGradient", "textGradientColors", "textStrokeColor", "textOutlineColor", "shadowColor", "leftAnchor", "rightAnchor", "topAnchor", "bottomAnchor", "groupId", "clipMask", "text", "textShadows"]),
  },

  parse(ctx: ParseContext, id: string): DesignElement {
    const { el, startX, elementCount } = ctx;
    let textShadows: DesignElement["textShadows"];
    const ts = el.getAttribute("textShadows");
    if (ts) { try { textShadows = JSON.parse(ts); } catch { /* ignore */ } }

    const gradColors = el.getAttribute("textGradientColors");
    const autoFit = boolAttr(el, "autoFitSize", false);
    let fontSize = numAttr(el, "fontSize", 32);

    const base = {
      id, type: "text" as const,
      x: numAttr(el, "x") + startX,
      y: numAttr(el, "y"),
      width: numAttr(el, "w", 100),
      height: numAttr(el, "h", 100),
      rotation: numAttr(el, "rotation", 0),
      opacity: numAttr(el, "opacity", 1),
      zIndex: hasAttr(el, "zIndex") ? numAttr(el, "zIndex") : elementCount + 1,
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
      topAnchor: strAttr(el, "topAnchor"),
      topAnchorOffset: hasAttr(el, "topAnchorOffset") ? numAttr(el, "topAnchorOffset") : undefined,
      bottomAnchor: strAttr(el, "bottomAnchor"),
      bottomAnchorOffset: hasAttr(el, "bottomAnchorOffset") ? numAttr(el, "bottomAnchorOffset") : undefined,
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
    } as DesignElement;

    return base;
  },

  serialize(el: DesignElement, ctx: SerializeContext): string {
    const { rx } = ctx;
    const q = (v: unknown) => `"${String(v).replace(/"/g, "&quot;")}"`;
    const a = (k: string, v: unknown, def?: unknown) =>
      v !== undefined && v !== null && v !== def ? ` ${k}=${q(v)}` : "";
    const ab = (k: string, v: unknown, def: boolean) =>
      v !== undefined && v !== null && v !== def ? ` ${k}=${q(v)}` : "";

    const textShadowsStr = el.textShadows?.length ? `'${JSON.stringify(el.textShadows)}'` : null;
    const txt = (el.text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    return (
      `    <text` +
      ` id=${q(el.id)}` +
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
      a("charScaleX", el.charScaleX, 100) + a("charScaleY", el.charScaleY, 100) +
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
      a("leftAnchor", el.leftAnchor) + a("leftAnchorOffset", el.leftAnchorOffset, 0) +
      a("rightAnchor", el.rightAnchor) + a("rightAnchorOffset", el.rightAnchorOffset, 0) +
      a("topAnchor", el.topAnchor) + a("topAnchorOffset", el.topAnchorOffset, 0) +
      a("bottomAnchor", el.bottomAnchor) + a("bottomAnchorOffset", el.bottomAnchorOffset, 0) +
      (el.clipMask ? a("clipMask", `${el.clipMask.type}:${el.clipMask.value}`) : "") +
      `>${txt}</text>\n`
    );
  },

  render(el: DesignElement): any {
    // Returns style + content — consumers call this and apply positioning
    return { style: {}, content: el.text };
  },

  validate(el: DesignElement): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];
    if (el.text === undefined || el.text === "") errors.push({ field: "text", message: "Text content is empty" });
    return errors;
  },

  createDefault(overrides?: Partial<DesignElement>): DesignElement {
    return {
      id: `text_${Date.now()}`,
      type: "text",
      x: 60, y: 60, width: 300, height: 80,
      rotation: 0, opacity: 1, zIndex: 1,
      text: "Texto",
      fontSize: 32,
      fontFamily: "system-ui, sans-serif",
      fontWeight: 400,
      fontStyle: "normal",
      textAlign: "center",
      color: "#ffffff",
      ...overrides,
    } as DesignElement;
  },
};
