import { toPng } from "html-to-image";

export interface CapturedFrame {
  blob: Blob;
  frameNumber: number;
}

export async function captureFrame(
  element: HTMLElement,
  frameNumber: number,
): Promise<CapturedFrame> {
  const blob = await toPng(element, {
    quality: 1,
    pixelRatio: 1,
    cacheBust: true,
  }).then((dataUrl) => dataUrlToBlob(dataUrl));

  return { blob, frameNumber };
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] ?? "image/png";
  const bytes = atob(parts[1]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}
