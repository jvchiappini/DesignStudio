export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportFrameAsPNG(
  element: HTMLElement,
  filename = "frame.png",
): Promise<void> {
  const { captureFrame } = await import("./canvasRecorder");
  const { blob } = await captureFrame(element, 0);
  downloadBlob(blob, filename);
}
