import { useRef, useCallback, useMemo, useState } from "react";
import { useEditorStore } from "./editorStore";
import { parseSvgPath, serializeSvgPath, getControlPoints, type BezierPoint } from "../utils/svgPathParser";
import type { DesignElement } from "./types";

const POINT_SIZE = 8;
const CONTROL_SIZE = 6;
const HANDLE_COLOR = "#6c5ce7";
const CONTROL_COLOR = "#e94560";
const LINE_COLOR = "rgba(108,92,231,0.3)";

export function PathEditor({ el }: { el: DesignElement }) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const saveSnapshot = useEditorStore((s) => s.saveSnapshot);
  const zoom = useEditorStore((s) => s.zoom);

  const svgContent = el.svgContent ?? "";

  const points = useMemo(() => {
    const match = svgContent.match(/d="([^"]+)"/);
    return match ? parseSvgPath(match[1]) : [];
  }, [svgContent]);

  const [dragging, setDragging] = useState<{
    type: "anchor" | "control";
    pointIdx: number;
    controlIdx?: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const elRef = useRef<HTMLDivElement>(null);

  const updatePath = useCallback((newPoints: BezierPoint[]) => {
    const d = serializeSvgPath(newPoints);
    const newSvg = svgContent.replace(/d="[^"]+"/, `d="${d}"`);
    updateElement(el.id, { svgContent: newSvg });
  }, [svgContent, el.id, updateElement]);

  const handlePointDown = useCallback(
    (e: React.PointerEvent, idx: number, isControl: boolean, ci: number | undefined, px: number, py: number) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging({
        type: isControl ? "control" : "anchor",
        pointIdx: idx,
        controlIdx: ci,
        startX: e.clientX,
        startY: e.clientY,
        origX: px,
        origY: py,
      });
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const dx = (e.clientX - dragging.startX) / zoom;
      const dy = (e.clientY - dragging.startY) / zoom;
      const newPoints = points.map((p, i) => {
        if (i !== dragging.pointIdx) return { ...p };
        const np = { ...p };
        if (dragging.type === "anchor") {
          np.x = dragging.origX + dx;
          np.y = dragging.origY + dy;
        } else if (dragging.type === "control") {
          if (dragging.controlIdx === 0 && np.c1) np.c1 = { x: dragging.origX + dx, y: dragging.origY + dy };
          if (dragging.controlIdx === 1 && np.c2) np.c2 = { x: dragging.origX + dx, y: dragging.origY + dy };
          if (dragging.controlIdx === 0 && np.qc) np.qc = { x: dragging.origX + dx, y: dragging.origY + dy };
        }
        return np;
      });
      updatePath(newPoints);
    },
    [dragging, zoom, points, updatePath],
  );

  const handlePointerUp = useCallback(() => {
    if (dragging) {
      saveSnapshot();
      setDragging(null);
    }
  }, [dragging, saveSnapshot]);

  if (el.type !== "svg" || points.length === 0) return null;

  const svgMatch = svgContent.match(/viewBox="([^"]+)"/);
  const viewBox = svgMatch ? svgMatch[1].split(/\s+/).map(Number) : [0, 0, el.width, el.height];
  const [vbX, vbY, vbW, vbH] = viewBox;
  const scale = Math.min(el.width / vbW, el.height / vbH);
  const invScale = 1 / scale;

  return (
    <div
      ref={elRef}
      className="absolute inset-0 pointer-events-none z-[9998]"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0"
        style={{ pointerEvents: "none" }}
      >
        <path
          d={svgContent.match(/d="([^"]+)"/)?.[1] ?? ""}
          fill="none"
          stroke="rgba(108,92,231,0.6)"
          strokeWidth={2 * invScale}
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="none"
        />

        {points.map((p, i) => {
          const cps = getControlPoints(p);
          return cps.map((cp, ci) => (
            <line
              key={`line-${i}-${ci}`}
              x1={p.x} y1={p.y}
              x2={cp.x} y2={cp.y}
              stroke={LINE_COLOR}
              strokeWidth={invScale}
              strokeDasharray={`${4 * invScale}`}
            />
          ));
        })}

        {points.filter((p) => p.cmd !== "Z").map((p, i) => (
          <g key={`anchor-${i}`}>
            {getControlPoints(p).map((cp, ci) => (
              <circle
                key={`ctrl-${i}-${ci}`}
                cx={cp.x} cy={cp.y}
                r={CONTROL_SIZE * invScale}
                fill={CONTROL_COLOR}
                stroke="#fff"
                strokeWidth={1.5 * invScale}
                style={{ cursor: "pointer", pointerEvents: "all" }}
                onPointerDown={(e) => handlePointDown(e, i, true, ci, cp.x, cp.y)}
              />
            ))}
            <rect
              x={p.x - POINT_SIZE / 2 * invScale}
              y={p.y - POINT_SIZE / 2 * invScale}
              width={POINT_SIZE * invScale}
              height={POINT_SIZE * invScale}
              fill={HANDLE_COLOR}
              stroke="#fff"
              strokeWidth={1.5 * invScale}
              style={{ cursor: "pointer", pointerEvents: "all" }}
              onPointerDown={(e) => handlePointDown(e, i, false, undefined, p.x, p.y)}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
