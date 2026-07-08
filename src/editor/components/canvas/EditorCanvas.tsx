import { useRef, useCallback, useState, useEffect, useMemo, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEditorStore } from "../../store/editorStore";
import { renderElementContent } from "../../utils/renderElement";
import type { ResizeHandle } from "../../utils/types";
import { PathEditor } from "../tools/PathEditor";
import { calculateOptimalFontSize } from "../../utils/textMeasure";
import type { Page } from "../../utils/types";

function findPageOffset(x: number, pages: Page[], pageGap: number): number {
  let off = 0;
  for (let pi = 0; pi < pages.length; pi++) {
    const end = off + pages[pi].width;
    if (x >= off && x < end) return off;
    off += pages[pi].width + pageGap;
  }
  return 0;
}
import { GridOverlay } from "./GridOverlay";
import { RulerOverlay } from "./RulerOverlay";
import { GuideOverlay } from "./GuideOverlay";
import { CropOverlay } from "./CropOverlay";
import { CropPreviewOverlay } from "./CropPreviewOverlay";
import { layersToBackground, hasActiveLayers } from "../../utils/backgroundUtils";

interface DragState {
  elementId: string;
  startX: number; startY: number;
  startElX: number; startElY: number;
  handle: ResizeHandle | null;
  startW: number; startH: number;
  moved: boolean;
  multiIds?: string[];
  multiOrigins?: { x: number; y: number }[];
}

const HANDLE_SIZE = 10;
const HANDLE_COLOR = "#6c5ce7";

const handlePositions: { key: ResizeHandle; sx: number; sy: number }[] = [
  { key: "nw", sx: 0, sy: 0 }, { key: "n", sx: 0.5, sy: 0 }, { key: "ne", sx: 1, sy: 0 },
  { key: "w", sx: 0, sy: 0.5 }, { key: "e", sx: 1, sy: 0.5 },
  { key: "sw", sx: 0, sy: 1 }, { key: "s", sx: 0.5, sy: 1 }, { key: "se", sx: 1, sy: 1 },
];

function handleCursor(handle: ResizeHandle): string {
  const map: Record<ResizeHandle, string> = {
    nw: "nwse-resize", n: "ns-resize", ne: "nesw-resize",
    w: "ew-resize", e: "ew-resize",
    sw: "nesw-resize", s: "ns-resize", se: "nwse-resize",
  };
  return map[handle];
}

