let latestPreview: string | null = null;

export function setPreview(dataUrl: string): void {
  latestPreview = dataUrl;
}

export function takePreview(): string | null {
  const v = latestPreview;
  latestPreview = null;
  return v;
}
