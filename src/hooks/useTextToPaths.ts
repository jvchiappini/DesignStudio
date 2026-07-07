import { useCallback } from "react";
import type { DesignElement } from "../editor/utils/types";

type OpenTypeModule = {
  parse: (buf: ArrayBuffer) => {
    unitsPerEm: number;
    charToGlyph: (c: string) => { advanceWidth: number; getPath: (x: number, y: number, s: number) => { toPathData: () => string } };
    getKerningValue: (l: { advanceWidth: number; getPath: (x: number, y: number, s: number) => { toPathData: () => string } }, r: { advanceWidth: number; getPath: (x: number, y: number, s: number) => { toPathData: () => string } }) => number;
  };
};

export function useTextToPaths() {
  const convertToSvgPaths = useCallback(async (el: DesignElement): Promise<string | null> => {
    if (el.type !== "text" || !el.text) return null;

    try {
      const opentype = (await import("opentype.js")) as unknown as OpenTypeModule;

      const fontFamily = el.fontFamily?.split(",")[0]?.trim() ?? "sans-serif";

      const customFonts = getCustomFonts();
      const match = customFonts.find((f) => f.name === fontFamily);
      if (match) {
        const buf = base64ToArrayBuffer(match.dataUrl.split(",")[1]);
        const font = opentype.parse(buf);
        return generateSvgPaths(el, font);
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = el.width * 2;
      canvas.height = el.height * 2;
      ctx.font = `${el.fontStyle ?? "normal"} ${el.fontWeight ?? 400} ${el.fontSize! * 2}px "${fontFamily}"`;
      ctx.fillStyle = el.color ?? "#000";
      ctx.textBaseline = "top";
      ctx.fillText(el.text!, 0, 0);

      return canvasTextToSvg(el, ctx);
    } catch {
      return fallbackSvg(el);
    }
  }, []);

  return { convertToSvgPaths };
}

function getCustomFonts(): { name: string; dataUrl: string }[] {
  try {
    return JSON.parse(localStorage.getItem("design-studio-fonts") ?? "[]");
  } catch {
    return [];
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const bin = atob(base64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

function generateSvgPaths(el: DesignElement, font: {
  unitsPerEm: number;
  charToGlyph: (c: string) => { advanceWidth: number; getPath: (x: number, y: number, s: number) => { toPathData: () => string } };
  getKerningValue: (l: { advanceWidth: number; getPath: (x: number, y: number, s: number) => { toPathData: () => string } }, r: { advanceWidth: number; getPath: (x: number, y: number, s: number) => { toPathData: () => string } }) => number;
}): string {
  const fontSize = el.fontSize ?? 32;
  const scale = 1 / font.unitsPerEm * fontSize;
  const text = el.text ?? "";
  const x = 0;
  const y = 0;

  let pathData = "";
  let cursorX = x;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const glyph = font.charToGlyph(char);
    if (glyph) {
      const kerning = i > 0 ? font.getKerningValue(font.charToGlyph(text[i - 1]), glyph) : 0;
      cursorX += kerning * scale;
      const gPath = glyph.getPath(cursorX, y, fontSize);
      pathData += gPath.toPathData();
      cursorX += glyph.advanceWidth * scale;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${el.width}" height="${el.height}" viewBox="0 0 ${el.width} ${el.height}">
  <path d="${pathData}" fill="${el.color ?? "#000"}" />
</svg>`;
  return svg;
}

function canvasTextToSvg(el: DesignElement, _ctx: CanvasRenderingContext2D): string {
  const text = el.text ?? "";
  const fontSize = el.fontSize ?? 32;
  const fontFamily = el.fontFamily ?? "sans-serif";

  const lines = text.split("\n");
  const lineHeight = (el.lineHeight ?? 1.2) * fontSize;
  const totalH = lines.length * lineHeight;

  let yOffset = 0;
  if (el.verticalAlign === "top") yOffset = 0;
  else if (el.verticalAlign === "bottom") yOffset = el.height! - totalH;
  else yOffset = (el.height! - totalH) / 2;

  const textAlign = el.textAlign ?? "center";

  const texts = lines.map((line, i) => {
    let x = 0;
    if (textAlign === "center") x = el.width! / 2;
    else if (textAlign === "right") x = el.width!;

    const style = `font-family="${fontFamily}" font-size="${fontSize}" font-weight="${el.fontWeight ?? 400}" font-style="${el.fontStyle ?? "normal"}" fill="${el.color ?? "#000"}" text-anchor="${textAlign === "center" ? "middle" : textAlign === "right" ? "end" : "start"}"`;
    return `    <text x="${x}" y="${yOffset + i * lineHeight + fontSize * 0.85}" ${style}>${escapeXml(line)}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${el.width}" height="${el.height}" viewBox="0 0 ${el.width} ${el.height}">
${texts.join("\n")}
</svg>`;
}

function fallbackSvg(el: DesignElement): string {
  return canvasTextToSvg(el, null as unknown as CanvasRenderingContext2D);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
