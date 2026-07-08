import { useRef, useCallback, useState, useMemo } from "react";
import { useEditorStore } from "../../store/editorStore";
import type { SidebarTab, ShapeKind, BackgroundLayer } from "../../utils/types";
import { BackgroundLayerEditor } from "../tools/BackgroundLayerEditor";
import { useFontLoader } from "../../../hooks/useFontLoader";
import { IconPicker } from "../tools/IconPicker";
import { QRGenerator } from "../tools/QRGenerator";
import { optimizeImage } from "../../utils/imageOptimizer";

const TAB_ICONS: Record<SidebarTab, string> = {
  templates: "◈", elements: "◇", text: "T",
  uploads: "⬆", background: "◉", layers: "≡", pages: "📄", icons: "✦", guides: "⊞",
};

const TAB_LABELS: Record<SidebarTab, string> = {
  templates: "Plantillas", elements: "Elementos", text: "Texto",
  uploads: "Subidas", background: "Fondo", layers: "Capas", pages: "Páginas", icons: "Iconos", guides: "Guías",
};

const ALL_TABS: SidebarTab[] = [
  "templates", "elements", "text", "uploads", "background", "layers", "pages", "icons", "guides",
];

function QRBtn() {
  const [show, setShow] = useState(false);
  return (
    <>
      <button onClick={() => setShow(true)}
        className="w-full py-2 px-3 border border-border rounded-lg bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-xs flex items-center justify-center gap-1.5">
        █ ▄▄▄ █ Generar QR
      </button>
      {show && <QRGenerator onClose={() => setShow(false)} />}
    </>
  );
}

