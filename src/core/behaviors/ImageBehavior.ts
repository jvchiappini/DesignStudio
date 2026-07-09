import type { DesignElement } from "../../editor/utils/types";
import type { ElementBehavior, ParseContext, SerializeContext } from "./ElementBehavior";
import { numAttr, strAttr, hasAttr, boolAttr, parseClipMask, a, ab, q } from "./parseHelpers";

export const ImageBehavior: ElementBehavior<DesignElement> = {
  type: "image",

  attrSchema: {
    numeric: new Set(["x", "y", "w", "h", "width", "height", "rotation", "opacity", "zIndex", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "imgBrightness", "imgContrast", "imgSaturation", "imgBlur", "cropX", "cropY", "cropW", "cropH", "leftAnchorOffset", "rightAnchorOffset", "topAnchorOffset", "bottomAnchorOffset"]),
    boolean: new Set(["flipH", "flipV", "locked", "hidden"]),
    enums: {
      mixBlendMode: new Set(["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion"]),
    },
    strings: new Set(["id", "src", "shadowColor", "leftAnchor", "rightAnchor", "topAnchor", "bottomAnchor", "groupId", "clipMask"]),
  },

  parse(ctx: ParseContext, id: string): DesignElement {
    const { el, startX, elementCount } = ctx;
    return {
      id, type: "image" as const,
      x: numAttr(el, "x") + startX, y: numAttr(el, "y"),
      width: numAttr(el, "w", 100), height: numAttr(el, "h", 100),
      rotation: numAttr(el, "rotation", 0), opacity: numAttr(el, "opacity", 1),
      zIndex: hasAttr(el, "zIndex") ? numAttr(el, "zIndex") : elementCount + 1,
      src: el.getAttribute("src") || "",
      imgBrightness: hasAttr(el, "imgBrightness") ? numAttr(el, "imgBrightness") : undefined,
      imgContrast: hasAttr(el, "imgContrast") ? numAttr(el, "imgContrast") : undefined,
      imgSaturation: hasAttr(el, "imgSaturation") ? numAttr(el, "imgSaturation") : undefined,
      imgBlur: hasAttr(el, "imgBlur") ? numAttr(el, "imgBlur") : undefined,
      cropX: hasAttr(el, "cropX") ? numAttr(el, "cropX") : undefined,
      cropY: hasAttr(el, "cropY") ? numAttr(el, "cropY") : undefined,
      cropW: hasAttr(el, "cropW") ? numAttr(el, "cropW") : undefined,
      cropH: hasAttr(el, "cropH") ? numAttr(el, "cropH") : undefined,
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
  },

  serialize(el: DesignElement, ctx: SerializeContext): string {
    const { rx, llmMode } = ctx;
    const rawSrc = el.src ?? "";
    const isBase64 = rawSrc.startsWith("data:");
    const src = llmMode && isBase64 ? `@base64_img_${el.id}` : rawSrc;
    return (
      `    <image id=${q(el.id)}` +
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
      a("src", src) +
      a("imgBrightness", el.imgBrightness, 100) + a("imgContrast", el.imgContrast, 100) +
      a("imgSaturation", el.imgSaturation, 100) + a("imgBlur", el.imgBlur, 0) +
      a("cropX", el.cropX, 0) + a("cropY", el.cropY, 0) +
      a("cropW", el.cropW) + a("cropH", el.cropH) +
      (el.clipMask ? a("clipMask", `${el.clipMask.type}:${el.clipMask.value}`) : "") +
      ` />\n`
    );
  },

  render(): any {
    return { style: {}, content: null };
  },

  validate(el: DesignElement): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];
    if (!el.src) errors.push({ field: "src", message: "Image source is empty" });
    return errors;
  },

  createDefault(overrides?: Partial<DesignElement>): DesignElement {
    return { id: `img_${Date.now()}`, type: "image", x: 60, y: 60, width: 300, height: 300, rotation: 0, opacity: 1, zIndex: 1, src: "", ...overrides } as DesignElement;
  },
};
