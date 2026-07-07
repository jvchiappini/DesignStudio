import { useState, useRef, useCallback, useEffect } from "react";

interface BezierPoint {
  x: number;
  y: number;
  cx1: number; // incoming control point offset x
  cy1: number; // incoming control point offset y
  cx2: number; // outgoing control point offset x
  cy2: number; // outgoing control point offset y
}

interface Props {
  width: number;
  height: number;
  onPathChange: (pathD: string) => void;
  initialPath?: string;
}

const ANCHOR_RADIUS = 6;
const CONTROL_RADIUS = 4;

/** Parse a simple SVG path 'd' into anchor points (best effort) */
function parsePathToPoints(d: string, _w: number, _h: number): BezierPoint[] {
  const pts: BezierPoint[] = [];
  const cmdRe = /([MLCQSZ])\s*([-\d.,\s]+)/gi;
  let match;
  let lastX = 0, lastY = 0;
  while ((match = cmdRe.exec(d)) !== null) {
    const cmd = match[1];
    const args = match[2].trim().split(/[\s,]+/).map(Number);
    if (cmd === "M" && args.length >= 2) {
      lastX = args[0]; lastY = args[1];
      pts.push({ x: lastX, y: lastY, cx1: 0, cy1: 0, cx2: 0, cy2: 0 });
    } else if (cmd === "C" && args.length >= 6) {
      const [cx1, cy1, cx2, cy2, x, y] = args;
      lastX = x; lastY = y;
      pts.push({ x, y, cx1: cx1 - x, cy1: cy1 - y, cx2: cx2 - x, cy2: cy2 - y });
    } else if (cmd === "L" && args.length >= 2) {
      lastX = args[0]; lastY = args[1];
      pts.push({ x: lastX, y: lastY, cx1: 0, cy1: 0, cx2: 0, cy2: 0 });
    } else if (cmd === "Z" && pts.length > 0) {
      // closed path is handled by the parent component
    }
  }
  return pts;
}

