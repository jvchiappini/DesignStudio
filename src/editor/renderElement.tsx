import type { CSSProperties } from "react";
import type { DesignElement } from "./types";
import { layersToBackground, hasActiveLayers } from "./backgroundUtils";

function textShadowStyle(el: DesignElement): CSSProperties {
  // Use textShadows array if present, otherwise fall back to single shadow
  if (el.textShadows && el.textShadows.length > 0) {
    const css = el.textShadows
      .filter((s) => s.color && s.blur > 0)
      .map((s) => `${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.color}`)
      .join(", ");
    return css ? { textShadow: css } as CSSProperties : {};
  }
  const c = el.shadowColor;
  const b = el.shadowBlur;
  if (!c || !b || b <= 0) return {};
  return {
    textShadow: `${el.shadowOffsetX ?? 0}px ${el.shadowOffsetY ?? 4}px ${b}px ${c}`,
  };
}

function shadowStyle(el: DesignElement): CSSProperties {
  const c = el.shadowColor;
  const b = el.shadowBlur;
  if (!c || !b || b <= 0) return {};
  if (el.type === "text") {
    return {
      textShadow: `${el.shadowOffsetX ?? 0}px ${el.shadowOffsetY ?? 4}px ${b}px ${c}`,
    };
  }
  return {
    boxShadow: `${el.shadowOffsetX ?? 0}px ${el.shadowOffsetY ?? 4}px ${b}px ${c}`,
  };
}

function flipStyle(el: DesignElement): string {
  const parts: string[] = [];
  if (el.flipH) parts.push("scaleX(-1)");
  if (el.flipV) parts.push("scaleY(-1)");
  if (el.charScaleX && el.charScaleX !== 100) parts.push(`scaleX(${el.charScaleX / 100})`);
  if (el.charScaleY && el.charScaleY !== 100) parts.push(`scaleY(${el.charScaleY / 100})`);
  return parts.join(" ");
}

export function renderElementContent(el: DesignElement): {
  content: React.ReactNode;
  style: CSSProperties;
} {
  const flip = flipStyle(el);
  const baseTransform = flip ? `${flip} rotate(${el.rotation}deg)` : `rotate(${el.rotation}deg)`;

  const clipCss = el.clipMask ? clipMaskStyle(el.clipMask) : {};

  const base: CSSProperties = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    transform: baseTransform,
    opacity: el.opacity,
    zIndex: el.zIndex,
    cursor: "move",
    userSelect: "none",
    boxSizing: "border-box",
    backfaceVisibility: "hidden",
    ...(el.mixBlendMode ? { mixBlendMode: el.mixBlendMode as CSSProperties["mixBlendMode"] } : {}),
    ...shadowStyle(el),
    ...clipCss,
  };

  switch (el.type) {
    case "text": {
      const vAlign = el.verticalAlign ?? "middle";
      const pl = el.textPaddingLeft ?? 4;
      const pr = el.textPaddingRight ?? 4;
      const pt = el.textPaddingTop ?? 4;
      const pb = el.textPaddingBottom ?? 4;
      const textOverflow = el.textOverflow ?? "hidden";
      const textStyle: CSSProperties = {
        ...base,
        fontSize: el.fontSize,
        fontFamily: el.fontFamily,
        fontWeight: el.fontWeight,
        fontStyle: el.fontStyle,
        textAlign: el.textAlign,
        color: el.color,
        display: "flex",
        flexDirection: "column",
        justifyContent: vAlign === "top" ? "flex-start" : vAlign === "bottom" ? "flex-end" : "center",
        alignItems: el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start",
        padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
        whiteSpace: textOverflow === "ellipsis" ? "nowrap" : "pre-wrap",
        wordBreak: textOverflow === "ellipsis" ? "break-all" : "break-word",
        overflow: textOverflow === "visible" ? "visible" : "hidden",
        textOverflow: textOverflow === "ellipsis" ? "ellipsis" : undefined,
        lineHeight: el.lineHeight ?? 1.2,
        letterSpacing: el.letterSpacing ?? 0,
        textDecoration: el.textDecoration === "none" ? undefined : el.textDecoration,
        textTransform: el.textTransform === "none" ? undefined : el.textTransform,
        textIndent: el.textIndent ?? 0,
        wordSpacing: el.wordSpacing ?? 0,
        fontVariant: el.fontVariant === "normal" ? undefined : el.fontVariant,
        ...(el.textBgColor ? { backgroundColor: el.textBgColor } : {}),
        ...(el.textOutlineWidth && el.textOutlineColor ? {
          outline: `${el.textOutlineWidth}px solid ${el.textOutlineColor}`,
          outlineOffset: 0,
        } : {}),
        ...strokeStyle(el),
        ...gradientStyle(el),
        ...textShadowStyle(el),
      };
      return {
        style: textStyle,
        content: <>{el.text}</>,
      };
    }

    case "image": {
      const filter = [
        el.imgBrightness != null && el.imgBrightness !== 100 ? `brightness(${el.imgBrightness}%)` : "",
        el.imgContrast != null && el.imgContrast !== 100 ? `contrast(${el.imgContrast}%)` : "",
        el.imgSaturation != null && el.imgSaturation !== 100 ? `saturate(${el.imgSaturation}%)` : "",
        el.imgBlur ? `blur(${el.imgBlur}px)` : "",
      ].filter(Boolean).join(" ");
      return {
        style: { ...base, overflow: "hidden" },
        content: (
          <img src={el.src} alt="" draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", ...(filter ? { filter } : {}) }}
          />
        ),
      };
    }

    case "shape": {
      const bgLayersCss = hasActiveLayers(el.bgLayers)
        ? layersToBackground(el.bgLayers)
        : (el.fillGradient && (el.fillGradientColors?.length ?? 0) >= 2)
          ? el.fillGradient as string
          : el.backgroundColor;
      const shapeStyle: CSSProperties = {
        ...base,
        background: bgLayersCss as CSSProperties["background"],
        border: `${el.borderWidth}px ${el.borderStyle ?? "solid"} ${el.borderColor ?? "transparent"}`,
        overflow: "hidden",
      };
      if (el.shapeKind === "circle") {
        shapeStyle.borderRadius = "50%";
      } else if (el.borderRadiusTL != null || el.borderRadiusTR != null || el.borderRadiusBR != null || el.borderRadiusBL != null) {
        shapeStyle.borderRadius = `${el.borderRadiusTL ?? el.borderRadius ?? 0}px ${el.borderRadiusTR ?? el.borderRadius ?? 0}px ${el.borderRadiusBR ?? el.borderRadius ?? 0}px ${el.borderRadiusBL ?? el.borderRadius ?? 0}px`;
      } else {
        shapeStyle.borderRadius = el.borderRadius ?? 0;
      }

      if (el.shapeKind === "triangle") {
        return {
          style: { ...base, overflow: "hidden" },
          content: (
            <div style={{
              width: 0, height: 0,
              borderLeft: `${el.width / 2}px solid transparent`,
              borderRight: `${el.width / 2}px solid transparent`,
              borderBottom: `${el.height}px solid ${el.backgroundColor ?? "#4f46e5"}`,
            }} />
          ),
        };
      }
      if (el.shapeKind === "star") {
        return {
          style: { ...base, display: "flex", alignItems: "center", justifyContent: "center" },
          content: (
            <svg viewBox="0 0 24 24" width={el.width} height={el.height}>
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill={el.backgroundColor ?? "#4f46e5"} stroke={el.borderColor ?? "transparent"}
                strokeWidth={el.borderWidth ?? 0} />
            </svg>
          ),
        };
      }
      if (el.shapeKind === "line") {
        return {
          style: { ...base, backgroundColor: el.borderColor ?? "#4f46e5", border: "none", borderRadius: 0 },
          content: null,
        };
      }
      return { style: shapeStyle, content: null };
    }

    case "svg":
      return {
        style: { ...base, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
        content: <div style={{ width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: el.svgContent ?? "" }} />,
      };

    default:
      return { style: base, content: null };
  }
}