export function LeftSidebar() {
  const tab = useEditorStore((s) => s.sidebarTab);
  const setTab = useEditorStore((s) => s.setSidebarTab);
  const chatOpen = useEditorStore((s) => s.chatOpen);
  const setChatOpen = useEditorStore((s) => s.setChatOpen);
  const addText = useEditorStore((s) => s.addText);
  const addShape = useEditorStore((s) => s.addShape);
  const addImage = useEditorStore((s) => s.addImage);
  const addSvg = useEditorStore((s) => s.addSvg);
  const setCanvasBgColor = useEditorStore((s) => s.setCanvasBgColor);
  const canvasBgColor = useEditorStore((s) => s.canvasBgColor);
  const pages = useEditorStore((s) => s.pages);
  const activePageIndex = useEditorStore((s) => s.activePageIndex);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const addPage = useEditorStore((s) => s.addPage);
  const removePage = useEditorStore((s) => s.removePage);
  const elements = useEditorStore((s) => s.elements);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const removeElement = useEditorStore((s) => s.removeElement);
  const bringForward = useEditorStore((s) => s.bringForward);
  const sendBackward = useEditorStore((s) => s.sendBackward);
  const updateElement = useEditorStore((s) => s.updateElement);
  const updatePage = useEditorStore((s) => s.updatePage);
  const guides = useEditorStore((s) => s.guides);
  const addGuide = useEditorStore((s) => s.addGuide);
  const removeGuide = useEditorStore((s) => s.removeGuide);
  const selectedGuideId = useEditorStore((s) => s.selectedGuideId);
  const setSelectedGuideId = useEditorStore((s) => s.setSelectedGuideId);
  const pageGap = useEditorStore((s) => s.pageGap) ?? 0;
  const currentPage = pages[activePageIndex];

  const [layerFilter, setLayerFilter] = useState<string>("all");

  const pageLefts = useMemo(() => {
    let acc = 0;
    return pages.map((p) => { const st = acc; acc += p.width + pageGap; return st; });
  }, [pages, pageGap]);

  const filteredElements = useMemo(() => {
    if (layerFilter === "all") return elements;
    const pIndex = parseInt(layerFilter.split("_")[1]);
    if (isNaN(pIndex) || !pages[pIndex]) return elements;

    const pageStart = pageLefts[pIndex];
    const pageEnd = pageStart + pages[pIndex].width;

    return elements.filter((el) => el.x < pageEnd && el.x + el.width > pageStart);
  }, [elements, layerFilter, pageLefts, pages]);

  const imgInputRef = useRef<HTMLInputElement>(null);
  const svgInputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (e: React.DragEvent, type: string, data: any) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ type, data }));
    e.dataTransfer.effectAllowed = "copy";
    const ghost = document.createElement("div");
    ghost.textContent = type === "shape" ? (data as string) : "Texto";
    ghost.style.cssText = "padding:6px 14px;background:hsl(var(--primary));color:#fff;border-radius:8px;font-size:13px;font-family:sans-serif;position:absolute;top:-9999px;left:0;white-space:nowrap;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 30, 14);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleImgUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      try {
        const { dataUrl, summary } = await optimizeImage(file);
        console.log(`[Image Optimization] ${summary}`);
        addImage(dataUrl);
      } catch (err) {
        console.error("Error optimizando imagen:", err);
      }
      e.target.value = "";
    }, [addImage],
  );

  const handleSvgUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      const r = new FileReader();
      r.onload = () => { if (typeof r.result === "string") addSvg(r.result); };
      r.readAsText(file); e.target.value = "";
    }, [addSvg],
  );

  const sorted = [...filteredElements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <>
      {/* Icon bar */}
      <div className="w-[60px] bg-card border-r border-border flex flex-col py-2 gap-0.5 shrink-0">
        {ALL_TABS.map((t) => (
          <button
            key={t}
            className={`flex flex-col items-center gap-0.5 py-2 px-0 border-none text-[10px] cursor-pointer font-sans
              ${tab === t
                ? "bg-accent text-foreground border-l-2 border-primary"
                : "bg-transparent text-muted-foreground hover:text-foreground border-l-2 border-transparent"
              }`}
            onClick={() => setTab(tab === t ? null : t)}
            title={TAB_LABELS[t]}
          >
            <span className="text-lg leading-none">{TAB_ICONS[t]}</span>
            <span>{TAB_LABELS[t].slice(0, 4)}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`flex flex-col items-center gap-0.5 py-2 px-0 border-none text-[10px] cursor-pointer font-sans
            ${chatOpen
              ? "bg-accent text-foreground border-l-2 border-primary"
              : "bg-transparent text-muted-foreground hover:text-foreground border-l-2 border-transparent"
            }`}
          title="Chat IA"
        >
          <span className="text-lg leading-none">💬</span>
          <span>Chat</span>
        </button>
      </div>

      {/* Expanded panel */}
      {tab && (
        <div className="w-[260px] bg-card border-r border-border p-4 overflow-y-auto shrink-0">
          {tab === "elements" && (
            <>
              <h3 className="text-sm font-semibold text-foreground mb-4">Formas</h3>
              <div className="grid grid-cols-2 gap-2">
                {(["rect", "circle", "triangle", "star", "line"] as ShapeKind[]).map((k) => (
                  <button
                    key={k}
                    draggable
                    onClick={() => addShape(k)}
                    onDragStart={(e) => handleDragStart(e, "shape", k)}
                    className="flex flex-col items-center justify-center gap-1 h-[72px] border border-border rounded-lg cursor-pointer bg-transparent text-foreground hover:bg-accent text-xs transition-colors"
                  >
                    {k === "rect" && <div className="w-10 h-7 rounded-sm" style={{ backgroundColor: "hsl(var(--primary))" }} />}
                    {k === "circle" && <div className="w-8 h-8 rounded-full" style={{ backgroundColor: "hsl(var(--primary))" }} />}
                    {k === "triangle" && (
                      <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-b-[28px] border-l-transparent border-r-transparent" style={{ borderBottomColor: "hsl(var(--primary))" }} />
                    )}
                    {k === "star" && (
                      <svg width="32" height="32" viewBox="0 0 24 24">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="hsl(var(--primary))" />
                      </svg>
                    )}
                    {k === "line" && <div className="w-10 h-0.5 rounded" style={{ backgroundColor: "hsl(var(--primary))" }} />}
                    <span>{k === "rect" ? "Rectángulo" : k.charAt(0).toUpperCase() + k.slice(1)}</span>
                  </button>
                ))}
              </div>

              <h3 className="text-sm font-semibold text-foreground mt-6 mb-4">Imagen</h3>
              <button onClick={() => imgInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 h-10 w-full border border-border rounded-lg cursor-pointer bg-transparent text-foreground hover:bg-accent text-sm font-medium">
                🖼 Subir imagen
              </button>

              <h3 className="text-sm font-semibold text-foreground mt-4 mb-4">SVG</h3>
              <button onClick={() => svgInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 h-10 w-full border border-border rounded-lg cursor-pointer bg-transparent text-foreground hover:bg-accent text-sm font-medium">
                📐 Subir SVG
              </button>

              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImgUpload} />
              <input ref={svgInputRef} type="file" accept=".svg,image/svg+xml" className="hidden" onChange={handleSvgUpload} />
            </>
          )}

          {tab === "text" && (
            <>
              <h3 className="text-sm font-semibold text-foreground mb-4">Texto</h3>
              {[
                { label: "Añadir título", opts: {} },
                { label: "Añadir subtítulo", opts: { fontSize: 20, text: "Subtítulo", width: 250, height: 40 } },
                { label: "Añadir cuerpo", opts: { fontSize: 14, text: "Cuerpo de texto", width: 200, height: 30 } },
              ].map(({ label, opts }) => (
                <button
                  key={label}
                  draggable
                  onClick={() => addText(opts as any)}
                  onDragStart={(e) => handleDragStart(e, "text", opts)}
                  className="flex items-center gap-2 h-10 w-full px-4 border border-border rounded-lg cursor-pointer bg-transparent text-foreground hover:bg-accent text-sm font-medium mb-2"
                >
                  <span className="text-lg">T</span>
                  {label}
                </button>
              ))}
              <FontUpload />
            </>
          )}

          {tab === "uploads" && (
            <>
              <h3 className="text-sm font-semibold text-foreground mb-4">Subidas</h3>
              <button onClick={() => imgInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 h-10 w-full border border-border rounded-lg cursor-pointer bg-transparent text-foreground hover:bg-accent text-sm font-medium mb-2">
                🖼 Subir imagen
              </button>
              <button onClick={() => svgInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 h-10 w-full border border-border rounded-lg cursor-pointer bg-transparent text-foreground hover:bg-accent text-sm font-medium">
                📐 Subir SVG
              </button>
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImgUpload} />
              <input ref={svgInputRef} type="file" accept=".svg,image/svg+xml" className="hidden" onChange={handleSvgUpload} />
            </>
          )}

          {tab === "background" && (
            <>
              <h3 className="text-sm font-semibold text-foreground mb-4">Fondo del canvas</h3>
              <div className="mb-3">
                <div className="text-[10px] text-muted-foreground mb-1.5">Color base de página</div>
                <div className="flex items-center gap-2 mb-2">
                  <input type="color" value={canvasBgColor === "transparent" || !canvasBgColor ? "#1a1a2e" : canvasBgColor}
                    onChange={(e) => setCanvasBgColor(e.target.value)}
                    className="w-10 h-10 border-none p-0 cursor-pointer shrink-0" />
                  <button onClick={() => setCanvasBgColor("transparent")}
                    className={`h-8 px-2 text-[10px] border rounded cursor-pointer leading-none ${(!canvasBgColor || canvasBgColor === "transparent")
                      ? "bg-accent text-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border"
                      }`}>
                    Transparente
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["#1a1a2e", "#0f0f1a", "#2d2d44", "#ffffff", "#000000", "#6c5ce7", "#e94560", "#10b981", "#f59e0b", "#3b82f6"].map((c) => (
                    <button key={c} onClick={() => setCanvasBgColor(c)}
                      className={`w-8 h-8 rounded-lg cursor-pointer shrink-0 ${c === "#ffffff" ? "border border-border" : ""}`}
                      style={{ backgroundColor: c, border: canvasBgColor === c ? "2px solid hsl(var(--primary))" : "2px solid transparent" }} />
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <div className="text-[10px] text-muted-foreground mb-2">Capas de fondo adicionales</div>
                <BackgroundLayerEditor
                  target={currentPage}
                  setLayers={(layers: BackgroundLayer[]) => {
                    if (currentPage) updatePage(currentPage.id, { bgLayers: layers });
                  }}
                />
              </div>
            </>
          )}

          {tab === "layers" && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Capas ({sorted.length})</h3>
              </div>
              <div className="mb-4">
                <select
                  value={layerFilter}
                  onChange={(e) => setLayerFilter(e.target.value)}
                  className="w-full bg-accent border border-border text-xs text-foreground py-1.5 px-2 rounded cursor-pointer outline-none focus:border-primary"
                >
                  <option value="all">Todas las páginas</option>
                  {pages.map((p, i) => (
                    <option key={p.id} value={`page_${i}`}>
                      {p.name || `Página ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              {sorted.length === 0 && (
                <div className="text-xs text-muted-foreground">Sin elementos</div>
              )}
              {sorted.map((el, i) => {
                const isSel = el.id === selectedId;
                const badgeColor = el.type === "text" ? "#3b82f6" : el.type === "image" ? "#10b981" : el.type === "shape" ? "#f59e0b" : "#8b5cf6";
                const badgeLetter = el.type === "text" ? "T" : el.type === "image" ? "I" : el.type === "shape" ? "S" : "V";
                const label =
                  el.type === "text" ? (el.text ?? "texto").slice(0, 20) :
                    el.type === "image" ? "Imagen" :
                      el.type === "shape" ? (el.shapeKind ?? "forma") : "SVG";

                return (
                  <div key={el.id}
                    onClick={() => selectElement(el.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded cursor-pointer text-xs mb-0.5 group
                      ${isSel ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"}
                      ${el.hidden ? "opacity-40" : ""}`}
                  >
                    {/* Visibility toggle */}
                    <button onClick={(e) => { e.stopPropagation(); updateElement(el.id, { hidden: !el.hidden }); }}
                      className="bg-none border-none text-muted-foreground hover:text-foreground cursor-pointer text-xs p-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={el.hidden ? "Mostrar" : "Ocultar"}>
                      {el.hidden ? "◌" : "◉"}
                    </button>
                    <span className="w-[16px] h-[16px] rounded flex items-center justify-center text-[8px] text-white font-bold shrink-0"
                      style={{ backgroundColor: badgeColor }}>
                      {badgeLetter}
                    </span>
                    <span className="flex-1 truncate">{label}</span>
                    {/* Lock toggle */}
                    <button onClick={(e) => { e.stopPropagation(); updateElement(el.id, { locked: !el.locked }); }}
                      className={`bg-none border-none cursor-pointer text-xs p-0.5 shrink-0 transition-opacity
                        ${el.locked ? "text-muted-foreground opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-50 hover:opacity-100"}`}
                      title={el.locked ? "Desbloquear" : "Bloquear"}>
                      {el.locked ? "🔒" : "🔓"}
                    </button>
                    {/* Move up/down */}
                    <div className="flex flex-col gap-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {i > 0 && <button onClick={(e) => { e.stopPropagation(); bringForward(el.id); }}
                        className="bg-none border-none text-muted-foreground hover:text-foreground cursor-pointer text-[9px] leading-none p-0">▲</button>}
                      {i < sorted.length - 1 && <button onClick={(e) => { e.stopPropagation(); sendBackward(el.id); }}
                        className="bg-none border-none text-muted-foreground hover:text-foreground cursor-pointer text-[9px] leading-none p-0">▼</button>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                      className="bg-none border-none text-destructive hover:text-destructive/80 cursor-pointer text-xs p-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </div>
                );
              })}
              <FontUpload />
            </>
          )}

          {tab === "icons" && (
            <>
              <IconPicker />
              <div className="px-3 mt-2">
                <QRBtn />
              </div>
            </>
          )}

          {tab === "pages" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Páginas</h3>
                <button onClick={addPage}
                  className="flex items-center gap-1 h-7 px-2 border border-border rounded-md bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium">
                  ＋ Añadir
                </button>
              </div>
              <div className="space-y-2">
                {pages.map((page, i) => (
                  <div key={page.id}
                    onClick={() => setActivePage(i)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-colors
                      ${i === activePageIndex
                        ? "border-primary bg-accent text-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:bg-accent/50"
                      }`}
                  >
                    {/* Mini thumbnail */}
                    <div className="w-10 h-[60px] rounded shrink-0 flex items-center justify-center text-[9px] text-muted-foreground font-mono overflow-hidden"
                      style={{ backgroundColor: page.bgColor === "transparent" || !page.bgColor ? "#1a1a2e" : page.bgColor }}>
                      <span>{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{page.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{page.width}×{page.height}</div>
                    </div>
                    {pages.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                        className="text-destructive hover:text-destructive/80 text-xs border-none bg-transparent cursor-pointer p-1">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "guides" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Guías</h3>
                <button onClick={() => {
                  const pos = Math.round((currentPage?.width ?? 800) / 2);
                  addGuide(pos, "vertical", activePageIndex + 1);
                }}
                  className="flex items-center gap-1 h-7 px-2 border border-border rounded-md bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium">
                  ＋ Añadir
                </button>
              </div>
              {currentPage && (
                <>
                  {guides.filter((g) => g.pageNumber === activePageIndex + 1).length === 0 && (
                    <div className="text-xs text-muted-foreground">Sin guías en esta página</div>
                  )}
                  <div className="space-y-1">
                    {guides.filter((g) => g.pageNumber === activePageIndex + 1).map((g) => {
                      const isSelected = g.id === selectedGuideId;
                      return (
                        <div key={g.id}
                          onClick={() => setSelectedGuideId(isSelected ? null : g.id)}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded cursor-pointer text-xs transition-colors
                            ${isSelected
                              ? "bg-accent text-foreground border border-primary"
                              : "text-muted-foreground hover:bg-accent/50 border border-transparent"
                            }`}
                        >
                          <span className="text-sm leading-none shrink-0">{g.orientation === "horizontal" ? "━" : "┃"}</span>
                          <span className="flex-1 truncate font-mono">{g.id}</span>
                          <span className="text-muted-foreground">{g.position}px</span>
                          <button onClick={(e) => { e.stopPropagation(); removeGuide(g.id); }}
                            className="text-destructive hover:text-destructive/80 text-xs border-none bg-transparent cursor-pointer p-0.5 shrink-0">✕</button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-[10px] text-muted-foreground leading-relaxed">
                    También puedes crear guías arrastrando desde las reglas, o usar <code className="text-xs text-primary">&lt;guide&gt;</code> en JSX.
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

function FontUpload() {
  const { loadCustomFont, getFonts, removeFont } = useFontLoader();
  const inputRef = useRef<HTMLInputElement>(null);
  const fonts = getFonts();

  return (
    <div className="mt-4">
      <div className="text-xs text-muted-foreground mb-2">Fuentes personalizadas</div>
      <button onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 h-9 w-full px-3 border border-border rounded-lg bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-xs"
        title="Subir TTF, OTF, WOFF o WOFF2">
        📁 Subir fuente
      </button>
      <input ref={inputRef} type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden"
        onChange={async (e) => { const f = e.target.files?.[0]; if (f) { await loadCustomFont(f); e.target.value = ""; } }} />
      {fonts.length > 0 && (
        <div className="mt-2 space-y-1">
          {fonts.map((f) => (
            <div key={f.name} className="flex items-center justify-between px-2 py-1 rounded bg-muted">
              <span className="text-xs text-muted-foreground truncate">{f.name}</span>
              <button onClick={() => { removeFont(f.name); }}
                className="text-destructive hover:text-destructive/80 text-xs border-none bg-transparent cursor-pointer ml-1">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
