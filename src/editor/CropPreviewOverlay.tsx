import { useEditorStore } from "./editorStore";

export function CropPreviewOverlay() {
  const preview = useEditorStore((s) => s.cropPreview);
  const elements = useEditorStore((s) => s.elements);

  if (!preview) return null;

  const el = elements.find((e) => e.id === preview.elementId);
  if (!el) return null;

  let pathD = "";
  if (preview.mode === "bezier" && preview.bezierPath) {
    pathD = preview.bezierPath;
  } else if (preview.mode === "rect" && preview.rect) {
    const { x, y, width, height } = preview.rect;
    pathD = `M${x},${y} L${x + width},${y} L${x + width},${y + height} L${x},${y + height} Z`;
  }

  return (
    <div style={{
      position: "absolute",
      left: el.x,
      top: el.y,
      width: el.width,
      height: el.height,
      zIndex: 90,
      pointerEvents: "none",
    }}>
      <svg
        viewBox={`0 0 ${el.width} ${el.height}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <pattern id="crop-preview-hatch" patternUnits="userSpaceOnUse" width={8} height={8}>
            <path d="M0,0 L8,8 M8,0 L0,8" stroke="rgba(255,255,255,0.6)" strokeWidth={1} />
          </pattern>
          <mask id="crop-preview-mask">
            <rect x={0} y={0} width={el.width} height={el.height} fill="white" />
            {pathD && <path d={pathD} fill="black" />}
          </mask>
        </defs>
        {/* Dark area outside the crop path */}
        <rect x={0} y={0} width={el.width} height={el.height}
          fill="rgba(0,0,0,0.4)" mask="url(#crop-preview-mask)" />
        {/* Dashed path outline */}
        {pathD && (
          <path d={pathD}
            fill="none" stroke="#6c5ce7" strokeWidth={2}
            strokeDasharray="6 3" />
        )}
      </svg>
      <div style={{
        position: "absolute",
        left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        background: "rgba(108,92,231,0.9)",
        color: "#fff",
        padding: "4px 10px",
        borderRadius: 4,
        fontSize: 10,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 91,
      }}>
        Preview de recorte — esperando confirmacion
      </div>
    </div>
  );
}