export function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [editText, setEditText] = useState("");
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const rotationRef = useRef({ startAngle: 0, elCenterX: 0, elCenterY: 0 });

  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const setPan = useEditorStore((s) => s.setPan);
  const panRef = useRef({ x: panX, y: panY });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ startX: 0, startY: 0, startPanX: 0, startPanY: 0 });

  const snapGuidesRef = useRef<{ pos: number; horizontal: boolean }[]>([]);

  const elements = useEditorStore((s) => s.elements);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const pages = useEditorStore((s) => s.pages);
  const activePageIndex = useEditorStore((s) => s.activePageIndex);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const pageGap = useEditorStore((s) => s.pageGap);
  const zoom = useEditorStore((s) => s.zoom);
  const editingTextId = useEditorStore((s) => s.editingTextId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const moveElement = useEditorStore((s) => s.moveElement);
  const moveElements = useEditorStore((s) => s.moveElements);
  const resizeElement = useEditorStore((s) => s.resizeElement);
  const rotateElement = useEditorStore((s) => s.rotateElement);
  const updateElement = useEditorStore((s) => s.updateElement);
  const setEditingTextId = useEditorStore((s) => s.setEditingTextId);
  const pathEditingId = useEditorStore((s) => s.pathEditingId);
  const cropElementId = useEditorStore((s) => s.cropElementId);
  const saveSnapshot = useEditorStore((s) => s.saveSnapshot);
  const setZoom = useEditorStore((s) => s.setZoom);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const store = useEditorStore.getState();
      const oldZoom = store.zoom;
      const delta = -e.deltaY * 0.001;
      const newZoom = Math.max(0.1, Math.min(5, oldZoom + delta));
      setZoom(newZoom);
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - rect.left - rect.width / 2;
      const dy = e.clientY - rect.top - rect.height / 2;
      const curPan = panRef.current;
      const nextPan = {
        x: dx - (dx - curPan.x) * (newZoom / oldZoom),
        y: dy - (dy - curPan.y) * (newZoom / oldZoom),
      };
      panRef.current = nextPan;
      setPan(nextPan.x, nextPan.y);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [setZoom]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const store = useEditorStore.getState();
        if (store.pathEditingId) store.setPathEditingId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    panRef.current = { x: panX, y: panY };
  }, [panX, panY]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, elId: string, handle: ResizeHandle | null) => {
      e.stopPropagation();
      // Allow text editor clicks to reach the textarea (cursor placement, selection)
      if ((e.target as HTMLElement).closest('[data-text-editor="true"]')) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const state = useEditorStore.getState();
      const el = state.elements.find((el) => el.id === elId);
      if (!el || el.locked) return;
      selectElement(elId, e.shiftKey);
      const allSelected = state.selectedIds.includes(elId) ? state.selectedIds : [elId];
      const multiOrigins = allSelected.map((id) => {
        const el = state.elements.find((e) => e.id === id);
        return { x: el?.x ?? 0, y: el?.y ?? 0 };
      });
      setDrag({
        elementId: elId, startX: e.clientX, startY: e.clientY,
        startElX: el.x, startElY: el.y,
        handle, startW: el.width, startH: el.height, moved: false,
        multiIds: allSelected.length > 1 ? allSelected : undefined,
        multiOrigins: allSelected.length > 1 ? multiOrigins : undefined,
      });
    },
    [selectElement],
  );

  const handleRotateStart = useCallback(
    (e: React.PointerEvent, elId: string) => {
      e.stopPropagation();
      e.preventDefault();
      const elNode = canvasRef.current?.querySelector(`[data-element-id="${elId}"]`);
      if (!elNode) return;
      const rect = elNode.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      rotationRef.current = {
        startAngle: Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI),
        elCenterX: cx,
        elCenterY: cy,
      };
      setRotatingId(elId);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const pageLefts = useMemo(() => {
    const lefts: number[] = [];
    let acc = 0;
    for (const p of pages) {
      lefts.push(acc);
      acc += p.width + pageGap;
    }
    return lefts;
  }, [pages, pageGap]);

  const offsets = useMemo(() => {
    const off: number[] = [];
    let acc = 0;
    for (const p of pages) {
      off.push(acc);
      acc += p.width;
    }
    return off;
  }, [pages]);

  const handleContainerPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (useEditorStore.getState().cropElementId) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-handle]")) return;
      clearSelection();

      // Detect page from coordinates (page div has pointerEvents:none)
      const canvasEl = (e.currentTarget as HTMLElement).querySelector<HTMLDivElement>('[data-canvas-root="true"]');
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / zoom;
        for (let i = 0; i < pages.length; i++) {
          const ps = pageLefts[i];
          if (cx >= ps && cx < ps + pages[i].width) {
            if (i !== activePageIndex) setActivePage(i);
            break;
          }
        }
      }

      setIsPanning(true);
      panStartRef.current = {
        startX: e.clientX, startY: e.clientY,
        startPanX: panRef.current.x, startPanY: panRef.current.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [clearSelection, activePageIndex, setActivePage, zoom, pages, pageLefts],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning) {
        const { startX, startY, startPanX, startPanY } = panStartRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const nextPan = { x: startPanX + dx, y: startPanY + dy };
        panRef.current = nextPan;
        setPan(nextPan.x, nextPan.y);
        return;
      }

      if (rotatingId) {
        const { startAngle, elCenterX, elCenterY } = rotationRef.current;
        const angle = Math.atan2(e.clientY - elCenterY, e.clientX - elCenterX) * (180 / Math.PI);
        const delta = angle - startAngle;
        const el = useEditorStore.getState().elements.find((el) => el.id === rotatingId);
        if (el) {
          const newRotation = ((el.rotation + delta) % 360 + 360) % 360;
          rotateElement(rotatingId, newRotation);
        }
        rotationRef.current = { startAngle: angle, elCenterX, elCenterY };
        return;
      }

      if (!drag) return;
      let dx = (e.clientX - drag.startX) / zoom;
      let dy = (e.clientY - drag.startY) / zoom;
      if (Math.abs(e.clientX - drag.startX) > 2 || Math.abs(e.clientY - drag.startY) > 2) {
        (drag as typeof drag & { moved: boolean }).moved = true;
      }

      let newX = drag.startElX;
      let newY = drag.startElY;
      let newW = drag.startW;
      let newH = drag.startH;

      if (!drag.handle) {
        newX = drag.startElX + dx;
        newY = drag.startElY + dy;
      }

      if (drag.handle) {
        if (drag.handle.includes("e")) {
          const oldRight = drag.startElX + drag.startW;
          const newRight = drag.startElX + drag.startW + dx;
          const oldGapR = gapShift(oldRight);
          const newGapR = gapShift(newRight);
          newW = Math.max(10, drag.startW + dx - (newGapR - oldGapR));
        }
        if (drag.handle.includes("w")) {
          const oldLeft = drag.startElX;
          const newLeft = drag.startElX + dx;
          const oldGapL = gapShift(oldLeft);
          const newGapL = gapShift(newLeft);
          const gapDelta = newGapL - oldGapL;
          newX = drag.startElX + dx - gapDelta;
          newW = Math.max(10, drag.startW - dx + gapDelta);
        }
        if (drag.handle.includes("s")) newH = Math.max(10, drag.startH + dy);
        if (drag.handle.includes("n")) { newH = Math.max(10, drag.startH - dy); newY = drag.startElY + dy; }

        // Shift → lock aspect ratio on corner handles
        if (e.shiftKey && drag.handle.length === 2) {
          const aspect = drag.startW / drag.startH;
          const newWVal = newW;
          const newHVal = newWVal / aspect;
          if (drag.handle.includes("n")) {
            newY = drag.startElY + (drag.startH - newHVal);
          }
          if (drag.handle.includes("w")) {
            newX = drag.startElX + (drag.startW - newWVal);
          }
          newW = newWVal;
          newH = newHVal;
        }
      }

      const store = useEditorStore.getState();

      // snap guides
      if (!drag.handle && !store.snapToGrid) {
        const guides: { pos: number; horizontal: boolean }[] = [];
        const dragEl = store.elements.find((el) => el.id === drag.elementId);
        if (dragEl) {
          const cx = dragEl.x + dragEl.width / 2;
          const cy = dragEl.y + dragEl.height / 2;
          const edges: [number, number, number, number] = [dragEl.x, cx, dragEl.x + dragEl.width, 0];
          const edgesY: [number, number, number, number] = [dragEl.y, cy, dragEl.y + dragEl.height, 0];
          const THRESHOLD = 5 / zoom;

          for (const other of store.elements) {
            if (other.id === drag.elementId || other.groupId === dragEl.groupId) continue;
            const oCx = other.x + other.width / 2;
            const oCy = other.y + other.height / 2;
            const oEdges = [other.x, oCx, other.x + other.width];
            const oEdgesY = [other.y, oCy, other.y + other.height];

            for (let i = 0; i < 3; i++) {
              const d = Math.abs(edges[i] - oEdges[i]);
              if (d < THRESHOLD) {
                guides.push({ pos: oEdges[i], horizontal: false });
                if (!drag.handle) newX = drag.startElX + (oEdges[i] - edges[i]);
              }
            }
            for (let i = 0; i < 3; i++) {
              const d = Math.abs(edgesY[i] - oEdgesY[i]);
              if (d < THRESHOLD) {
                guides.push({ pos: oEdgesY[i], horizontal: true });
                if (!drag.handle) newY = drag.startElY + (oEdgesY[i] - edgesY[i]);
              }
            }
          }
        }
        snapGuidesRef.current = guides;
      } else {
        snapGuidesRef.current = [];
      }

      if (store.snapToGrid && !drag.handle) {
        const gs = store.gridSize;
        newX = Math.round(newX / gs) * gs;
        newY = Math.round(newY / gs) * gs;
      }

      const movedIds: string[] = [];

      if (drag.handle) {
        resizeElement(drag.elementId, newW, newH);
        moveElement(drag.elementId, newX, newY);
        movedIds.push(drag.elementId);
        // Real-time auto-fit font size during resize for text with autoFitSize=true
        const autoEl = useEditorStore.getState().elements.find((e) => e.id === drag.elementId);
        if (autoEl && autoEl.type === "text" && autoEl.autoFitSize) {
          const optimalSize = calculateOptimalFontSize(autoEl);
          if (optimalSize !== null && Math.abs(optimalSize - (autoEl.fontSize ?? 0)) > 0.5) {
            useEditorStore.getState().updateElement(drag.elementId, { fontSize: optimalSize });
          }
        }
      } else {
        const dx = newX - drag.startElX;
        const dy = newY - drag.startElY;
        if (drag.multiIds && drag.multiIds.length > 1 && drag.multiOrigins) {
          // Single atomic update for all selected elements
          useEditorStore.setState((s) => ({
            elements: s.elements.map((e) => {
              const idx = drag.multiIds!.indexOf(e.id);
              if (idx === -1) return e;
              const orig = drag.multiOrigins![idx];
              return { ...e, x: orig.x + dx, y: orig.y + dy };
            }),
          }));
          movedIds.push(...drag.multiIds);
        } else {
          moveElement(drag.elementId, newX, newY);
          movedIds.push(drag.elementId);
        }
      }

      // Recalculate anchor offsets for moved elements
      const st = useEditorStore.getState();
      for (const mid of movedIds) {
        const me = st.elements.find((e) => e.id === mid);
        if (!me || (!me.leftAnchor && !me.rightAnchor)) continue;
        const pageOff = findPageOffset(me.x, st.pages, st.pageGap);
        const offsetUpdates: Partial<import("../../utils/types").DesignElement> = {};
        if (me.leftAnchor) {
          const g = st.guides.find((g) => g.id === me.leftAnchor);
          if (g) offsetUpdates.leftAnchorOffset = me.x - (g.position + pageOff);
        }
        if (me.rightAnchor) {
          const g = st.guides.find((g) => g.id === me.rightAnchor);
          if (g) offsetUpdates.rightAnchorOffset = (me.x + me.width) - (g.position + pageOff);
        }
        if (Object.keys(offsetUpdates).length > 0) {
          st.updateElement(mid, offsetUpdates);
        }
      }
    },
    [drag, zoom, isPanning, moveElement, moveElements, resizeElement, calculateOptimalFontSize],
  );

  const handlePointerUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (rotatingId) {
      setRotatingId(null);
      saveSnapshot();
      return;
    }
    if (!drag) return;
    if (drag.moved && drag.handle) {
      saveSnapshot();
      // After resize, auto-fit font size for text elements with autoFitSize=true
      const state = useEditorStore.getState();
      const elementIds = drag.multiIds ?? [drag.elementId];
      for (const eid of elementIds) {
        const el = state.elements.find((e) => e.id === eid);
        if (el && el.type === "text" && el.autoFitSize) {
          const optimalSize = calculateOptimalFontSize(el);
          if (optimalSize !== null && optimalSize !== el.fontSize) {
            state.updateElement(eid, { fontSize: optimalSize });
          }
        }
      }
    }
    setDrag(null);
    snapGuidesRef.current = [];
  }, [drag, saveSnapshot, isPanning, rotatingId]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent, elId: string) => {
      e.stopPropagation();
      // Don't re-enter edit mode when double-clicking inside the textarea
      if ((e.target as HTMLElement).closest('[data-text-editor="true"]')) return;
      const state = useEditorStore.getState();
      const el = state.elements.find((el) => el.id === elId);
      if (el?.type === "text") {
        setEditText(el.text ?? "");
        setEditingTextId(elId);
        requestAnimationFrame(() => editTextareaRef.current?.focus());
      }
    },
    [setEditingTextId],
  );

  const finishEditing = useCallback(() => {
    if (editingTextId) {
      updateElement(editingTextId, { text: editText });
      setEditingTextId(null);
      saveSnapshot();
    }
  }, [editingTextId, editText, updateElement, saveSnapshot]);

  const handleEditKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") { setEditingTextId(null); return; }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { finishEditing(); }
    },
    [setEditingTextId, finishEditing],
  );

  // Context menu
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const ctxMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [ctxMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const ctxAction = useCallback((fn: () => void) => {
    fn();
    setCtxMenu(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;
    let parsed: { type: string; data: unknown };
    try { parsed = JSON.parse(raw); } catch { return; }

    const canvasRoot = containerRef.current?.querySelector<HTMLDivElement>('[data-canvas-root="true"]');
    if (!canvasRoot) return;
    const rect = canvasRoot.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) / zoom;
    const canvasY = (e.clientY - rect.top) / zoom;

    const store = useEditorStore.getState();
    if (parsed.type === "shape") {
      store.addShape(parsed.data as any, { x: canvasX, y: canvasY });
    } else if (parsed.type === "text") {
      store.addText({ ...(parsed.data as object), x: canvasX, y: canvasY } as any);
    }
  }, [zoom]);

  useEffect(() => {
    if (!editingTextId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-text-editor="true"]')) finishEditing();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editingTextId, finishEditing]);

  const carouselW = pages.length > 0
    ? offsets[offsets.length - 1] + pages[pages.length - 1].width + (pages.length - 1) * pageGap
    : 800;
  const carouselH = pages.length > 0 ? Math.max(...pages.map((p) => p.height)) : 600;

  // Compute the visual x offset (gap shift) for an element at global x
  const gapShift = useCallback((x: number) => {
    if (pageGap === 0) return 0;
    for (let i = pages.length - 1; i >= 0; i--) {
      if (x >= offsets[i]) return i * pageGap;
    }
    return 0;
  }, [pageGap, pages, offsets]);

  const transformStyle: CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: `translate(-50%, -50%) translate(${panX}px, ${panY}px) scale(${zoom})`,
    transformOrigin: "center center",
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden bg-[#232338] relative min-h-0"
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
      onPointerDown={handleContainerPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
    >
      <RulerOverlay containerRef={containerRef} panOffset={{ x: panX, y: panY }} />
      <div style={transformStyle}>
        <div
          ref={canvasRef}
          data-canvas-root="true"
          style={{
            position: "relative",
            width: carouselW,
            height: carouselH,
          }}
        >
          {/* Page layers with clipped elements */}
          {pages.map((page, i) => {
            const isActive = i === activePageIndex;
            const isTransparent = !page.bgColor || page.bgColor === "transparent" || page.bgColor === "";
            const pageStart = pageLefts[i];
            const pageEnd = pageStart + page.width;

            // Elements overlapping this page (positioned relative to page)
            const overlapping = elements.filter((el) =>
              el.x < pageEnd && el.x + el.width > pageStart
            );

            return (
              <div key={page.id}
                data-page="true"
                data-page-index={i}
                data-active={isActive ? "true" : "false"}
                style={{
                  position: "absolute",
                  left: pageLefts[i],
                  top: 0,
                  width: page.width,
                  height: page.height,
                  boxShadow: isActive
                    ? "0 2px 20px rgba(0,0,0,0.5), 0 0 0 2px #6c5ce7"
                    : "0 2px 12px rgba(0,0,0,0.4)",
                  borderRadius: 4,
                  overflow: "hidden",
                  pointerEvents: "none",
                }}
              >
                {/* Page background */}
                <div data-page-bg="true" style={{
                  position: "absolute", inset: 0,
                  backgroundColor: isTransparent ? undefined : page.bgColor,
                  ...(isTransparent ? {
                    backgroundImage: [
                      "linear-gradient(45deg, #1e1e2e 25%, transparent 25%)",
                      "linear-gradient(-45deg, #1e1e2e 25%, transparent 25%)",
                      "linear-gradient(45deg, transparent 75%, #1e1e2e 75%)",
                      "linear-gradient(-45deg, transparent 75%, #1e1e2e 75%)",
                    ].join(","),
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  } : {}),
                  ...(hasActiveLayers(page.bgLayers) ? {
                    background: layersToBackground(page.bgLayers) + (page.bgColor && page.bgColor !== "transparent" ? `, ${page.bgColor}` : ""),
                  } : {}),
                }} />
                {isActive && <GridOverlay width={page.width} height={page.height} />}
                {isActive && <GuideOverlay width={page.width} height={page.height} pageId={page.id} />}

                {/* Clipped element visuals */}
                {overlapping.map((el) => {
                  const elPageX = el.x - pageStart;
                  const isEditingText = editingTextId === el.id;
                  return (
                    <div key={el.id} style={{
                      position: "absolute",
                      ...renderElementContent(el).style,
                      left: elPageX,
                      top: el.y,
                      ...(isEditingText ? { opacity: 0, pointerEvents: "none" } : {}),
                      ...(el.hidden ? { opacity: 0, pointerEvents: "none" } : {}),
                    }}>
                      {renderElementContent(el).content}
                    </div>
                  );
                })}

                {/* Visual page divider (always shown at page boundary) */}
                {i < pages.length - 1 && (
                  <div data-page-divider="true" style={{
                    position: "absolute",
                    right: 0, top: 0, bottom: 0,
                    width: 2,
                    background: "rgba(255,255,255,0.15)",
                    boxShadow: "1px 0 4px rgba(0,0,0,0.3)",
                    pointerEvents: "none",
                  }} />
                )}

                {elements.length === 0 && isActive && (
                  <div className="absolute inset-0 flex items-center justify-center text-[rgba(255,255,255,0.2)] text-base pointer-events-none font-sans">
                    Haz clic en Elementos o Texto para empezar
                  </div>
                )}
              </div>
            );
          })}

          <CropPreviewOverlay />
          <CropOverlay />

          {/* Interaction layer (global coordinates, handles pointer events) */}
          {elements.filter((el) => !el.hidden && !cropElementId).map((el) => {
            const isSelected = selectedIds.includes(el.id) && !cropElementId;
            const isEditing = editingTextId === el.id;

            const gapOff = gapShift(el.x);
            const gapOffRight = gapShift(el.x + el.width);
            const spanWidth = el.width + gapOffRight - gapOff;

            return (
              <div
                key={`i-${el.id}`}
                data-element-id={el.id}
                style={{
                  position: "absolute",
                  left: el.x,
                  top: el.y,
                  width: spanWidth,
                  height: el.height,
                  zIndex: 9999,
                  pointerEvents: "auto",
                }}
                onPointerDown={(e) => handlePointerDown(e, el.id, null)}
                onDoubleClick={(e) => handleDoubleClick(e, el.id)}
              >
                {/* Text editing overlay */}
                {isEditing && (
                  <textarea
                    ref={editTextareaRef}
                    data-text-editor="true"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={finishEditing}
                    style={{
                      width: "100%", height: "100%",
                      background: "transparent", border: "none",
                      color: el.color ?? "#fff",
                      caretColor: el.color ?? "#fff",
                      fontSize: el.fontSize, fontFamily: el.fontFamily,
                      fontWeight: el.fontWeight, fontStyle: el.fontStyle,
                      textAlign: el.textAlign,
                      resize: "none", outline: "none",
                      padding: 4,
                      boxSizing: "border-box",
                      lineHeight: 1.2, overflow: "hidden",
                    }}
                  />
                )}

                {/* Path editor */}
                {pathEditingId === el.id && <PathEditor el={el} />}

                {/* Selection handles */}
                {isSelected && !isEditing && pathEditingId !== el.id && (
                  <>
                    <div data-selection="true" className="absolute inset-0 border-2 pointer-events-none box-border rounded-sm"
                      style={{ borderColor: HANDLE_COLOR }} />
                    {handlePositions.map((hp) => (
                      <div key={hp.key} data-handle="true"
                        onPointerDown={(e) => handlePointerDown(e, el.id, hp.key)}
                        style={{
                          position: "absolute", width: HANDLE_SIZE, height: HANDLE_SIZE,
                          backgroundColor: HANDLE_COLOR, border: "2px solid #fff",
                          borderRadius: 2, cursor: handleCursor(hp.key), zIndex: 9999,
                          left: `calc(${hp.sx * 100}% - ${HANDLE_SIZE / 2}px)`,
                          top: `calc(${hp.sy * 100}% - ${HANDLE_SIZE / 2}px)`,
                        }} />
                    ))}
                    <div data-selection="true" className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-px h-[30px] bg-[rgba(108,92,231,0.4)] pointer-events-none"
                      style={{ transform: `translateX(-0.5px)` }} />
                    <div data-handle="true"
                      onPointerDown={(e) => handleRotateStart(e, el.id)}
                      className="absolute top-[-36px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white cursor-grab z-[9999]"
                      style={{ backgroundColor: HANDLE_COLOR }} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <div ref={ctxMenuRef}
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          className="fixed z-[200] min-w-[160px] bg-popover border border-border rounded-lg shadow-xl py-1"
          onClick={(e) => e.stopPropagation()}
        >
          {[
            {
              label: "Copiar", shortcut: "Ctrl+C", fn: () => {
                const state = useEditorStore.getState();
                const copied = state.elements.filter((el) => state.selectedIds.includes(el.id)).map((el) => JSON.parse(JSON.stringify(el)));
                useEditorStore.setState({ clipboard: copied });
              }
            },
            {
              label: "Pegar", shortcut: "Ctrl+V", fn: () => {
                const state = useEditorStore.getState();
                if (state.clipboard.length === 0) return;
                state.saveSnapshot();
                const maxZ = Math.max(...state.elements.map((el) => el.zIndex), 0);
                const newEls = state.clipboard.map((el, i) => ({
                  ...JSON.parse(JSON.stringify(el)),
                  id: `el_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
                  x: el.x + 30, y: el.y + 30, zIndex: maxZ + i + 1,
                }));
                useEditorStore.setState((s) => ({ elements: [...s.elements, ...newEls], selectedId: newEls[newEls.length - 1].id, selectedIds: newEls.map((e) => e.id) }));
              }
            },
            {
              label: "Duplicar", shortcut: "Ctrl+D", fn: () => {
                useEditorStore.getState().duplicateSelected();
              }
            },
            {
              label: "Eliminar", shortcut: "Del", fn: () => {
                useEditorStore.getState().deleteSelected();
              }
            },
            { label: "---", shortcut: "", fn: () => { } },
            {
              label: "Traer al frente", fn: () => {
                const s = useEditorStore.getState();
                s.selectedIds.forEach((id) => s.bringToFront(id));
              }
            },
            {
              label: "Enviar al fondo", fn: () => {
                const s = useEditorStore.getState();
                s.selectedIds.forEach((id) => s.sendToBack(id));
              }
            },
            { label: "---", shortcut: "", fn: () => { } },
            { label: "Copiar estilos", fn: () => useEditorStore.getState().copyStyles() },
            { label: "Pegar estilos", fn: () => useEditorStore.getState().pasteStyles() },
          ].map((item, i) =>
            item.label === "---" ? (
              <div key={i} className="h-px bg-border my-1" />
            ) : (
              <button key={i} onClick={() => ctxAction(item.fn)}
                className="w-full px-3 py-1.5 text-xs text-left border-none bg-transparent text-popover-foreground hover:bg-accent cursor-pointer flex items-center justify-between gap-4">
                <span>{item.label}</span>
                {item.shortcut && <span className="text-[10px] text-muted-foreground">{item.shortcut}</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