function strokeStyle(el: DesignElement): CSSProperties {
  const c = el.textStrokeColor;
  const w = el.textStrokeWidth;
  if (c && w && w > 0) {
    return {
      WebkitTextStroke: `${w}px ${c}`,
      paintOrder: "stroke fill",
    } as CSSProperties;
  }
  return {};
}

function gradientStyle(el: DesignElement): CSSProperties {
  const g = el.textGradient;
  if (!g) return {};
  return {
    background: g,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  } as CSSProperties;
}

import type { ClipMask } from "./types";

function clipMaskStyle(mask: ClipMask): CSSProperties {
  const cssValue = (() => {
    switch (mask.type) {
      case "circle": return `circle(${mask.value || "50%"})`;
      case "ellipse": return `ellipse(${mask.value || "50% 50%"})`;
      case "polygon": return `polygon(${mask.value || "50% 0%, 100% 50%, 50% 100%, 0% 50%"})`;
      case "inset": return `inset(${mask.value || "10%"})`;
      case "path": {
        let v = mask.value || "";
        if (v.startsWith("'") && v.endsWith("'")) v = v.substring(1, v.length - 1);
        if (v.startsWith('"') && v.endsWith('"')) v = v.substring(1, v.length - 1);
        return `path('${v}')`;
      }
      default: return "none";
    }
  })();
  return { clipPath: cssValue, WebkitClipPath: cssValue } as CSSProperties;
}

/** Returns children of a layout container with auto-calculated styles */
export function renderLayoutChildren(
  container: DesignElement,
  elements: DesignElement[],
): { child: DesignElement; style: CSSProperties }[] {
  const children = elements.filter((e) => e.parentId === container.id);
  if (children.length === 0) return [];
  const layout = container.layout!;
  const gap = layout.gap ?? 12;
  const pad = layout.padding ?? 16;

  return children.map((child, i) => {
    const childStyle: CSSProperties = {
      position: "relative",
      flex: "0 0 auto",
      width: child.width,
      height: child.height,
      opacity: child.opacity ?? 1,
      zIndex: child.zIndex,
      ...(child.mixBlendMode ? { mixBlendMode: child.mixBlendMode as CSSProperties["mixBlendMode"] } : {}),
      ...shadowStyle(child),
      ...(child.clipMask ? clipMaskStyle(child.clipMask) : {}),
    };
    return { child, style: childStyle };
  });
}