export function BezierPathEditor({ width, height, onPathChange, initialPath }: Props) {
  const [points, setPoints] = useState<BezierPoint[]>(() => {
    if (initialPath) {
      const parsed = parsePathToPoints(initialPath, width, height);
      return parsed.length > 0 ? parsed : [];
    }
    return [];
  });
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [closed, setClosed] = useState(false);
  const svgRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<{
    type: "anchor" | "control1" | "control2" | "new_control";
    pointIdx: number;
    startX: number; startY: number;
    origX: number; origY: number;
    origCx1: number; origCy1: number;
    origCx2: number; origCy2: number;
  } | null>(null);

  // Notify parent when path changes
  useEffect(() => {
    if (points.length === 0) {
      onPathChange("");
      return;
    }
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const prev = points[i - 1];
      const hasIncomingControl = p.cx1 !== 0 || p.cy1 !== 0;
      const hasOutgoingControl = prev.cx2 !== 0 || prev.cy2 !== 0;
      if (hasIncomingControl || hasOutgoingControl) {
        const c1x = prev.x + prev.cx2;
        const c1y = prev.y + prev.cy2;
        const c2x = p.x + p.cx1;
        const c2y = p.y + p.cy1;
        d += ` C${c1x},${c1y} ${c2x},${c2y} ${p.x},${p.y}`;
      } else {
        d += ` L${p.x},${p.y}`;
      }
    }
    if (closed && points.length > 2) {
      const first = points[0];
      const last = points[points.length - 1];
      const hasCloseControl = last.cx2 !== 0 || last.cy2 !== 0 || first.cx1 !== 0 || first.cy1 !== 0;
      if (hasCloseControl) {
        const c1x = last.x + last.cx2;
        const c1y = last.y + last.cy2;
        const c2x = first.x + first.cx1;
        const c2y = first.y + first.cy1;
        d += ` C${c1x},${c1y} ${c2x},${c2y} ${first.x},${first.y} Z`;
      } else {
        d += " Z";
      }
    }
    onPathChange(d);
  }, [points, closed, onPathChange]);

  const getPointAt = useCallback((cx: number, cy: number): number | null => {
    for (let i = 0; i < points.length; i++) {
      const dx = cx - points[i].x;
      const dy = cy - points[i].y;
      if (dx * dx + dy * dy < 400) return i;
    }
    return null;
  }, [points]);

  const getControlAt = useCallback((cx: number, cy: number): { idx: number; which: "control1" | "control2" } | null => {
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const d1x = cx - (p.x + p.cx1);
      const d1y = cy - (p.y + p.cy1);
      if (d1x * d1x + d1y * d1y < 144) return { idx: i, which: "control1" };
      const d2x = cx - (p.x + p.cx2);
      const d2y = cy - (p.y + p.cy2);
      if (d2x * d2x + d2y * d2y < 144) return { idx: i, which: "control2" };
    }
    return null;
  }, [points]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (width / rect.width);
    const cy = (e.clientY - rect.top) * (height / rect.height);

    // Check control point hit
    const ctrl = getControlAt(cx, cy);
    if (ctrl !== null && selectedIdx === ctrl.idx) {
      const p = points[ctrl.idx];
      dragRef.current = {
        type: ctrl.which,
        pointIdx: ctrl.idx,
        startX: e.clientX, startY: e.clientY,
        origX: 0, origY: 0,
        origCx1: p.cx1, origCy1: p.cy1,
        origCx2: p.cx2, origCy2: p.cy2,
      };
      return;
    }

    // Check anchor point hit
    const anchor = getPointAt(cx, cy);
    if (anchor !== null) {
      setSelectedIdx(anchor);

      // Check if same as first point + enough points = close path
      if (anchor === 0 && points.length > 2 && selectedIdx !== 0) {
        setClosed(true);
        return;
      }

      const p = points[anchor];
      if (e.altKey) {
        dragRef.current = {
          type: "new_control" as const,
          pointIdx: anchor,
          startX: e.clientX, startY: e.clientY,
          origX: p.x, origY: p.y,
          origCx1: p.cx1, origCy1: p.cy1,
          origCx2: p.cx2, origCy2: p.cy2,
        };
        return;
      }

      // Start drag for adding/extending control handle
      dragRef.current = {
        type: "anchor",
        pointIdx: anchor,
        startX: e.clientX, startY: e.clientY,
        origX: p.x, origY: p.y,
        origCx1: p.cx1, origCy1: p.cy1,
        origCx2: p.cx2, origCy2: p.cy2,
      };
      return;
    }

    // Click on empty space -> add new point
    const newPt: BezierPoint = { x: cx, y: cy, cx1: 0, cy1: 0, cx2: 0, cy2: 0 };
    setPoints((prev) => [...prev, newPt]);
    setSelectedIdx(points.length);
    dragRef.current = {
      type: "new_control" as const,
      pointIdx: points.length,
      startX: e.clientX, startY: e.clientY,
      origX: cx, origY: cy,
      origCx1: 0, origCy1: 0,
      origCx2: 0, origCy2: 0,
    };
  }, [width, height, getPointAt, getControlAt, points, selectedIdx]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (width / rect.width);
    const cy = (e.clientY - rect.top) * (height / rect.height);
    const { type, pointIdx } = dragRef.current;

    setPoints((prev) => {
      const next = [...prev];
      const p = { ...next[pointIdx] };

      if (type === "anchor") {
        p.x = Math.max(0, Math.min(width, cx));
        p.y = Math.max(0, Math.min(height, cy));
        p.cx1 = Math.max(-width, Math.min(width, p.cx1));
        p.cy1 = Math.max(-height, Math.min(height, p.cy1));
        p.cx2 = Math.max(-width, Math.min(width, p.cx2));
        p.cy2 = Math.max(-height, Math.min(height, p.cy2));
      } else if (type === "control1") {
        p.cx1 = cx - p.x;
        p.cy1 = cy - p.y;
      } else if (type === "control2") {
        p.cx2 = cx - p.x;
        p.cy2 = cy - p.y;
      } else if (type === "new_control") {
        p.cx2 = cx - p.x;
        p.cy2 = cy - p.y;
        p.cx1 = -p.cx2;
        p.cy1 = -p.cy2;
      }

      next[pointIdx] = p;
      return next;
    });
  }, [width, height]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleClear = useCallback(() => {
    setPoints([]);
    setSelectedIdx(null);
    setClosed(false);
  }, []);

  const handleUndo = useCallback(() => {
    setPoints((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
    setSelectedIdx(null);
  }, []);

  // Draw the path
  const pathData = (() => {
    if (points.length === 0) return "";
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const prev = points[i - 1];
      const hasIncoming = p.cx1 !== 0 || p.cy1 !== 0;
      const hasOutgoing = prev.cx2 !== 0 || prev.cy2 !== 0;
      if (hasIncoming || hasOutgoing) {
        const c1x = prev.x + prev.cx2;
        const c1y = prev.y + prev.cy2;
        const c2x = p.x + p.cx1;
        const c2y = p.y + p.cy1;
        d += ` C${c1x},${c1y} ${c2x},${c2y} ${p.x},${p.y}`;
      } else {
        d += ` L${p.x},${p.y}`;
      }
    }
    if (closed && points.length > 2) {
      const last = points[points.length - 1];
      const first = points[0];
      const hasClose = last.cx2 !== 0 || last.cy2 !== 0 || first.cx1 !== 0 || first.cy1 !== 0;
      if (hasClose) {
        d += ` C${last.x + last.cx2},${last.y + last.cy2} ${first.x + first.cx1},${first.y + first.cy1} ${first.x},${first.y} Z`;
      } else {
        d += " Z";
      }
    }
    return d;
  })();

  return (
    <div
      ref={svgRef}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        cursor: "crosshair",
        pointerEvents: "auto",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
        {/* Fill area if closed */}
        {closed && points.length > 2 && (
          <path d={pathData} fill="rgba(108,92,231,0.15)" stroke="none" />
        )}

        {/* Path curve */}
        {points.length > 1 && (
          <path d={pathData}
            fill="none" stroke="#6c5ce7" strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Control lines for selected point */}
        {selectedIdx !== null && (() => {
          const p = points[selectedIdx];
          const elements: React.ReactNode[] = [];
          const showC1 = p.cx1 !== 0 || p.cy1 !== 0;
          const showC2 = p.cx2 !== 0 || p.cy2 !== 0;
          if (showC1) {
            elements.push(
              <line key="cl1" x1={p.x} y1={p.y} x2={p.x + p.cx1} y2={p.y + p.cy1}
                stroke="rgba(255,255,255,0.5)" strokeWidth={1} strokeDasharray="4 2" />,
              <circle key="cc1" cx={p.x + p.cx1} cy={p.y + p.cy1} r={CONTROL_RADIUS}
                fill="#fff" stroke="#6c5ce7" strokeWidth={1.5} />,
            );
          }
          if (showC2) {
            elements.push(
              <line key="cl2" x1={p.x} y1={p.y} x2={p.x + p.cx2} y2={p.y + p.cy2}
                stroke="rgba(255,255,255,0.5)" strokeWidth={1} strokeDasharray="4 2" />,
              <circle key="cc2" cx={p.x + p.cx2} cy={p.y + p.cy2} r={CONTROL_RADIUS}
                fill="#fff" stroke="#6c5ce7" strokeWidth={1.5} />,
            );
          }
          return elements;
        })()}

        {/* Anchor points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={ANCHOR_RADIUS}
            fill={i === selectedIdx ? "#6c5ce7" : "#fff"}
            stroke={i === selectedIdx ? "#fff" : "#6c5ce7"}
            strokeWidth={2} />
        ))}
      </svg>

      {/* Bottom toolbar */}
      <div style={{
        position: "absolute", bottom: -28, left: 0, right: 0,
        display: "flex", gap: 4, pointerEvents: "auto",
      }}>
        <button onClick={handleUndo}
          className="px-2 py-0.5 text-[9px] border border-border rounded bg-background text-muted-foreground hover:text-foreground cursor-pointer">
          Deshacer punto
        </button>
        <button onClick={handleClear}
          className="px-2 py-0.5 text-[9px] border border-border rounded bg-background text-muted-foreground hover:text-foreground cursor-pointer">
          Limpiar
        </button>
        {points.length > 2 && !closed && (
          <button onClick={() => setClosed(true)}
            className="px-2 py-0.5 text-[9px] border border-border rounded bg-background text-muted-foreground hover:text-foreground cursor-pointer">
            Cerrar path
          </button>
        )}
        <span className="text-[9px] text-muted-foreground self-center ml-auto">
          {points.length} punto{points.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
