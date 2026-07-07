export async function capturePageAsDataUrl(
  pageEl: HTMLElement,
  format: "png" | "jpg",
  scale = 2,
): Promise<string> {
  const w = parseInt(pageEl.style.width, 10) || pageEl.clientWidth || 1080;
  const h = parseInt(pageEl.style.height, 10) || pageEl.clientHeight || 1920;

  const clone = pageEl.cloneNode(true) as HTMLElement;
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

  clone.querySelectorAll<HTMLElement>("[data-selection], [data-handle], [data-text-editor]").forEach((el) => {
    el.style.display = "none";
  });
  clone.querySelectorAll<HTMLElement>("[data-page-divider]").forEach((el) => {
    el.style.display = "none";
  });

  const bgEl = clone.querySelector<HTMLElement>("[data-page-bg]");
  if (bgEl) {
    bgEl.style.backgroundImage = "";
    bgEl.style.backgroundSize = "";
    bgEl.style.backgroundPosition = "";
  }
  const hasBg = bgEl?.style.backgroundColor != null && bgEl.style.backgroundColor !== "";

  document.body.appendChild(clone);

  try {
    const { toPng, toJpeg } = await import("html-to-image");
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
      if (hasBg) {
        const c = bgEl!.style.backgroundColor;
        clone.style.backgroundColor = c;
        baseOpts.backgroundColor = c;
      }
      return await toPng(clone, baseOpts);
    } else {
      const c = hasBg ? bgEl!.style.backgroundColor : "#ffffff";
      clone.style.backgroundColor = c;
      if (bgEl) bgEl.style.backgroundColor = c;
      baseOpts.backgroundColor = c;
      return await toJpeg(clone, { ...baseOpts, quality: 0.92 });
    }
  } finally {
    document.body.removeChild(clone);
  }
}
