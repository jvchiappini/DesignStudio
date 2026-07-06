# Renderer — Design Studio

## Propósito
Capturar el DOM del preview en cada frame y codificarlo como video .webm o imagen PNG, todo en el navegador del usuario.

## Arquitectura

```
Preview DOM (HTMLElement)
    │
    ▼
canvasRecorder.captureFrame()
    │  html-to-image.toPng() → Blob
    ▼
webmEncoder.encodeFramesToVideo()
    │  webm-writer recibe ImageBitmap[]
    │  writer.addFrame(bitmap) por cada frame
    │  writer.complete() → Blob .webm
    ▼
pngExporter.downloadBlob()
    │  Crea <a> temporal, dispara click, revoca URL
    ▼
Descarga en el navegador del usuario
```

## Exportación de Video

```ts
async function exportVideo(previewElement: HTMLElement) {
  for (let i = 0; i < durationInFrames; i++) {
    const { blob } = await captureFrame(previewElement, i);
    frames.push(blob);
    // reportar progreso
  }
  const videoBlob = await encodeFramesToVideo(frames, { fps, width, height });
  downloadBlob(videoBlob, "export.webm");
}
```

## Exportación de Frame

```ts
async function exportFrameAsPNG(previewElement: HTMLElement) {
  const { blob } = await captureFrame(previewElement, currentFrame);
  downloadBlob(blob, "frame.png");
}
```

## Consideraciones
- La exportación de video es O(n) en frames. Para videos largos (60s a 30fps = 1800 frames), puede tomar tiempo considerable.
- html-to-image captura el DOM estilizado. Asegurarse de que fuentes, imágenes y estilos estén cargados antes de exportar.
- webm-writer produce archivos .webm (formato abierto de video).
