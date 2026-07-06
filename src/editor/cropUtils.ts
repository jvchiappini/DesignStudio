import type { DesignElement } from "./types";

export function applyCrop(el: DesignElement): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ew = el.width;
      const eh = el.height;

      const cw = el.cropW ?? ew;
      const ch = el.cropH ?? eh;
      const cx = el.cropX ?? 0;
      const cy = el.cropY ?? 0;

      const scaleX = img.naturalWidth / ew;
      const scaleY = img.naturalHeight / eh;

      const sx = cx * scaleX;
      const sy = cy * scaleY;
      const sw = cw * scaleX;
      const sh = ch * scaleY;

      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = el.src ?? "";
  });
}

export interface CropCoords {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Programmatic crop that works on any element type.
 * - For images: physically crops the pixels via canvas, returns new src.
 * - For other types: sets clipMask to a rectangle inset.
 * Returns the updates to apply to the element (or null on failure).
 */
export async function applyCropByCoords(
  el: DesignElement,
  coords: CropCoords,
): Promise<Partial<DesignElement> | null> {
  if (el.type === "image" && el.src) {
    const result = await applyCrop({
      ...el,
      cropX: coords.x,
      cropY: coords.y,
      cropW: coords.width,
      cropH: coords.height,
    });
    if (!result) return { cropX: coords.x, cropY: coords.y, cropW: coords.width, cropH: coords.height };
    return {
      src: result,
      width: coords.width,
      height: coords.height,
      cropX: undefined,
      cropY: undefined,
      cropW: undefined,
      cropH: undefined,
    };
  }
  return {
    clipMask: { type: "inset", value: `${coords.y}px ${el.width - coords.x - coords.width}px ${el.height - coords.y - coords.height}px ${coords.x}px` },
  };
}

/** Return the effective crop region for an element */
export function getCropRegion(el: DesignElement): CropCoords {
  if (el.clipMask?.type === "inset") {
    const vals = el.clipMask.value.split(/\s+/).map(parseFloat);
    const top = vals[0] ?? 0;
    const right = vals[1] ?? 0;
    const bottom = vals[2] ?? 0;
    const left = vals[3] ?? 0;
    return { x: left, y: top, width: el.width - left - right, height: el.height - top - bottom };
  }
  return {
    x: el.cropX ?? 0,
    y: el.cropY ?? 0,
    width: el.cropW ?? el.width,
    height: el.cropH ?? el.height,
  };
}
