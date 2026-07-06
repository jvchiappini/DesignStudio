import WebMWriter from "webm-writer";

export interface VideoEncodeOptions {
  fps: number;
  width: number;
  height: number;
  quality?: number;
}

export async function encodeFramesToVideo(
  frames: Blob[],
  options: VideoEncodeOptions,
): Promise<Blob> {
  const writer = new WebMWriter({
    quality: options.quality ?? 0.95,
    frameDuration: 1000 / options.fps,
    transparent: false,
  });

  for (const frame of frames) {
    const bitmap = await blobToImageBitmap(frame);
    writer.addFrame(bitmap);
    bitmap.close();
  }

  const result = await writer.complete();
  return result;
}

async function blobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
  const img = await createImageBitmap(blob);
  return img;
}
