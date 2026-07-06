import type { BackgroundLayer } from "./types";

let nextLayerId = 1;
export function genLayerId(): string {
  return `bg_${nextLayerId++}_${Date.now()}`;
}

export function createDefaultLayer(type: BackgroundLayer["type"], overrides?: Partial<BackgroundLayer>): BackgroundLayer {
  const base: BackgroundLayer = { id: genLayerId(), type, enabled: true };
  switch (type) {
    case "color":
      return { ...base, color: "#4f46e5", ...overrides };
    case "gradient":
      return { ...base, gradientKind: "linear", gradientAngle: 135, gradientStops: [{ color: "#667eea", position: 0 }, { color: "#764ba2", position: 100 }], ...overrides };
    case "image":
      return { ...base, src: "", imageSize: "cover", imagePosition: "center", imageRepeat: "no-repeat", ...overrides };
    case "pattern":
      return { ...base, patternKind: "checkerboard", patternColor1: "#ffffff", patternColor2: "#000000", patternSize: 20, ...overrides };
  }
}

export function layerToCss(layer: BackgroundLayer): string {
  if (!layer.enabled) return "";
  const opacity = layer.opacity != null ? layer.opacity : 1;
  switch (layer.type) {
    case "color": {
      const c = layer.color ?? "transparent";
      return opacity < 1 ? `rgba(${hexToRgb(c)}, ${opacity})` : c;
    }
    case "gradient": {
      const stops = (layer.gradientStops ?? []).map((s) => `${s.color} ${s.position}%`).join(", ");
      const angle = layer.gradientAngle ?? 135;
      const pos = layer.gradientPosition ?? "center";
      switch (layer.gradientKind) {
        case "linear": return `linear-gradient(${angle}deg, ${stops})`;
        case "radial": return `radial-gradient(circle at ${pos}, ${stops})`;
        case "conic": return `conic-gradient(from ${angle}deg at ${pos}, ${stops})`;
        default: return `linear-gradient(${angle}deg, ${stops})`;
      }
    }
    case "image": {
      const src = layer.src;
      if (!src) return "";
      const size = layer.imageSize ?? "cover";
      const pos = layer.imagePosition ?? "center";
      const repeat = layer.imageRepeat ?? "no-repeat";
      const attachment = layer.imageAttachment ?? "scroll";
      return `url("${src}") ${pos} / ${size} ${repeat} ${attachment}`;
    }
    case "pattern": {
      const c1 = layer.patternColor1 ?? "#000";
      const c2 = layer.patternColor2 ?? "#fff";
      const s = layer.patternSize ?? 20;
      switch (layer.patternKind) {
        case "checkerboard": return `repeating-conic-gradient(${c1} 0% 25%, ${c2} 0% 50%) 0 0 / ${s * 2}px ${s * 2}px`;
        case "dots": return `radial-gradient(${c1} 2px, transparent 2px) 0 0 / ${s}px ${s}px`;
        case "stripes": return `repeating-linear-gradient(45deg, ${c1}, ${c1} 2px, ${c2} 2px, ${c2} ${s}px)`;
        case "grid": return `repeating-linear-gradient(0deg, ${c1}, ${c1} 1px, transparent 1px, transparent ${s}px), repeating-linear-gradient(90deg, ${c1}, ${c1} 1px, transparent 1px, transparent ${s}px)`;
        case "crosshatch": return `repeating-linear-gradient(45deg, ${c1}, ${c1} 1px, transparent 1px, transparent ${s}px), repeating-linear-gradient(-45deg, ${c1}, ${c1} 1px, transparent 1px, transparent ${s}px)`;
        default: return "";
      }
    }
  }
}

export function layersToBackground(layers: BackgroundLayer[] | undefined | null, fallback?: string): string {
  if (!layers || layers.length === 0) return fallback ?? "transparent";
  const css = layers.filter((l) => l.enabled).map(layerToCss).filter(Boolean).join(", ");
  return (css || fallback) ?? "transparent";
}

export function hasActiveLayers(layers: BackgroundLayer[] | undefined | null): boolean {
  return !!layers?.some((l) => l.enabled);
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}
