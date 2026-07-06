export class CompilerSandbox {
  private worker: Worker | null = null;

  async init(): Promise<void> {
    const blob = new Blob(
      [
        `
        self.onmessage = function(e) {
          try {
            const result = new Function('React', e.data.code);
            self.postMessage({ ok: true, result: null });
          } catch (err) {
            self.postMessage({ ok: false, error: err.message });
          }
        };
      `,
      ],
      { type: "application/javascript" },
    );
    this.worker = new Worker(URL.createObjectURL(blob));
  }

  async validate(code: string): Promise<{ ok: boolean; error?: string }> {
    if (!this.worker) await this.init();
    return new Promise((resolve) => {
      if (!this.worker) {
        resolve({ ok: false, error: "Worker no disponible" });
        return;
      }
      this.worker.onmessage = (e) => resolve(e.data);
      this.worker.postMessage({ code });
    });
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
  }
}
