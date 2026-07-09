export type ElementType = "text" | "image" | "shape" | "svg";

export type ShapeKind = "rect" | "circle" | "triangle" | "star" | "line";

export interface DesignElement {
  id: string;
  type: ElementType;
  x: number; y: number;
  width: number; height: number;
  rotation: number;
  opacity: number;
  zIndex: number;

  // text
  text?: string;
  fontSize?: number;
  autoFitSize?: boolean;
  fontFamily?: string;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  color?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textDecoration?: "none" | "underline" | "line-through";
  textBgColor?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textStrokeColor?: string;
  textStrokeWidth?: number;
  textIndent?: number;
  wordSpacing?: number;
  fontVariant?: "normal" | "small-caps";
  verticalAlign?: "top" | "middle" | "bottom";
  charScaleX?: number;
  charScaleY?: number;

  // text padding (replaces hardcoded 4px)
  textPaddingLeft?: number;
  textPaddingRight?: number;
  textPaddingTop?: number;
  textPaddingBottom?: number;

  // text outline (border around the text box, not text-stroke)
  textOutlineColor?: string;
  textOutlineWidth?: number;

  // text overflow
  textOverflow?: "visible" | "hidden" | "clip" | "ellipsis";

  // gradient text
  textGradient?: string; // CSS gradient, e.g. "linear-gradient(90deg, #ff0000, #00ff00)"
  textGradientColors?: string[]; // color stops for the gradient UI

  // converted to SVG paths
  isSvgPath?: boolean;
  svgPathData?: string; // raw SVG path data for converted text

  // image
  src?: string;
  imgBrightness?: number;
  imgContrast?: number;
  imgSaturation?: number;
  imgBlur?: number;
  cropX?: number;
  cropY?: number;
  cropW?: number;
  cropH?: number;

  // shape
  shapeKind?: ShapeKind;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: "solid" | "dashed" | "dotted";
  borderRadius?: number;
  borderRadiusTL?: number;
  borderRadiusTR?: number;
  borderRadiusBR?: number;
  borderRadiusBL?: number;

  // svg
  svgContent?: string;

  // blend mode
  mixBlendMode?: string;

  // multiple text shadows
  textShadows?: TextShadow[];

  // gradient fill (shapes)
  fillGradient?: string;
  fillGradientColors?: string[];

  // multi-layer backgrounds
  bgLayers?: BackgroundLayer[];

  // shadow
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  // flip
  flipH?: boolean;
  flipV?: boolean;

  // auto-layout
  layout?: LayoutConfig;
  parentId?: string;

  // clip / mask
  clipMask?: ClipMask;

  // guide anchors
  leftAnchor?: string;
  leftAnchorOffset?: number;
  rightAnchor?: string;
  rightAnchorOffset?: number;
  topAnchor?: string;
  topAnchorOffset?: number;
  bottomAnchor?: string;
  bottomAnchorOffset?: number;

  // group
  groupId?: string;
  locked?: boolean;
  hidden?: boolean;
}

export type ResizeHandle =
  | "nw" | "n" | "ne"
  | "w" | "e"
  | "sw" | "s" | "se";

export interface BackgroundLayer {
  id: string;
  type: "color" | "gradient" | "image" | "pattern";
  enabled: boolean;
  // color
  color?: string;
  // gradient
  gradientKind?: "linear" | "radial" | "conic";
  gradientAngle?: number;
  gradientStops?: Array<{ color: string; position: number }>;
  gradientPosition?: string;
  // image
  src?: string;
  imageSize?: string;
  imagePosition?: string;
  imageRepeat?: string;
  imageAttachment?: string;
  // pattern
  patternKind?: "checkerboard" | "dots" | "stripes" | "grid" | "crosshatch";
  patternColor1?: string;
  patternColor2?: string;
  patternSize?: number;
  // common
  opacity?: number;
  blendMode?: string;
}

export type SidebarTab = "templates" | "elements" | "text" | "uploads" | "background" | "layers" | "pages" | "icons" | "guides";
export type RightTab = "properties" | "none";
export type LeftPanelTab = "sidebar" | "chat";

// --- Auto Layout ---
export interface LayoutConfig {
  direction: "row" | "column";
  gap: number;
  padding: number;
  align: "flex-start" | "center" | "flex-end" | "stretch";
  justify: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  wrap: boolean;
}

// --- Clip / Mask ---
export interface CropPreview {
  elementId: string;
  mode: "rect" | "bezier";
  rect?: { x: number; y: number; width: number; height: number };
  bezierPath?: string;
}

export interface ClipMask {
  type: "circle" | "ellipse" | "polygon" | "inset" | "path";
  value: string; // e.g. "50% 50% at center" for circle, "inset(10% 10%)" for inset
}

export interface TextShadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface Page {
  id: string;
  name: string;
  width: number;
  height: number;
  bgColor: string;
  bgLayers?: BackgroundLayer[];
}

export interface Guide {
  id: string;
  position: number;
  orientation: "horizontal" | "vertical";
  pageNumber?: number;
}

export type ExportFormat = "png" | "jpg" | "webp" | "pdf";

export const CANVAS_PRESETS = [
  { label: "Historia IG", w: 1080, h: 1920 },
  { label: "Post IG", w: 1080, h: 1080 },
  { label: "Landscape", w: 1920, h: 1080 },
  { label: "Cuadrado", w: 1080, h: 1080 },
  { label: "A4", w: 2480, h: 3508 },
  { label: "Poster", w: 1920, h: 2880 },
  { label: "Banner Web", w: 1200, h: 600 },
  { label: "Thumbnail", w: 1280, h: 720 },
  { label: "Logo", w: 500, h: 500 },
] as const;
