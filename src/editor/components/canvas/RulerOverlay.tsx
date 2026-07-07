import { useMemo, useState, useEffect, useCallback } from "react";
import { useEditorStore } from "../../store/editorStore";

const RULER_SIZE = 20;
const TICK_STEPS = [1, 5, 10, 25, 50, 100, 250, 500];

function calcStep(pxPerUnit: number): number {
  for (const s of TICK_STEPS) {
    if (s * pxPerUnit >= 50) return s;
  }
  return TICK_STEPS[TICK_STEPS.length - 1];
}

const TICK_COLOR = "rgba(255,255,255,0.3)";
const LABEL_COLOR = "rgba(255,255,255,0.4)";
const BG_COLOR = "#1e1e2e";
const GAP_COLOR = "#2a2a3e";

interface GapRange {
  start: number;
  width: number;
}

interface RulerProps {
  length: number;
  zoom: number;
  direction: "horizontal" | "vertical";
  offset?: number;
  gapRanges?: GapRange[];
}

function RulerSVG({ length, zoom, direction, offset = 0, gapRanges = [] }: RulerProps) {
  const pxStep = calcStep(zoom) * zoom;

  const isInGap = useCallback((pos: number) => {
    return gapRanges.some((g) => pos >= g.start && pos <= g.start + g.width);
  }, [gapRanges]);

  const ticks = useMemo(() => {
    const t: { pos: number; label: string; major: boolean }[] = [];
    const step = calcStep(zoom);
    for (let p = 0; p <= length; p += pxStep) {
      if (isInGap(p)) continue;
      const val = Math.round((p + offset) / zoom);
      t.push({ pos: p, label: String(val), major: val % (step * 5) === 0 });
    }
    return t;
  }, [length, pxStep, zoom, offset, isInGap]);

  if (direction === "horizontal") {
    return (
      <svg width={length} height={RULER_SIZE} className="block shrink-0">
        <rect width={length} height={RULER_SIZE} fill={BG_COLOR} />
        {gapRanges.map((g, i) => (
          <g key={i}>
            <rect x={g.start} y={0} width={g.width} height={RULER_SIZE} fill={GAP_COLOR} />
            <line x1={g.start + 2} y1={0} x2={g.start} y2={RULER_SIZE}
              stroke={TICK_COLOR} strokeWidth={1} />
            <line x1={g.start + g.width - 2} y1={0} x2={g.start + g.width} y2={RULER_SIZE}
              stroke={TICK_COLOR} strokeWidth={1} />
          </g>
        ))}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={t.pos} y1={RULER_SIZE} x2={t.pos} y2={t.major ? 6 : 12}
              stroke={TICK_COLOR} strokeWidth={1} />
            {t.major && (
              <text x={t.pos + 4} y={14} fill={LABEL_COLOR}
                fontSize={11} fontFamily="monospace">
                {t.label}
              </text>
            )}
          </g>
        ))}
        <line x1={0} y1={RULER_SIZE - 1} x2={length} y2={RULER_SIZE - 1}
          stroke={TICK_COLOR} strokeWidth={1} />
      </svg>
    );
  }

  return (
    <svg width={RULER_SIZE} height={length} className="block shrink-0">
      <rect width={RULER_SIZE} height={length} fill={BG_COLOR} />
      {gapRanges.map((g, i) => (
        <g key={i}>
          <rect x={0} y={g.start} width={RULER_SIZE} height={g.width} fill={GAP_COLOR} />
          <line x1={0} y1={g.start + 2} x2={RULER_SIZE} y2={g.start}
            stroke={TICK_COLOR} strokeWidth={1} />
          <line x1={0} y1={g.start + g.width - 2} x2={RULER_SIZE} y2={g.start + g.width}
            stroke={TICK_COLOR} strokeWidth={1} />
        </g>
      ))}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={RULER_SIZE} y1={t.pos} x2={t.major ? 6 : 12} y2={t.pos}
            stroke={TICK_COLOR} strokeWidth={1} />
          {t.major && (
            <text x={10} y={t.pos + 4} fill={LABEL_COLOR}
              fontSize={11} fontFamily="monospace" textAnchor="middle"
              transform={`rotate(-90, 10, ${t.pos + 4})`}>
              {t.label}
            </text>
          )}
        </g>
      ))}
      <line x1={RULER_SIZE - 1} y1={0} x2={RULER_SIZE - 1} y2={length}
        stroke={TICK_COLOR} strokeWidth={1} />
    </svg>
  );
}

function computeGapRanges(
  pages: { width: number }[],
  pageGap: number,
  zoom: number,
): GapRange[] {
  const ranges: GapRange[] = [];
  let cursor = 0;
  for (let i = 0; i < pages.length; i++) {
    cursor += pages[i].width * zoom;
    if (i < pages.length - 1) {
      ranges.push({ start: cursor, width: pageGap * zoom });
      cursor += pageGap * zoom;
    }
  }
  return ranges;
}

