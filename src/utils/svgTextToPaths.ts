export function svgHasPaths(svgContent: string): boolean {
  return /d\s*=\s*"/.test(svgContent);
}

export function svgHasTextElements(svgContent: string): boolean {
  return /<text\s/.test(svgContent);
}

function extractAttr(svg: string, name: string, fallback: string): string {
  const m = svg.match(new RegExp(`${name}\\s*=\\s*"([^"]+)"`));
  return m ? m[1] : fallback;
}

function extractNum(svg: string, name: string, fallback: number): number {
  const m = svg.match(new RegExp(`${name}\\s*=\\s*"([^"]+)"`));
  return m ? parseFloat(m[1]) : fallback;
}

export function extractTextSvgInfo(svgContent: string): {
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  fill: string;
  width: number;
  height: number;
  x: number;
  y: number;
  textAnchor: string;
} | null {
  const textMatch = svgContent.match(/<text[^>]*>([^<]+)<\/text>/);
  if (!textMatch) return null;

  return {
    text: textMatch[1],
    fontSize: extractNum(svgContent, "font-size", 32),
    fontFamily: extractAttr(svgContent, "font-family", "sans-serif"),
    fontWeight: extractAttr(svgContent, "font-weight", "400"),
    fontStyle: extractAttr(svgContent, "font-style", "normal"),
    fill: extractAttr(svgContent, "fill", "#000"),
    width: extractNum(svgContent, "width", 300),
    height: extractNum(svgContent, "height", 80),
    x: extractNum(svgContent, "x", 0),
    y: extractNum(svgContent, "y", 0),
    textAnchor: extractAttr(svgContent, "text-anchor", "start"),
  };
}

const SYSTEM_FONT_MAP: Record<string, string> = {
  "system-ui": "sans-serif",
  "sans-serif": "sans-serif",
  "serif": "serif",
  "monospace": "monospace",
};

const fontCache = new Map<string, ArrayBuffer | null>();

async function loadGoogleFont(family: string): Promise<ArrayBuffer | null> {
  if (fontCache.has(family)) return fontCache.get(family) ?? null;
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;700&display=swap`;
    const cssResp = await fetch(cssUrl, { redirect: "follow" });
    if (!cssResp.ok) { fontCache.set(family, null); return null; }
    const css = await cssResp.text();
    const urlMatch = css.match(/url\(([^)]+?)\)/);
    if (!urlMatch) { fontCache.set(family, null); return null; }
    let fontUrl = urlMatch[1].replace(/['"]/g, "");
    if (fontUrl.startsWith("//")) fontUrl = "https:" + fontUrl;
    const fontResp = await fetch(fontUrl, { redirect: "follow" });
    if (!fontResp.ok) { fontCache.set(family, null); return null; }
    const buf = await fontResp.arrayBuffer();
    fontCache.set(family, buf);
    return buf;
  } catch {
    fontCache.set(family, null);
    return null;
  }
}

async function viaOpentype(
  text: string, fontSize: number, fontBuffer: ArrayBuffer,
  fill: string, width: number, height: number, textAnchor: string,
): Promise<string | null> {
  try {
    const opentype = (await import("opentype.js")) as unknown as {
      parse: (buf: ArrayBuffer) => {
        unitsPerEm: number; ascender: number; descender: number;
        charToGlyph: (c: string) => {
          advanceWidth: number;
          getPath: (x: number, y: number, s: number) => { toPathData: () => string };
        };
        getKerningValue: (l: { advanceWidth: number }, r: { advanceWidth: number }) => number;
      };
    };

    const font = opentype.parse(fontBuffer);
    const scale = fontSize / font.unitsPerEm;

    let totalWidth = 0;
    for (let i = 0; i < text.length; i++) {
      const g = font.charToGlyph(text[i]);
      totalWidth += g.advanceWidth * scale;
      if (i < text.length - 1) totalWidth += font.getKerningValue(font.charToGlyph(text[i]), font.charToGlyph(text[i + 1])) * scale;
    }

    let startX = 0;
    if (textAnchor === "middle") startX = (width - totalWidth) / 2;
    else if (textAnchor === "end") startX = width - totalWidth;

    const ascenderPx = (font.ascender / font.unitsPerEm) * fontSize;
    const descenderPx = (font.descender / font.unitsPerEm) * fontSize;
    const baselineY = height - descenderPx - (height - (ascenderPx - descenderPx)) / 2;

    let pathData = "";
    let cursorX = startX;
    for (let i = 0; i < text.length; i++) {
      const g = font.charToGlyph(text[i]);
      if (i > 0) cursorX += font.getKerningValue(font.charToGlyph(text[i - 1]), g) * scale;
      pathData += g.getPath(cursorX, baselineY, fontSize).toPathData();
      cursorX += g.advanceWidth * scale;
    }

    if (!pathData) return null;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <path d="${pathData}" fill="${fill}" />
</svg>`;
  } catch { return null; }
}

