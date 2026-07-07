import { useState, useMemo } from "react";
import type { BackgroundLayer } from "../../utils/types";
import { createDefaultLayer, layerToCss } from "../../utils/backgroundUtils";

type BgTarget = { bgLayers?: BackgroundLayer[] };
type Setter = (layers: BackgroundLayer[]) => void;

function useLayers(target: BgTarget | undefined | null, setLayers: Setter) {
  const layers = target?.bgLayers ?? [];
  const update = (fn: (draft: BackgroundLayer[]) => BackgroundLayer[]) => setLayers(fn(layers));
  return { layers, update } as const;
}

export function BackgroundLayerEditor({ target, setLayers }: {
  target: BgTarget | undefined | null;
  setLayers: Setter;
}) {
  const { layers, update } = useLayers(target, setLayers);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const addLayer = (type: BackgroundLayer["type"]) => {
    update((prev) => [...prev, createDefaultLayer(type)]);
    setExpandedIdx(layers.length);
  };

  const moveLayer = (from: number, to: number) => {
    if (to < 0 || to >= layers.length) return;
    update((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  };

  const removeLayer = (idx: number) => {
    update((prev) => prev.filter((_, i) => i !== idx));
    if (expandedIdx === idx) setExpandedIdx(null);
    else if (expandedIdx != null && expandedIdx > idx) setExpandedIdx(expandedIdx - 1);
  };

  const toggleLayer = (idx: number) => {
    update((prev) => prev.map((l, i) => i === idx ? { ...l, enabled: !l.enabled } : l));
  };

  const updateLayer = (idx: number, partial: Partial<BackgroundLayer>) => {
    update((prev) => prev.map((l, i) => i === idx ? { ...l, ...partial } : l));
  };

  return (
    <div>
      {/* Add layer buttons */}
      <div className="flex gap-1 mb-3">
        {(["color", "gradient", "image", "pattern"] as const).map((t) => (
          <button key={t} onClick={() => addLayer(t)}
            className="flex-1 h-7 text-[10px] border border-border rounded bg-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30 cursor-pointer leading-none">
            {t === "color" ? "🎨 Color" : t === "gradient" ? "🌈 Degr." : t === "image" ? "🖼 Img" : "🔲 Patrón"}
          </button>
        ))}
      </div>

      {/* Layer list */}
      {layers.length === 0 && (
        <div className="text-[10px] text-muted-foreground text-center py-4">
          Sin capas de fondo. Añade una capa arriba.
        </div>
      )}

      <div className="space-y-1 mb-3">
        {layers.map((layer, i) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            index={i}
            total={layers.length}
            isExpanded={expandedIdx === i}
            onToggle={() => toggleLayer(i)}
            onExpand={() => setExpandedIdx(expandedIdx === i ? null : i)}
            onRemove={() => removeLayer(i)}
            onMoveUp={() => moveLayer(i, i - 1)}
            onMoveDown={() => moveLayer(i, i + 1)}
            onUpdate={(p) => updateLayer(i, p)}
          />
        ))}
      </div>
    </div>
  );
}

function LayerItem({ layer, index, total, isExpanded, onToggle, onExpand, onRemove, onMoveUp, onMoveDown, onUpdate }: {
  layer: BackgroundLayer;
  index: number;
  total: number;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (p: Partial<BackgroundLayer>) => void;
}) {
  const typeIcons: Record<string, string> = { color: "🎨", gradient: "🌈", image: "🖼", pattern: "🔲" };
  const previewBg = useMemo(() => layerToCss(layer), [layer]);

  return (
    <div className={`border border-border rounded overflow-hidden ${!layer.enabled ? "opacity-40" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted/30">
        <button onClick={onToggle}
          className="text-xs border-none bg-transparent cursor-pointer text-muted-foreground hover:text-foreground leading-none p-0.5">
          {layer.enabled ? "◉" : "◌"}
        </button>
        <div className="w-6 h-5 rounded border border-border shrink-0" style={{ background: previewBg || "#888" }} />
        <span className="text-[11px] text-foreground font-medium flex-1 truncate">
          {typeIcons[layer.type]} {layer.type === "color" ? "Color" : layer.type === "gradient" ? "Degradado" : layer.type === "image" ? "Imagen" : "Patrón"}
        </span>
        <div className="flex gap-0.5">
          <button onClick={onMoveUp} disabled={index === 0}
            className="text-xs border-none bg-transparent cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none p-0.5">▲</button>
          <button onClick={onMoveDown} disabled={index === total - 1}
            className="text-xs border-none bg-transparent cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none p-0.5">▼</button>
        </div>
        <button onClick={onExpand}
          className="text-xs border-none bg-transparent cursor-pointer text-muted-foreground hover:text-foreground leading-none p-0.5">✎</button>
        <button onClick={onRemove}
          className="text-xs border-none bg-transparent cursor-pointer text-destructive hover:text-destructive/80 leading-none p-0.5">✕</button>
      </div>

      {/* Expanded editor */}
      {isExpanded && (
        <div className="px-2 py-2 space-y-2 bg-background">
          {layer.type === "color" && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">Color</div>
              <input type="color" value={layer.color ?? "#4f46e5"}
                className="w-full h-8 border-none p-0 cursor-pointer"
                onChange={(e) => onUpdate({ color: e.target.value })} />
            </div>
          )}

          {layer.type === "gradient" && (
            <>
              <div>
                <div className="text-[10px] text-muted-foreground mb-0.5">Tipo</div>
                <div className="flex gap-1">
                  {(["linear", "radial", "conic"] as const).map((k) => (
                    <button key={k} onClick={() => onUpdate({ gradientKind: k })}
                      className={`flex-1 h-7 text-[10px] border rounded cursor-pointer leading-none
                        ${(layer.gradientKind ?? "linear") === k ? "bg-accent text-foreground border-primary" : "bg-transparent text-muted-foreground border-border"}`}>
                      {k === "linear" ? "Lineal" : k === "radial" ? "Radial" : "Cónico"}
                    </button>
                  ))}
                </div>
              </div>
              {layer.gradientKind !== "radial" && layer.gradientKind !== "conic" && (
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Ángulo: {layer.gradientAngle ?? 135}°</div>
                  <input type="range" value={layer.gradientAngle ?? 135} min={0} max={360}
                    className="w-full h-1.5 appearance-none bg-muted rounded-full cursor-pointer accent-primary"
                    onChange={(e) => onUpdate({ gradientAngle: Number(e.target.value) })} />
                </div>
              )}
              {(layer.gradientKind === "radial" || layer.gradientKind === "conic") && (
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Posición</div>
                  <select value={layer.gradientPosition ?? "center"}
                    className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-[10px] font-sans"
                    onChange={(e) => onUpdate({ gradientPosition: e.target.value })}>
                    <option value="center">Centro</option>
                    <option value="top left">Arriba izq.</option>
                    <option value="top right">Arriba der.</option>
                    <option value="bottom left">Abajo izq.</option>
                    <option value="bottom right">Abajo der.</option>
                  </select>
                </div>
              )}
              <GradientStopsEditor stops={layer.gradientStops ?? []} onChange={(stops) => onUpdate({ gradientStops: stops })} />
              {layer.gradientKind === "conic" && (
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Ángulo inicio: {layer.gradientAngle ?? 0}°</div>
                  <input type="range" value={layer.gradientAngle ?? 0} min={0} max={360}
                    className="w-full h-1.5 appearance-none bg-muted rounded-full cursor-pointer accent-primary"
                    onChange={(e) => onUpdate({ gradientAngle: Number(e.target.value) })} />
                </div>
              )}
            </>
          )}

          {layer.type === "image" && (
            <>
              <div>
                <div className="text-[10px] text-muted-foreground mb-0.5">URL de imagen</div>
                <input type="text" value={layer.src ?? ""}
                  placeholder="https://..."
                  className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-[10px] font-sans box-border"
                  onChange={(e) => onUpdate({ src: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Tamaño</div>
                  <select value={layer.imageSize ?? "cover"}
                    className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-[10px] font-sans"
                    onChange={(e) => onUpdate({ imageSize: e.target.value })}>
                    <option value="cover">Cubrir</option>
                    <option value="contain">Contener</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Posición</div>
                  <select value={layer.imagePosition ?? "center"}
                    className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-[10px] font-sans"
                    onChange={(e) => onUpdate({ imagePosition: e.target.value })}>
                    <option value="center">Centro</option>
                    <option value="top">Arriba</option>
                    <option value="bottom">Abajo</option>
                    <option value="left">Izquierda</option>
                    <option value="right">Derecha</option>
                    <option value="top left">Arriba izq</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Repetir</div>
                  <select value={layer.imageRepeat ?? "no-repeat"}
                    className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-[10px] font-sans"
                    onChange={(e) => onUpdate({ imageRepeat: e.target.value })}>
                    <option value="no-repeat">No repetir</option>
                    <option value="repeat">Repetir</option>
                    <option value="repeat-x">Rep. X</option>
                    <option value="repeat-y">Rep. Y</option>
                  </select>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Adjuntar</div>
                  <select value={layer.imageAttachment ?? "scroll"}
                    className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-[10px] font-sans"
                    onChange={(e) => onUpdate({ imageAttachment: e.target.value })}>
                    <option value="scroll">Scroll</option>
                    <option value="fixed">Fijo</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {layer.type === "pattern" && (
            <>
              <div>
                <div className="text-[10px] text-muted-foreground mb-0.5">Patrón</div>
                <div className="flex gap-1 flex-wrap">
                  {(["checkerboard", "dots", "stripes", "grid", "crosshatch"] as const).map((k) => (
                    <button key={k} onClick={() => onUpdate({ patternKind: k })}
                      className={`flex-1 h-7 text-[10px] border rounded cursor-pointer leading-none px-1
                        ${(layer.patternKind ?? "checkerboard") === k ? "bg-accent text-foreground border-primary" : "bg-transparent text-muted-foreground border-border"}`}>
                      {k === "checkerboard" ? "Ajedrez" : k === "dots" ? "Puntos" : k === "stripes" ? "Rayas" : k === "grid" ? "Cuadrícula" : "Trama"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Color 1</div>
                  <input type="color" value={layer.patternColor1 ?? "#ffffff"}
                    className="w-full h-8 border-none p-0 cursor-pointer"
                    onChange={(e) => onUpdate({ patternColor1: e.target.value })} />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Color 2</div>
                  <input type="color" value={layer.patternColor2 ?? "#000000"}
                    className="w-full h-8 border-none p-0 cursor-pointer"
                    onChange={(e) => onUpdate({ patternColor2: e.target.value })} />
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-0.5">Tamaño: {layer.patternSize ?? 20}px</div>
                <input type="range" value={layer.patternSize ?? 20} min={4} max={100}
                  className="w-full h-1.5 appearance-none bg-muted rounded-full cursor-pointer accent-primary"
                  onChange={(e) => onUpdate({ patternSize: Number(e.target.value) })} />
              </div>
            </>
          )}

          {/* Common settings */}
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Opacidad: {Math.round((layer.opacity ?? 1) * 100)}%</div>
            <input type="range" value={layer.opacity ?? 1} min={0} max={1} step={0.05}
              className="w-full h-1.5 appearance-none bg-muted rounded-full cursor-pointer accent-primary"
              onChange={(e) => onUpdate({ opacity: Number(e.target.value) })} />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Modo fusión</div>
            <select value={layer.blendMode ?? "normal"}
              className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-[10px] font-sans"
              onChange={(e) => onUpdate({ blendMode: e.target.value === "normal" ? undefined : e.target.value })}>
              {[
                ["normal", "Normal"], ["multiply", "Multiplicar"], ["screen", "Pantalla"],
                ["overlay", "Superponer"], ["darken", "Oscurecer"], ["lighten", "Aclarar"],
                ["color-dodge", "Subexponer"], ["color-burn", "Sobreexponer"],
              ].map(([v, lbl]) => (
                <option key={v} value={v}>{lbl}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function GradientStopsEditor({ stops, onChange }: {
  stops: Array<{ color: string; position: number }>;
  onChange: (stops: Array<{ color: string; position: number }>) => void;
}) {
  const updateStop = (i: number, partial: Partial<{ color: string; position: number }>) => {
    const copy = stops.map((s, idx) => idx === i ? { ...s, ...partial } : s);
    onChange(copy);
  };
  const addStop = () => {
    if (stops.length >= 6) return;
    const lastPos = stops[stops.length - 1]?.position ?? 100;
    onChange([...stops, { color: "#888888", position: Math.min(100, lastPos + 20) }]);
  };
  const removeStop = (i: number) => {
    if (stops.length <= 2) return;
    onChange(stops.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-muted-foreground">Paradas de color</span>
        {stops.length < 6 && (
          <button onClick={addStop}
            className="text-[10px] border-none bg-transparent cursor-pointer text-primary hover:text-primary/80 leading-none">+ Añadir</button>
        )}
      </div>
      <div className="flex items-center gap-1.5" style={{ height: 28, borderRadius: 4, background: toGradientPreview(stops), border: "1px solid var(--border)" }}>
        {stops.map((s, i) => (
          <div key={i} className="relative flex-1 flex items-center justify-center" style={{ minWidth: 20 }}>
            <input type="color" value={s.color}
              className="w-5 h-5 border border-white rounded-sm p-0 cursor-pointer"
              onChange={(e) => updateStop(i, { color: e.target.value })} />
            <span className="text-[8px] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] absolute -bottom-3.5">{s.position}%</span>
            {stops.length > 2 && (
              <button onClick={() => removeStop(i)}
                className="absolute -top-2 -right-1 text-[8px] border-none bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center cursor-pointer leading-none p-0">✕</button>
            )}
          </div>
        ))}
      </div>
      {/* Position sliders */}
      {stops.map((s, i) => (
        <div key={i} className="flex items-center gap-1 mt-1">
          <span className="text-[9px] text-muted-foreground w-3">{i + 1}</span>
          <input type="range" value={s.position} min={0} max={100}
            className="flex-1 h-1 appearance-none bg-muted rounded-full cursor-pointer accent-primary"
            onChange={(e) => updateStop(i, { position: Number(e.target.value) })} />
        </div>
      ))}
    </div>
  );
}

function toGradientPreview(stops: Array<{ color: string; position: number }>): string {
  const s = stops.map((s) => `${s.color} ${s.position}%`).join(", ");
  return `linear-gradient(90deg, ${s})`;
}