export function RulerOverlay({ containerRef, panOffset }: { containerRef: { current: HTMLDivElement | null }; panOffset: { x: number; y: number } }) {
  const showRulers = useEditorStore((s) => s.showRulers);
  const zoom = useEditorStore((s) => s.zoom);
  const carouselWidth = useEditorStore((s) => s.carouselWidth);
  const carouselHeight = useEditorStore((s) => s.carouselHeight);
  const guideMode = useEditorStore((s) => s.guideMode);
  const pages = useEditorStore((s) => s.pages);
  const activePageIndex = useEditorStore((s) => s.activePageIndex);
  const pageGap = useEditorStore((s) => s.pageGap);
  const addGuide = useEditorStore((s) => s.addGuide);
  const [draggingGuide, setDraggingGuide] = useState<{ orientation: "horizontal" | "vertical" } | null>(null);

  const [rulerPos, setRulerPos] = useState({ left: 0, top: 0, w: 0, h: 0 });

  const updateRulerPos = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const canvasEl = container.querySelector<HTMLDivElement>('[data-canvas-root="true"]');
    if (!canvasEl) return;

    if (guideMode === "global") {
      const vr = canvasEl.getBoundingClientRect();
      setRulerPos({ left: vr.left - cr.left, top: vr.top - cr.top, w: vr.width, h: vr.height });
    } else {
      const pageEl = container.querySelector<HTMLElement>(`[data-page-index="${activePageIndex}"]`);
      if (!pageEl) return;
      const pr = pageEl.getBoundingClientRect();
      setRulerPos({ left: pr.left - cr.left, top: pr.top - cr.top, w: pr.width, h: pr.height });
    }
  }, [containerRef, activePageIndex, guideMode]);

  useEffect(() => { updateRulerPos(); }, [updateRulerPos, zoom, carouselWidth, carouselHeight, panOffset.x, panOffset.y, pageGap]);

  useEffect(() => {
    const obs = new ResizeObserver(updateRulerPos);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [containerRef, updateRulerPos]);

  useEffect(() => {
    if (!draggingGuide) return;
    const onMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const cr = container.getBoundingClientRect();
      if (draggingGuide.orientation === "horizontal") {
        const preview = document.getElementById("guide-drag-preview");
        if (preview) preview.style.top = `${e.clientY - cr.top}px`;
      } else {
        const preview = document.getElementById("guide-drag-preview");
        if (preview) preview.style.left = `${e.clientX - cr.left}px`;
      }
    };
    const onUp = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const store = useEditorStore.getState();
      const pageId = store.guideMode === "global" ? undefined : store.pages[store.activePageIndex]?.id;

      let originLeft = 0;
      let originTop = 0;
      if (store.guideMode === "global" || !pageId) {
        const canvasEl = container.querySelector<HTMLDivElement>('[data-canvas-root="true"]');
        if (!canvasEl) return;
        const vr = canvasEl.getBoundingClientRect();
        originLeft = vr.left;
        originTop = vr.top;
      } else {
        const pageEl = container.querySelector<HTMLElement>(`[data-page-index="${store.activePageIndex}"]`);
        if (!pageEl) return;
        const pr = pageEl.getBoundingClientRect();
        originLeft = pr.left;
        originTop = pr.top;
      }

      if (draggingGuide.orientation === "horizontal") {
        const pos = Math.round((e.clientY - originTop) / zoom);
        addGuide(pos, "horizontal", pageId);
      } else {
        const pos = Math.round((e.clientX - originLeft) / zoom);
        addGuide(pos, "vertical", pageId);
      }
      const preview = document.getElementById("guide-drag-preview");
      if (preview) preview.remove();
      setDraggingGuide(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [draggingGuide, zoom, addGuide, containerRef]);

  if (!showRulers || rulerPos.w === 0) return null;

  const { left, top, w, h } = rulerPos;

  const gapRanges = guideMode === "global" && pageGap > 0
    ? computeGapRanges(pages, pageGap, zoom)
    : [];

  const startGuide = (orientation: "horizontal" | "vertical", clientPos: number) => {
    const container = containerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const preview = document.createElement("div");
    preview.id = "guide-drag-preview";
    const screenX = clientPos - cr.left;
    const screenY = clientPos - cr.top;
    preview.style.cssText = `position:absolute;z-index:9999;pointer-events:none;` +
      (orientation === "horizontal"
        ? `left:${left}px;top:${screenY}px;width:${w}px;height:1px;background:rgba(0,150,255,0.8);`
        : `left:${screenX}px;top:${top}px;width:1px;height:${h}px;background:rgba(0,150,255,0.8);`);
    container.appendChild(preview);
    setDraggingGuide({ orientation });
  };

  return (
    <>
      <div style={{ position: "absolute", left: left - RULER_SIZE, top: top - RULER_SIZE, width: RULER_SIZE, height: RULER_SIZE, zIndex: 3, pointerEvents: "none", background: "#1e1e2e" }} />
      <div style={{ position: "absolute", left: left, top: top - RULER_SIZE, width: w, zIndex: 3, pointerEvents: "auto", cursor: "ns-resize" }}
        onPointerDown={(e) => { e.stopPropagation(); startGuide("horizontal", e.clientY); }}>
        <RulerSVG length={w} zoom={zoom} direction="horizontal" offset={0} gapRanges={gapRanges} />
      </div>
      <div style={{ position: "absolute", left: left - RULER_SIZE, top: top, height: h, zIndex: 3, pointerEvents: "auto", cursor: "ew-resize" }}
        onPointerDown={(e) => { e.stopPropagation(); startGuide("vertical", e.clientX); }}>
        <RulerSVG length={h} zoom={zoom} direction="vertical" offset={0} />
      </div>
    </>
  );
}
