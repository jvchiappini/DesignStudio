import { useEditorStore } from "./editorStore";
import { ICONS } from "./icons";

export function IconPicker() {
  const addSvg = useEditorStore((s) => s.addSvg);

  return (
    <div className="p-3 space-y-3">
      <div className="text-xs text-muted-foreground font-medium">Selecciona un icono</div>
      <div className="grid grid-cols-5 gap-2">
        {ICONS.map((icon) => (
          <button key={icon.name} title={icon.name}
            onClick={() => addSvg(icon.svg)}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", JSON.stringify({ type: "icon", data: icon.svg }));
              e.dataTransfer.effectAllowed = "copy";
              const ghost = document.createElement("div");
              ghost.textContent = icon.name;
              ghost.style.cssText = "padding:4px 10px;background:hsl(var(--primary));color:#fff;border-radius:6px;font-size:12px;font-family:sans-serif;position:absolute;top:-9999px;left:0;white-space:nowrap;";
              document.body.appendChild(ghost);
              e.dataTransfer.setDragImage(ghost, 20, 10);
              setTimeout(() => document.body.removeChild(ghost), 0);
            }}
            draggable
            className="w-full aspect-square flex items-center justify-center border border-border rounded-lg bg-transparent hover:bg-accent cursor-pointer transition-colors p-1.5">
            <div className="w-full h-full flex items-center justify-center text-foreground" style={{ color: "currentColor" }}
              dangerouslySetInnerHTML={{ __html: icon.svg }} />
          </button>
        ))}
      </div>
    </div>
  );
}
