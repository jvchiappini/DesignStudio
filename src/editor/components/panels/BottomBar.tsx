import { useEditorStore } from "../../store/editorStore";
import { Icon } from "../ui/Icons";

export function BottomBar() {
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const elements = useEditorStore((s) => s.elements);
  const pages = useEditorStore((s) => s.pages);
  const activePageIndex = useEditorStore((s) => s.activePageIndex);
  const centerOnElements = useEditorStore((s) => s.centerOnElements);

  return (
    <div className="flex items-center justify-between h-10 px-4 bg-card border-t border-border shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">
          {elements.length} elemento{elements.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">
          Página {activePageIndex + 1} de {pages.length}
        </span>

        <div className="w-px h-4 bg-border" />

        <button onClick={centerOnElements} className="ds-icon-btn w-7 h-7" title="Centrar vista en los elementos">
          <Icon name="home" size={15} />
        </button>

        <button onClick={() => setZoom(1)} className="ds-icon-btn w-7 h-7 text-[10px] font-semibold" title="Zoom 100%">
          1:1
        </button>

        <div className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1">
          <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="ds-icon-btn w-5 h-5" title="Alejar">
            <Icon name="zoom-out" size={12} />
          </button>
          <span className="text-xs text-muted-foreground min-w-[36px] text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(Math.min(5, zoom + 0.1))} className="ds-icon-btn w-5 h-5" title="Acercar">
            <Icon name="zoom-in" size={12} />
          </button>
        </div>

        <input
          type="range"
          min={10}
          max={200}
          value={Math.round(zoom * 100)}
          onChange={(e) => setZoom(Number(e.target.value) / 100)}
          className="w-20 h-1 accent-primary cursor-pointer"
        />
      </div>
    </div>
  );
}
