import { useState, useRef, useCallback, useEffect } from "react";
import { useEditorStore } from "../../store/editorStore";
import { applyCrop } from "../../utils/cropUtils";
import { BezierPathEditor } from "../tools/BezierPathEditor";

type Corner = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";

const HANDLE_SIZE = 10;

const corners: { key: Corner; cx: number; cy: number; cursor: string }[] = [
  { key: "nw", cx: 0, cy: 0, cursor: "nw-resize" },
  { key: "n", cx: 0.5, cy: 0, cursor: "n-resize" },
  { key: "ne", cx: 1, cy: 0, cursor: "ne-resize" },
  { key: "w", cx: 0, cy: 0.5, cursor: "w-resize" },
  { key: "e", cx: 1, cy: 0.5, cursor: "e-resize" },
  { key: "sw", cx: 0, cy: 1, cursor: "sw-resize" },
  { key: "s", cx: 0.5, cy: 1, cursor: "s-resize" },
  { key: "se", cx: 1, cy: 1, cursor: "se-resize" },
];

const CLIP_PRESETS: { label: string; path: string }[] = [
  { label: "Circulo", path: "circle(50%)" },
  { label: "Ovalo", path: "ellipse(25% 50%)" },
  { label: "Rombo", path: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
  { label: "Hexagono", path: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" },
  { label: "Triangulo", path: "polygon(50% 0%, 100% 100%, 0% 100%)" },
  { label: "Estrella", path: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" },
];

type ClipEditMode = "text" | "visual";

import type { DesignElement } from "../../utils/types";

export function CropOverlay() {
  const cropElementId = useEditorStore((s) => s.cropElementId);
  const elements = useEditorStore((s) => s.elements);
  const updateElement = useEditorStore((s) => s.updateElement);
  const setCropElementId = useEditorStore((s) => s.setCropElementId);

  const el = elements.find((e) => e.id === cropElementId);
  if (!el || (el.type !== "image" && !el.clipMask && !cropElementId)) return null;

  const isImage = el.type === "image";

  const initialCrop = {
    x: el.cropX ?? 0,
    y: el.cropY ?? 0,
    w: el.cropW ?? el.width,
    h: el.cropH ?? el.height,
  };

  return (
    <CropOverlayInner
      el={el}
      initialCrop={initialCrop}
      isImage={isImage}
      updateElement={updateElement}
      setCropElementId={setCropElementId}
    />
  );
}

function CropOverlayInner({
  el, initialCrop, isImage, updateElement, setCropElementId,
}: {
  el: DesignElement;
  initialCrop: { x: number; y: number; w: number; h: number };
  isImage: boolean;
  updateElement: (id: string, u: any) => void;
  setCropElementId: (id: string | null) => void;
}) {
  const [crop, setCrop] = useState(initialCrop);
  const [showClip, setShowClip] = useState(!!el.clipMask);
  const [clipMode, setClipMode] = useState<ClipEditMode>("text");
  const [clipValue, setClipValue] = useState(el.clipMask ? `${el.clipMask.type}(${el.clipMask.value})` : "");
  const [visualPath, setVisualPath] = useState(el.clipMask?.type === "path" ? el.clipMask.value : "");

  // When visual path changes, keep clipValue in sync for saving
  useEffect(() => {
    if (clipMode === "visual" && visualPath) {
      setClipValue(`path('${visualPath}')`);
    }
  }, [visualPath, clipMode]);

  const dragRef = useRef<{
    type: "move" | "resize";
    corner?: Corner;
    startX: number; startY: number;
    origCrop: { x: number; y: number; w: number; h: number };
  } | null>(null);

  const clamp = useCallback((c: { x: number; y: number; w: number; h: number }) => ({
    x: Math.max(0, Math.min(c.x, el.width - c.w)),
    y: Math.max(0, Math.min(c.y, el.height - c.h)),
    w: Math.max(20, Math.min(c.w, el.width - c.x)),
    h: Math.max(20, Math.min(c.h, el.height - c.y)),
  }), [el.width, el.height]);

  const handlePointerDown = useCallback((e: React.PointerEvent, type: "move" | "resize", corner?: Corner) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { type, corner, startX: e.clientX, startY: e.clientY, origCrop: { ...crop } };
    const handler = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = (ev.clientX - dragRef.current.startX);
      const dy = (ev.clientY - dragRef.current.startY);
      const orig = dragRef.current.origCrop;
      if (dragRef.current.type === "move") {
        setCrop(clamp({ x: orig.x + dx, y: orig.y + dy, w: orig.w, h: orig.h }));
      } else if (dragRef.current.corner) {
        const c = dragRef.current.corner;
        let { x, y, w, h } = orig;
        if (c.includes("e")) { w = orig.w + dx; }
        if (c.includes("w")) { w = orig.w - dx; x = orig.x + dx; }
        if (c.includes("s")) { h = orig.h + dy; }
        if (c.includes("n")) { h = orig.h - dy; y = orig.y + dy; }
        setCrop(clamp({ x, y, w, h }));
      }
    };
    const upHandler = () => {
      dragRef.current = null;
      document.removeEventListener("pointermove", handler);
      document.removeEventListener("pointerup", upHandler);
    };
    document.addEventListener("pointermove", handler);
    document.addEventListener("pointerup", upHandler);
  }, [crop, clamp]);

  const handleApply = useCallback(async () => {
    if (showClip) {
      // Save using clipValue (which includes visualPath if in visual mode)
      const trimmed = clipValue.trim();
      if (trimmed) {
        const typeMatch = trimmed.match(/^(\w+)\((.+)\)$/s);
        if (typeMatch) {
          const ct = typeMatch[1] as "circle" | "ellipse" | "polygon" | "inset" | "path";
          const cv = typeMatch[2];
          updateElement(el.id, { clipMask: { type: ct, value: cv } });
        } else {
          updateElement(el.id, { clipMask: { type: "path", value: trimmed } });
        }
      } else {
        updateElement(el.id, { clipMask: undefined });
      }
      setCropElementId(null);
      return;
    }
    if (isImage) {
      const clamped = clamp(crop);
      updateElement(el.id, { cropX: clamped.x, cropY: clamped.y, cropW: clamped.w, cropH: clamped.h });
      const newSrc = await applyCrop({ ...el, cropX: clamped.x, cropY: clamped.y, cropW: clamped.w, cropH: clamped.h } as any);
      if (newSrc) {
        updateElement(el.id, { src: newSrc, width: clamped.w, height: clamped.h, cropX: undefined, cropY: undefined, cropW: undefined, cropH: undefined });
      }
    }
    setCropElementId(null);
  }, [showClip, clipValue, isImage, crop, el, updateElement, setCropElementId, clamp]);

  const handleCancel = useCallback(() => {
    setCropElementId(null);
  }, [setCropElementId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleApply();
      if (e.key === "Escape") handleCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleApply, handleCancel]);

  return (
    <>
      {/* Full-canvas backdrop */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.5)",
        pointerEvents: "auto",
      }} />

      {/* Toolbar */}
      <div style={{
        position: "absolute", left: el.x, top: el.y - 36, zIndex: 102,
        display: "flex", gap: 4, pointerEvents: "auto",
      }}>
        <button onClick={() => { setShowClip(false); setClipValue(""); }}
          className={`px-2 py-1 text-[10px] border rounded cursor-pointer leading-none ${
            !showClip ? "bg-accent text-foreground border-primary" : "bg-transparent text-muted-foreground border-border"
          }`}>
          Recorte
        </button>
        <button onClick={() => setShowClip(true)}
          className={`px-2 py-1 text-[10px] border rounded cursor-pointer leading-none ${
            showClip ? "bg-accent text-foreground border-primary" : "bg-transparent text-muted-foreground border-border"
          }`}>
          Clip / Path
        </button>
      </div>

      {!showClip && (
        <div style={{
          position: "absolute",
          left: el.x + crop.x,
          top: el.y + crop.y,
          width: crop.w,
          height: crop.h,
          zIndex: 101,
          border: "2px solid #fff",
          outline: "9999px solid rgba(0,0,0,0.5)",
          cursor: "move",
          pointerEvents: "auto",
        }} onPointerDown={(e) => handlePointerDown(e, "move")}>
          {corners.map(({ key, cx, cy, cursor }) => (
            <div key={key}
              onPointerDown={(e) => handlePointerDown(e, "resize", key)}
              style={{
                position: "absolute",
                left: `calc(${cx * 100}% - ${HANDLE_SIZE / 2}px)`,
                top: `calc(${cy * 100}% - ${HANDLE_SIZE / 2}px)`,
                width: HANDLE_SIZE, height: HANDLE_SIZE,
                background: "#fff", border: "2px solid #6c5ce7",
                borderRadius: 1, cursor, zIndex: 102,
              }} />
          ))}
        </div>
      )}

      {showClip && (
        <>
          {/* Sub-toolbar for clip mode */}
          <div style={{
            position: "absolute",
            left: el.x,
            top: el.y + el.height + 4,
            width: Math.min(el.width, 360),
            zIndex: 102,
            display: "flex", gap: 4,
            pointerEvents: "auto",
          }}>
            <button onClick={() => setClipMode("text")}
              className={`px-2 py-0.5 text-[9px] border rounded cursor-pointer ${
                clipMode === "text" ? "bg-accent border-primary" : "bg-transparent border-border text-muted-foreground"
              }`}>
              Texto
            </button>
            <button onClick={() => setClipMode("visual")}
              className={`px-2 py-0.5 text-[9px] border rounded cursor-pointer ${
                clipMode === "visual" ? "bg-accent border-primary" : "bg-transparent border-border text-muted-foreground"
              }`}>
              Visual (Bezier)
            </button>

            {/* Presets (only in text mode) */}
            {clipMode === "text" && (
              <div className="flex gap-1 flex-wrap">
                {CLIP_PRESETS.map((p) => (
                  <button key={p.label} onClick={() => setClipValue(p.path)}
                    className={`px-1.5 py-0.5 text-[9px] border rounded cursor-pointer ${
                      clipValue === p.path ? "bg-accent border-primary" : "bg-transparent border-border text-muted-foreground"
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {clipMode === "visual" && (
            <div style={{
              position: "absolute",
              left: el.x, top: el.y,
              width: el.width, height: el.height,
              zIndex: 101,
              pointerEvents: "auto",
            }}>
              <BezierPathEditor
                width={el.width}
                height={el.height}
                initialPath={visualPath}
                onPathChange={setVisualPath}
              />
            </div>
          )}

          {clipMode === "text" && (
            <div style={{
              position: "absolute",
              left: el.x,
              top: el.y + el.height + 32,
              width: Math.min(el.width, 360),
              zIndex: 102,
              pointerEvents: "auto",
            }}>
              <div className="text-[10px] text-muted-foreground mb-0.5">Valor CSS clip-path</div>
              <input value={clipValue} onChange={(e) => setClipValue(e.target.value)}
                placeholder="circle(50%)"
                className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-[10px] font-mono box-border" />
              <div className="text-[9px] text-muted-foreground mt-1">
                Ej: circle(50%), polygon(...), path('M...')
              </div>
            </div>
          )}
        </>
      )}

      {/* Action buttons */}
      <div style={{
        position: "absolute",
        left: el.x + (showClip && clipMode === "text" ? 0 : showClip ? el.width / 2 - 60 : crop.x + crop.w / 2 - 60),
        top: el.y + (showClip
          ? el.height + (clipMode === "text" ? 90 : 60)
          : crop.y + crop.h + 12),
        zIndex: 102,
        display: "flex", gap: 8,
        pointerEvents: "auto",
      }}>
        <button onClick={(e) => { e.stopPropagation(); handleApply(); }}
          className="px-3 py-1.5 text-xs border-none rounded bg-primary text-primary-foreground cursor-pointer font-medium leading-none">
          Aplicar
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleCancel(); }}
          className="px-3 py-1.5 text-xs border-none rounded bg-muted text-muted-foreground cursor-pointer leading-none">
          Cancelar
        </button>
      </div>
    </>
  );
}
