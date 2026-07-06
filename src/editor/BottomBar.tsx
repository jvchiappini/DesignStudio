import { useEditorStore } from "./editorStore";

export function BottomBar() {
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const elements = useEditorStore((s) => s.elements);
  const pages = useEditorStore((s) => s.pages);
  const activePageIndex = useEditorStore((s) => s.activePageIndex);

  return (
    <div className="flex items-center justify-between h-10 px-4 bg-secondary border-t border-border shrink-0">
      <span className="text-xs text-muted-foreground">
        {elements.length} elemento{elements.length !== 1 ? "s" : ""}
      </span>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Página {activePageIndex + 1} de {pages.length}</span>

        <div className="w-px h-4 bg-border" />

        <button onClick={() => setZoom(1)} className="text-[10px] text-muted-foreground hover:text-foreground border-none bg-transparent cursor-pointer px-1" title="Zoom 100%">1:1</button>
        <span className="text-xs text-muted-foreground min-w-[32px] text-right tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
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
