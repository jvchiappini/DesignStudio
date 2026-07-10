import { useRef, useCallback, useState, useMemo } from "react";
import { useEditorStore } from "../../store/editorStore";
import type { SidebarTab, ShapeKind, BackgroundLayer } from "../../utils/types";
import { BackgroundLayerEditor } from "../tools/BackgroundLayerEditor";
import { useFontLoader } from "../../../hooks/useFontLoader";
import { IconPicker } from "../tools/IconPicker";
import { QRGenerator } from "../tools/QRGenerator";
import { optimizeImage } from "../../utils/imageOptimizer";
import { Icon } from "../ui/Icons";

const TAB_ICONS: Record<SidebarTab, IconName> = {
  templates: "templates",
  elements: "elements",
  text: "text",
  uploads: "upload",
  background: "background",
  layers: "layers",
  pages: "pages",
  icons: "icons",
  guides: "guides",
};

const TAB_LABELS: Record<SidebarTab, string> = {
  templates: "Plantillas",
  elements: "Elementos",
  text: "Texto",
  uploads: "Subidas",
  background: "Fondo",
  layers: "Capas",
  pages: "Páginas",
  icons: "Iconos",
  guides: "Guías",
};

const ALL_TABS: SidebarTab[] = [
  "templates", "elements", "text", "uploads", "background", "layers", "pages", "icons", "guides",
];

type IconName = import("../ui/Icons").IconName;

