import type { DesignElement, LayoutConfig } from "../../utils/types";

interface Props {
  el: DesignElement;
  updateElement: (id: string, u: Partial<DesignElement>) => void;
  elements: DesignElement[];
}

export function LayoutEditor({ el, updateElement, elements }: Props) {
  const layout = el.layout;
  const children = elements.filter((e) => e.parentId === el.id);
  const isLayout = !!layout;

  const toggleLayout = () => {
    if (isLayout) {
      // Remove layout, free children
      updateElement(el.id, { layout: undefined });
      elements.filter((e) => e.parentId === el.id).forEach((child) => {
        updateElement(child.id, { parentId: undefined });
      });
    } else {
      updateElement(el.id, {
        layout: { direction: "row", gap: 12, padding: 16, align: "center", justify: "center", wrap: false },
      });
    }
  };

  const updateLayout = (patch: Partial<LayoutConfig>) => {
    if (!layout) return;
    updateElement(el.id, { layout: { ...layout, ...patch } });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground font-medium">Auto Layout</span>
        <button onClick={toggleLayout}
          className={`text-[10px] px-2 py-1 rounded border cursor-pointer leading-none ${
            isLayout ? "bg-accent text-foreground border-primary" : "bg-transparent text-muted-foreground border-border"
          }`}>
          {isLayout ? "Quitar layout" : "Activar layout"}
        </button>
      </div>

      {isLayout && layout && (
        <>
          <div className="flex gap-2">
            <button onClick={() => updateLayout({ direction: "row" })}
              className={`flex-1 h-8 text-[10px] border rounded cursor-pointer ${layout.direction === "row" ? "bg-accent border-primary" : "bg-transparent border-border"}`}>→ Fila</button>
            <button onClick={() => updateLayout({ direction: "column" })}
              className={`flex-1 h-8 text-[10px] border rounded cursor-pointer ${layout.direction === "column" ? "bg-accent border-primary" : "bg-transparent border-border"}`}>↓ Columna</button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">Gap</div>
              <input type="number" value={layout.gap} onChange={(e) => updateLayout({ gap: Math.max(0, +e.target.value) })}
                className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-xs box-border" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">Padding</div>
              <input type="number" value={layout.padding} onChange={(e) => updateLayout({ padding: Math.max(0, +e.target.value) })}
                className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-xs box-border" />
            </div>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Alinear</div>
            <div className="flex gap-1">
              {(["flex-start", "center", "flex-end", "stretch"] as const).map((a) => (
                <button key={a} onClick={() => updateLayout({ align: a })}
                  className={`flex-1 h-7 text-[9px] border rounded cursor-pointer ${layout.align === a ? "bg-accent border-primary" : "bg-transparent border-border"}`}>
                  {a === "flex-start" ? "Inicio" : a === "center" ? "Centro" : a === "flex-end" ? "Fin" : "Estirar"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Justificar</div>
            <div className="flex gap-1 flex-wrap">
              {(["flex-start", "center", "flex-end", "space-between", "space-around"] as const).map((j) => (
                <button key={j} onClick={() => updateLayout({ justify: j })}
                  className={`flex-1 h-7 text-[9px] border rounded cursor-pointer ${layout.justify === j ? "bg-accent border-primary" : "bg-transparent border-border"}`}
                  style={{ minWidth: "30%" }}>
                  {j === "flex-start" ? "Inicio" : j === "center" ? "Centro" : j === "flex-end" ? "Fin" : j === "space-between" ? "← →" : "← → ←"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="layoutWrap" checked={layout.wrap}
              onChange={(e) => updateLayout({ wrap: e.target.checked })}
              className="cursor-pointer accent-primary" />
            <label htmlFor="layoutWrap" className="text-[10px] text-muted-foreground cursor-pointer">Wrap (salto de línea)</label>
          </div>

          {children.length > 0 && (
            <div className="text-[10px] text-muted-foreground">
              {children.length} elemento{children.length !== 1 ? "s" : ""} dentro del layout
            </div>
          )}
        </>
      )}
    </div>
  );
}
