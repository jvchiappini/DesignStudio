import { useCallback, useState } from "react";
import type { ExportFormat } from "../editor/types";

export function useExport() {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportPage = useCallback(
    async (element: HTMLElement | null, format: ExportFormat = "png", pages?: number | number[], scale = 2) => {
      if (!element || exporting) return;
      setExporting(true);
      setProgress(0);

      const pageEls = element.querySelectorAll<HTMLElement>("[data-page]");
      const indices = pages === undefined
        ? Array.from({ length: pageEls.length }, (_, i) => i)
        : Array.isArray(pages) ? pages : [pages];

      if (indices.length === 0) { setExporting(false); return; }

      try {
        for (let idx = 0; idx < indices.length; idx++) {
          const pi = indices[idx];
          const pageEl = pageEls[pi];
          if (!pageEl) continue;

          const blob = await capturePageClean(pageEl, format, scale);
          if (blob) {
            downloadBlob(blob, `design-pagina-${pi + 1}.${format}`);
          }
          setProgress(Math.round(((idx + 1) / indices.length) * 100));
        }
      } catch (err) {
        console.error("[Export] Error:", err);
      } finally {
        setExporting(false);
        setProgress(0);
      }
    },
    [exporting],
  );

  return { exportFrame: exportPage, exporting, progress };
}

async function capturePageClean(pageEl: HTMLElement, format: ExportFormat, scale: number): Promise<Blob | null> {
  const w = parseInt(pageEl.style.width, 10) || pageEl.clientWidth || 1080;
  const h = parseInt(pageEl.style.height, 10) || pageEl.clientHeight || 1920;

  // Deep clone the page element to avoid any transform/position issues
  const clone = pageEl.cloneNode(true) as HTMLElement;
  // Reset positioning so the clone renders at 0,0
  clone.style.position = "fixed";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";
  clone.style.transform = "none";
  clone.style.outline = "none";
  clone.style.border = "none";
  clone.style.overflow = "visible";

  // Hide interaction elements that might be inside the clone
  clone.querySelectorAll<HTMLElement>("[data-selection], [data-handle], [data-text-editor]").forEach((el) => {
    el.style.display = "none";
  });

  // Remove the visual page divider (appears at right edge of non-last pages)
  clone.querySelectorAll<HTMLElement>("[data-page-divider]").forEach((el) => {
    el.style.display = "none";
  });

  // Read the background color from the page-bg child
  const bgEl = clone.querySelector<HTMLElement>("[data-page-bg]");
  // Strip the editor checkerboard pattern so it doesn't appear in exports
  if (bgEl) {
    bgEl.style.backgroundImage = "";
    bgEl.style.backgroundSize = "";
    bgEl.style.backgroundPosition = "";
  }
  const hasBg = bgEl?.style.backgroundColor != null && bgEl.style.backgroundColor !== "";

  // Append temporarily to body
  document.body.appendChild(clone);

  try {
    const { toPng, toJpeg, toBlob } = await import("html-to-image");
    const baseOpts: Record<string, any> = {
      quality: 1,
      pixelRatio: scale,
      cacheBust: true,
      canvasWidth: w * scale,
      canvasHeight: h * scale,
      width: w,
      height: h,
    };

    if (format === "png") {
      // PNG: transparent only when page has no background color
      if (hasBg) {
        const c = bgEl!.style.backgroundColor;
        clone.style.backgroundColor = c;
        baseOpts.backgroundColor = c;
      }
      const dataUrl = await toPng(clone, baseOpts);
      return dataUrlToBlob(dataUrl);
    } else {
      // JPG/WebP: always solid — use page color or default white
      const c = hasBg ? bgEl!.style.backgroundColor : "#ffffff";
      clone.style.backgroundColor = c;
      if (bgEl) bgEl.style.backgroundColor = c;
      baseOpts.backgroundColor = c;
      if (format === "jpg") {
        const dataUrl = await toJpeg(clone, { ...baseOpts, quality: 0.92 });
        return dataUrlToBlob(dataUrl);
      } else {
        return await toBlob(clone, { ...baseOpts, quality: 0.92 });
      }
    }
  } finally {
    document.body.removeChild(clone);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] ?? "image/png";
  const bytes = atob(parts[1]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