function QRBtn() {
  const [show, setShow] = useState(false);
  return (
    <>
      <button onClick={() => setShow(true)}
        className="ds-btn-ghost w-full h-9">
        <Icon name="more" size={14} /> Generar QR
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

  const shapePreviews: Record<ShapeKind, React.ReactNode> = {
    rect: <div className="w-8 h-6 rounded-sm bg-primary" />,
    circle: <div className="w-6 h-6 rounded-full bg-primary" />,
    triangle: <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-primary" />,
    star: (
      <svg width="26" height="26" viewBox="0 0 24 24">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="hsl(var(--primary))" />
      </svg>
    ),
    line: <div className="w-8 h-0.5 rounded bg-primary" />,
  };

  return (
    <>
      {/* Icon bar */}
      <div className="w-[60px] bg-card border-r border-border flex flex-col py-2 gap-0.5 shrink-0">
        {ALL_TABS.map((t) => (
          <button
            key={t}
            className={`flex flex-col items-center gap-1 py-2.5 px-0 border-none text-[10px] cursor-pointer font-medium transition-all duration-150
              ${tab === t
                ? "bg-accent text-primary border-l-[3px] border-primary"
                : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50 border-l-[3px] border-transparent"
              }`}
            onClick={() => setTab(tab === t ? null : t)}
            title={TAB_LABELS[t]}
          >
            <Icon name={TAB_ICONS[t]} size={18} />
            <span>{TAB_LABELS[t].slice(0, 4)}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`flex flex-col items-center gap-1 py-2.5 px-0 border-none text-[10px] cursor-pointer font-medium transition-all duration-150
            ${chatOpen
              ? "bg-accent text-primary border-l-[3px] border-primary"
              : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50 border-l-[3px] border-transparent"
            }`}
          title="Chat IA"
        >
          <Icon name="chat" size={18} />
          <span>Chat</span>
        </button>
      </div>

      {/* Expanded panel */}
      {tab && (
        <div className="w-[270px] bg-card border-r border-border p-4 overflow-y-auto shrink-0">
          {tab === "elements" && (
            <>
              <div className="ds-section-title mb-3">Formas</div>
              <div className="grid grid-cols-2 gap-2">
                {(["rect", "circle", "triangle", "star", "line"] as ShapeKind[]).map((k) => (
                  <button
                    key={k}
                    draggable
                    onClick={() => addShape(k)}
                    onDragStart={(e) => handleDragStart(e, "shape", k)}
                    className="flex flex-col items-center justify-center gap-2 h-[76px] border border-border rounded-xl cursor-pointer bg-transparent text-foreground hover:bg-accent hover:border-primary/30 text-xs transition-all"
                  >
                    {shapePreviews[k]}
                    <span>{k === "rect" ? "Rectángulo" : k.charAt(0).toUpperCase() + k.slice(1)}</span>
                  </button>
                ))}
              </div>

              <div className="ds-section-title mt-6 mb-3">Imagen</div>
              <button onClick={() => imgInputRef.current?.click()} className="ds-btn-ghost w-full h-10">
                <Icon name="image" size={16} /> Subir imagen
              </button>

              <div className="ds-section-title mt-4 mb-3">SVG</div>
              <button onClick={() => svgInputRef.current?.click()} className="ds-btn-ghost w-full h-10">
                <Icon name="svg" size={16} /> Subir SVG
              </button>

              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImgUpload} />
              <input ref={svgInputRef} type="file" accept=".svg,image/svg+xml" className="hidden" onChange={handleSvgUpload} />
            </>
          )}

          {tab === "text" && (
            <>
              <div className="ds-section-title mb-3">Texto</div>
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
                  className="flex items-center gap-2 h-10 w-full px-4 border border-border rounded-xl cursor-pointer bg-transparent text-foreground hover:bg-accent text-xs font-medium mb-2 transition-colors"
                >
                  <Icon name="text" size={16} />
                  {label}
                </button>
              ))}
              <FontUpload />
            </>
          )}

          {tab === "uploads" && (
            <>
              <div className="ds-section-title mb-3">Subidas</div>
              <button onClick={() => imgInputRef.current?.click()} className="ds-btn-ghost w-full h-10 mb-2">
                <Icon name="image" size={16} /> Subir imagen
              </button>
              <button onClick={() => svgInputRef.current?.click()} className="ds-btn-ghost w-full h-10">
                <Icon name="svg" size={16} /> Subir SVG
              </button>
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImgUpload} />
              <input ref={svgInputRef} type="file" accept=".svg,image/svg+xml" className="hidden" onChange={handleSvgUpload} />
            </>
          )}

          {tab === "background" && (
            <>
              <div className="ds-section-title mb-3">Fondo del canvas</div>
              <div className="mb-3">
                <div className="text-[11px] text-muted-foreground mb-2">Color base de página</div>
                <div className="flex items-center gap-2 mb-3">
                  <input type="color" value={canvasBgColor === "transparent" || !canvasBgColor ? "#1a1a2e" : canvasBgColor}
                    onChange={(e) => setCanvasBgColor(e.target.value)}
                    className="w-9 h-9 border-none p-0 cursor-pointer shrink-0 rounded-lg overflow-hidden" />
                  <button onClick={() => setCanvasBgColor("transparent")}
                    className={`h-8 px-2.5 text-[11px] border rounded-lg cursor-pointer leading-none transition-colors ${(!canvasBgColor || canvasBgColor === "transparent")
                      ? "bg-accent text-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:text-foreground"
                      }`}>
                    Transparente
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["#1a1a2e", "#0f0f1a", "#2d2d44", "#ffffff", "#000000", "#6c5ce7", "#e94560", "#10b981", "#f59e0b", "#3b82f6"].map((c) => (
                    <button key={c} onClick={() => setCanvasBgColor(c)}
                      className={`w-7 h-7 rounded-lg cursor-pointer shrink-0 transition-transform hover:scale-110 ${c === "#ffffff" ? "border border-border" : ""}`}
                      style={{ backgroundColor: c, border: canvasBgColor === c ? "2px solid hsl(var(--primary))" : "2px solid transparent" }} />
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <div className="text-[11px] text-muted-foreground mb-2">Capas de fondo adicionales</div>
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
                <div className="ds-section-title">Capas ({sorted.length})</div>
              </div>
              <div className="mb-4">
                <select
                  value={layerFilter}
                  onChange={(e) => setLayerFilter(e.target.value)}
                  className="ds-input py-1.5 cursor-pointer"
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
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Icon name="layers" size={32} className="text-muted-foreground/30 mb-2" />
                  <div className="text-xs text-muted-foreground">Sin elementos</div>
                </div>
              )}
              <div className="space-y-0.5">
                {sorted.map((el, i) => {
                  const isSel = el.id === selectedId;
                  const badgeColor = el.type === "text" ? "#3b82f6" : el.type === "image" ? "#10b981" : el.type === "shape" ? "#f59e0b" : "#8b5cf6";
                  const badgeLetter = el.type === "text" ? "T" : el.type === "image" ? "I" : el.type === "shape" ? "S" : "V";
                  const label =
                    el.type === "text" ? (el.text ?? "texto").slice(0, 22) :
                      el.type === "image" ? "Imagen" :
                        el.type === "shape" ? (el.shapeKind ?? "forma") : "SVG";

                  return (
                    <div key={el.id}
                      onClick={() => selectElement(el.id)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs mb-0.5 group transition-colors
                        ${isSel ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"}
                        ${el.hidden ? "opacity-40" : ""}`}
                    >
                      <button onClick={(e) => { e.stopPropagation(); updateElement(el.id, { hidden: !el.hidden }); }}
                        className="ds-icon-btn w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={el.hidden ? "Mostrar" : "Ocultar"}>
                        <Icon name={el.hidden ? "eye-off" : "eye"} size={12} />
                      </button>
                      <span className="w-[18px] h-[18px] rounded-md flex items-center justify-center text-[9px] text-white font-bold shrink-0"
                        style={{ backgroundColor: badgeColor }}>
                        {badgeLetter}
                      </span>
                      <span className="flex-1 truncate">{label}</span>
                      <button onClick={(e) => { e.stopPropagation(); updateElement(el.id, { locked: !el.locked }); }}
                        className={`ds-icon-btn w-5 h-5 transition-opacity ${el.locked ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}
                        title={el.locked ? "Desbloquear" : "Bloquear"}>
                        <Icon name={el.locked ? "lock" : "unlock"} size={12} />
                      </button>
                      <div className={`flex flex-col shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${i === 0 && i === sorted.length - 1 ? "invisible" : ""}`}>
                        {i > 0 && <button onClick={(e) => { e.stopPropagation(); bringForward(el.id); }} className="ds-icon-btn w-4 h-3"><Icon name="chevron-up" size={10} /></button>}
                        {i < sorted.length - 1 && <button onClick={(e) => { e.stopPropagation(); sendBackward(el.id); }} className="ds-icon-btn w-4 h-3"><Icon name="chevron-down" size={10} /></button>}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                        className="ds-icon-btn w-5 h-5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Icon name="close" size={12} /></button>
                    </div>
                  );
                })}
              </div>
              <FontUpload />
            </>
          )}

          {tab === "icons" && (
            <>
              <IconPicker />
              <div className="mt-3">
                <QRBtn />
              </div>
            </>
          )}

          {tab === "pages" && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="ds-section-title">Páginas</div>
                <button onClick={addPage} className="ds-btn-ghost h-7 px-2 text-[11px]">
                  <Icon name="plus" size={12} /> Añadir
                </button>
              </div>
              <div className="space-y-2">
                {pages.map((page, i) => (
                  <div key={page.id}
                    onClick={() => setActivePage(i)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border transition-all
                      ${i === activePageIndex
                        ? "border-primary bg-accent text-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:bg-accent/50"
                      }`}
                  >
                    <div className="w-10 h-[56px] rounded-lg shrink-0 flex items-center justify-center text-[9px] text-muted-foreground font-mono overflow-hidden border border-border/50"
                      style={{ backgroundColor: page.bgColor === "transparent" || !page.bgColor ? "#1a1a2e" : page.bgColor }}>
                      <span>{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{page.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">{page.width}×{page.height}</div>
                    </div>
                    {pages.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                        className="ds-icon-btn w-6 h-6 text-destructive"><Icon name="close" size={12} /></button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "guides" && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="ds-section-title">Guías</div>
                <button onClick={() => {
                  const pos = Math.round((currentPage?.width ?? 800) / 2);
                  addGuide(pos, "vertical", activePageIndex + 1);
                }} className="ds-btn-ghost h-7 px-2 text-[11px]">
                  <Icon name="plus" size={12} /> Añadir
                </button>
              </div>
              {currentPage && (
                <>
                  {guides.filter((g) => g.pageNumber === activePageIndex + 1).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Icon name="guides" size={32} className="text-muted-foreground/30 mb-2" />
                      <div className="text-xs text-muted-foreground">Sin guías en esta página</div>
                    </div>
                  )}
                  <div className="space-y-1">
                    {guides.filter((g) => g.pageNumber === activePageIndex + 1).map((g) => {
                      const isSelected = g.id === selectedGuideId;
                      return (
                        <div key={g.id}
                          onClick={() => setSelectedGuideId(isSelected ? null : g.id)}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-all
                            ${isSelected
                              ? "bg-accent text-foreground border border-primary"
                              : "text-muted-foreground hover:bg-accent/50 border border-transparent"
                            }`}
                        >
                          <span className="text-sm leading-none shrink-0 text-primary">{g.orientation === "horizontal" ? "━" : "┃"}</span>
                          <span className="flex-1 truncate font-mono text-[10px]">{g.id}</span>
                          <span className="text-muted-foreground tabular-nums">{g.position}px</span>
                          <button onClick={(e) => { e.stopPropagation(); removeGuide(g.id); }}
                            className="ds-icon-btn w-5 h-5 text-destructive"><Icon name="close" size={12} /></button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-[10px] text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border">
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
    <div className="mt-4 border-t border-border pt-4">
      <div className="ds-section-title mb-2">Fuentes personalizadas</div>
      <button onClick={() => inputRef.current?.click()}
        className="ds-btn-ghost w-full h-9 text-[11px]"
        title="Subir TTF, OTF, WOFF o WOFF2">
        <Icon name="font" size={14} /> Subir fuente
      </button>
      <input ref={inputRef} type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden"
        onChange={async (e) => { const f = e.target.files?.[0]; if (f) { await loadCustomFont(f); e.target.value = ""; } }} />
      {fonts.length > 0 && (
        <div className="mt-2 space-y-1">
          {fonts.map((f) => (
            <div key={f.name} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted">
              <span className="text-xs text-muted-foreground truncate">{f.name}</span>
              <button onClick={() => { removeFont(f.name); }}
                className="ds-icon-btn w-5 h-5 text-destructive"><Icon name="close" size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
