declare module "webm-writer" {
  interface WebMWriterOptions {
    quality?: number;
    frameDuration?: number;
    transparent?: boolean;
  }

  class WebMWriter {
    constructor(options?: WebMWriterOptions);
    addFrame(frame: ImageBitmap): void;
    complete(): Promise<Blob>;
  }

  export default WebMWriter;
}
