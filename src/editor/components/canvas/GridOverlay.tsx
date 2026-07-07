import React from "react";
import { useEditorStore } from "../../store/editorStore";

interface Props {
  width?: number;
  height?: number;
}

export function GridOverlay({ width, height }: Props) {
  const showGrid = useEditorStore((s) => s.showGrid);
  const gridSize = useEditorStore((s) => s.gridSize);
  const storeWidth = useEditorStore((s) => s.canvasWidth);
  const storeHeight = useEditorStore((s) => s.canvasHeight);
  const zoom = useEditorStore((s) => s.zoom);

  const w = width ?? storeWidth;
  const h = height ?? storeHeight;

  if (!showGrid) return null;

  const step = gridSize;
  if (step * zoom < 4) return null;

  const lines: React.ReactElement[] = [];
  for (let x = 0; x <= w; x += step) {
    lines.push(
      <line key={`gx-${x}`} x1={x} y1={0} x2={x} y2={h}
        stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
    );
  }
  for (let y = 0; y <= h; y += step) {
    lines.push(
      <line key={`gy-${y}`} x1={0} y1={y} x2={w} y2={y}
        stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
    );
  }

  return (
    <svg className="absolute inset-0 pointer-events-none z-[1]"
      width={w} height={h}>
      {lines}
    </svg>
  );
}
