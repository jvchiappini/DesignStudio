import { useState, useCallback } from "react";
import { useEditorStore } from "../../store/editorStore";
import { calculateOptimalFontSize } from "../../utils/textMeasure";

const GUIDE_COLOR = "rgba(0, 150, 255, 0.6)";

interface GuideDragInfo {
  id: string;
  orientation: "horizontal" | "vertical";
  startPos: number;
}

interface Props {
  width?: number;
  height?: number;
  pageNumber: number;  // 1-based index 1, 2, 3...
}

export function GuideOverlay({ width, height, pageNumber }: Props) {
  const allGuides = useEditorStore((s) => s.guides);
  const pages = useEditorStore((s) => s.pages);
  const pageGap = useEditorStore((s) => s.pageGap);
  const removeGuide = useEditorStore((s) => s.removeGuide);
  const updateGuidePosition = useEditorStore((s) => s.updateGuidePosition);
  const setSelectedGuideId = useEditorStore((s) => s.setSelectedGuideId);
  const zoom = useEditorStore((s) => s.zoom);
  const showRulers = useEditorStore((s) => s.showRulers);

  const guides = allGuides.filter((g) => !g.pageNumber || g.pageNumber === pageNumber);
  const w = width ?? 1080;
  const h = height ?? 1920;

  // Compute this page's offset in global canvas space
  const pageOffset = (() => {
    let off = 0;
    for (let i = 0; i < pageNumber - 1; i++) {
      if (pages[i]) off += pages[i].width + pageGap;
    }
    return off;
  })();
  const [dragInfo, setDragInfo] = useState<GuideDragInfo | null>(null);
  const [currentPos, setCurrentPos] = useState(0);

  const handlePointerDown = useCallback((g: typeof guides[0], e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedGuideId(g.id);
    const startClient = g.orientation === "horizontal" ? e.clientY : e.clientX;
    const info: GuideDragInfo = { id: g.id, orientation: g.orientation, startPos: g.position };
    setDragInfo(info);
    setCurrentPos(g.position);

    const onMove = (ev: PointerEvent) => {
      const delta = info.orientation === "horizontal"
        ? (ev.clientY - startClient) / zoom
        : (ev.clientX - startClient) / zoom;
      const newPos = info.startPos + delta;
      updateGuidePosition(g.id, newPos);
      // Recalculate autoFitSize for anchored text elements
      const currentElements = useEditorStore.getState().elements;
      for (const cel of currentElements) {
        if (cel.autoFitSize && (cel.leftAnchor === g.id || cel.rightAnchor === g.id || cel.topAnchor === g.id || cel.bottomAnchor === g.id)) {
          const autoSize = calculateOptimalFontSize(cel);
          if (autoSize !== null && autoSize !== cel.fontSize) {
            useEditorStore.getState().updateElement(cel.id, { fontSize: autoSize });
          }
        }
      }
      setCurrentPos(newPos);
    };
    const onUp = () => {
      setDragInfo(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [zoom, updateGuidePosition, setSelectedGuideId]);

  const hitStroke = Math.max(8, 8 / zoom);

  return (
    <svg className="absolute inset-0" width={w} height={h}
      style={{ visibility: showRulers ? "visible" : "hidden" }}>
      {guides.map((g) => {
        const isDrag = dragInfo?.id === g.id;
        // Global guides (no pageNumber) are in global coords; offset for this page
        const pos = g.pageNumber ? g.position : g.position - pageOffset;
        const isVisible = pos >= -10 && pos <= w + 10;
        if (!isVisible) return null;
        if (g.orientation === "horizontal") {
          return (
            <g key={g.id}>
              <line x1={0} y1={pos} x2={w} y2={pos}
                stroke="transparent" strokeWidth={hitStroke}
                style={{ cursor: "ns-resize", pointerEvents: "stroke" }}
                onPointerDown={(e) => handlePointerDown(g, e)}
                onDoubleClick={() => {
                  const val = prompt("Posición en px:", String(Math.round(g.position)));
                  if (val !== null) { const n = parseFloat(val); if (!isNaN(n)) updateGuidePosition(g.id, n); }
                }}
                onContextMenu={(e) => { e.preventDefault(); removeGuide(g.id); }}
              />
              <line x1={0} y1={pos} x2={w} y2={pos}
                stroke={isDrag ? "rgba(255,100,100,0.8)" : GUIDE_COLOR} strokeWidth={1}
                style={{ pointerEvents: "none" }}
              />
            </g>
          );
        }
        return (
          <g key={g.id}>
            <line x1={pos} y1={0} x2={pos} y2={h}
              stroke="transparent" strokeWidth={hitStroke}
              style={{ cursor: "ew-resize", pointerEvents: "stroke" }}
              onPointerDown={(e) => handlePointerDown(g, e)}
              onDoubleClick={() => {
                const val = prompt("Posición en px:", String(Math.round(g.position)));
                if (val !== null) { const n = parseFloat(val); if (!isNaN(n)) updateGuidePosition(g.id, n); }
              }}
              onContextMenu={(e) => { e.preventDefault(); removeGuide(g.id); }}
            />
            <line x1={pos} y1={0} x2={pos} y2={h}
              stroke={isDrag ? "rgba(255,100,100,0.8)" : GUIDE_COLOR} strokeWidth={1}
              style={{ pointerEvents: "none" }}
            />
          </g>
        );
      })}
      {dragInfo && (
        <text
          x={dragInfo.orientation === "horizontal" ? 8 : currentPos + 8}
          y={dragInfo.orientation === "horizontal" ? currentPos - 4 : 14}
          fill="white" fontSize={13} fontFamily="monospace"
          stroke="#1e1e2e" strokeWidth={0.5}
          paintOrder="stroke"
        >
          {Math.round(currentPos)}px
        </text>
      )}
    </svg>
  );
}