function ensureFontLoaded(fontFamily: string, fontWeight: string, fontSize: number): Promise<void> {
  try {
    if (typeof document !== "undefined" && "fonts" in document) {
      return (document as any).fonts.load(`${fontWeight} ${fontSize}px "${fontFamily}"`).then(() => {}).catch(() => {});
    }
  } catch { /* ignore */ }
  return Promise.resolve();
}

async function viaCanvas(
  text: string, fontSize: number, fontFamily: string,
  fontWeight: string, fontStyle: string, fill: string,
  width: number, height: number, textAnchor: string,
): Promise<string | null> {
  const SCALE = 4;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const canvasFont = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
  await ensureFontLoaded(fontFamily, fontWeight, fontSize);
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  ctx.scale(SCALE, SCALE);
  ctx.font = canvasFont;
  ctx.fillStyle = fill;
  ctx.textBaseline = "middle";

  const lines = text.split("\n");
  const lineH = fontSize * 1.2;
  const totalH = lines.length * lineH;
  const startY = (height - totalH) / 2 + lineH / 2;

  lines.forEach((line, i) => {
    let x = 0;
    if (textAnchor !== "start") {
      const m = ctx.measureText(line);
      x = textAnchor === "middle" ? (width - m.width) / 2 : width - m.width;
    }
    ctx.fillText(line, x, startY + i * lineH);
  });

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const w = canvas.width, h = canvas.height;

  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) solid[i] = d[i * 4 + 3] > 100 ? 1 : 0;

  const visited = new Uint8Array(w * h);
  const allContours: { x: number; y: number }[][] = [];

  for (let sy = 0; sy < h; sy++) {
    for (let sx = 0; sx < w; sx++) {
      const idx = sy * w + sx;
      if (!solid[idx] || visited[idx]) continue;

      let isEdge = false;
      for (const [nx, ny] of [[sx - 1, sy], [sx + 1, sy], [sx, sy - 1], [sx, sy + 1]]) {
        if (nx < 0 || nx >= w || ny < 0 || ny >= h || !solid[ny * w + nx]) { isEdge = true; break; }
      }
      if (!isEdge) continue;

      const contour: { x: number; y: number }[] = [];
      const queue: [number, number][] = [[sx, sy]];
      visited[idx] = 1;

      while (queue.length) {
        const [cx, cy] = queue.shift()!;
        let edge = false;
        for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1], [cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1], [cx + 1, cy + 1]]) {
          if (nx < 0 || nx >= w || ny < 0 || ny >= h || !solid[ny * w + nx]) { edge = true; break; }
        }

        if (edge) {
          contour.push({ x: cx / SCALE, y: cy / SCALE });
        }

        for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const ni = ny * w + nx;
            if (solid[ni] && !visited[ni]) { visited[ni] = 1; queue.push([nx, ny]); }
          }
        }
      }

      if (contour.length > 10) allContours.push(contour);
    }
  }

  if (allContours.length === 0) return null;

  const pathStrings: string[] = [];
  for (const raw of allContours) {
    const sorted = sortContour(raw);
    if (sorted.length < 4) continue;
    const simpl = rdpSimplify(sorted, 0.8);
    if (simpl.length < 3) continue;

    const n = simpl.length;
    const isSharp = new Array(n).fill(false);

    for (let i = 0; i < n; i++) {
      const prev = simpl[(i - 1 + n) % n];
      const cur = simpl[i];
      const next = simpl[(i + 1) % n];
      const ax = cur.x - prev.x, ay = cur.y - prev.y;
      const bx = next.x - cur.x, by = next.y - cur.y;
      const dot = ax * bx + ay * by;
      const cross = Math.abs(ax * by - ay * bx);
      const lenA = Math.hypot(ax, ay);
      const lenB = Math.hypot(bx, by);
      if (lenA > 0 && lenB > 0) {
        const angle = Math.acos(Math.max(-1, Math.min(1, dot / (lenA * lenB))));
        const deg = angle * 180 / Math.PI;
        isSharp[i] = deg < 135 && cross > 2;
      }
    }

    let d = `M ${simpl[0].x.toFixed(2)} ${simpl[0].y.toFixed(2)}`;
    let i = 0;
    while (i < n) {
      if (isSharp[i] || isSharp[(i + 1) % n]) {
        i++;
        d += ` L ${simpl[i % n].x.toFixed(2)} ${simpl[i % n].y.toFixed(2)}`;
      } else {
        const p0 = simpl[(i - 1 + n) % n];
        const p1 = simpl[i];
        const p2 = simpl[(i + 1) % n];
        const p3 = simpl[(i + 2) % n];
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
        i += 2;
      }
    }
    d += " Z";
    pathStrings.push(d);
  }

  return pathStrings.length > 0
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <path d="${pathStrings.join(" ")}" fill="${fill}" fill-rule="evenodd" />
</svg>`
    : null;
}

export async function textSvgToPaths(svgContent: string): Promise<string | null> {
  const info = extractTextSvgInfo(svgContent);
  if (!info) return null;

  const { text, fontSize, fontFamily, fontWeight, fontStyle, fill, width, height, textAnchor } = info;
  const baseFamily = fontFamily.split(",")[0]?.trim().replace(/['"]/g, "") ?? "sans-serif";
  const gfName = SYSTEM_FONT_MAP[baseFamily] ?? baseFamily;

  const fontBuf = await loadGoogleFont(gfName);
  if (fontBuf) {
    const r = await viaOpentype(text, fontSize, fontBuf, fill, width, height, textAnchor);
    if (r) return r;
  }

  return viaCanvas(text, fontSize, fontFamily, fontWeight, fontStyle, fill, width, height, textAnchor);
}

function sortContour(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length <= 2) return points;
  const result = [points[0]];
  const remaining = points.slice(1);
  while (remaining.length) {
    const last = result[result.length - 1];
    let best = 0, bestD = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = Math.hypot(remaining[i].x - last.x, remaining[i].y - last.y);
      if (d < bestD) { bestD = d; best = i; }
    }
    result.push(remaining[best]);
    remaining.splice(best, 1);
  }
  return result;
}

function rdpSimplify(points: { x: number; y: number }[], eps: number): { x: number; y: number }[] {
  if (points.length <= 2) return points;
  let maxD = 0, maxI = 0;
  const a = points[0], b = points[points.length - 1];
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  for (let i = 1; i < points.length - 1; i++) {
    const d = len === 0 ? Math.hypot(points[i].x - a.x, points[i].y - a.y) : Math.abs(dy * points[i].x - dx * points[i].y + b.x * a.y - b.y * a.x) / len;
    if (d > maxD) { maxD = d; maxI = i; }
  }
  if (maxD > eps) {
    return [...rdpSimplify(points.slice(0, maxI + 1), eps).slice(0, -1), ...rdpSimplify(points.slice(maxI), eps)];
  }
  return [a, b];
}
