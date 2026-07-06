import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "./editorStore";
import { CANVAS_PRESETS } from "./types";
import type { ExportFormat, DesignElement, Page } from "./types";
import { layersToBackground, hasActiveLayers } from "./backgroundUtils";

interface Props {
  onExport: (format: ExportFormat, pages?: number | number[], scale?: number) => void;
  exporting: boolean;
  progress: number;
}

interface ErrorInfo {
  title: string;
  message: string;
}

const iconBtn =
  "w-8 h-8 flex items-center justify-center border-none rounded-md bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer text-base shrink-0";

const divider = "w-px h-6 bg-border";

function pageOffset(pages: Page[], index: number, gap: number): number {
  let off = 0;
  for (let i = 0; i < index; i++) off += pages[i].width + gap;
  return off;
}

function generateJsx(elements: DesignElement[], pages: Page[], pageGap: number, store: {
  showGrid: boolean; snapToGrid: boolean; showRulers: boolean; guideMode: string; gridSize: number; zoom: number; guides: GuideData[];
}): string {
  const q = (v: unknown) => (v === undefined || v === null ? undefined : `"${String(v).replace(/"/g, "&quot;")}"`);
  const attr = (k: string, v?: unknown) =>
    v !== undefined && v !== null ? ` ${k}=${q(v)}` : "";

  let out = "<project>\n";

  out += `  <config${attr("pageGap", pageGap)}${attr("showGrid", store.showGrid || undefined)}${attr("snapToGrid", store.snapToGrid || undefined)}${attr("showRulers", store.showRulers || undefined)}${attr("guideMode", store.guideMode !== "page" ? store.guideMode : undefined)}${attr("gridSize", store.gridSize !== 20 ? store.gridSize : undefined)}${attr("zoom", store.zoom !== 0.5 ? Math.round(store.zoom * 100) : undefined)}>\n`;
  for (const g of store.guides) {
    out += `    <guide${attr("position", g.position)}${attr("orientation", g.orientation)}${attr("pageId", g.pageId)} />\n`;
  }
  out += "  </config>\n";

  for (let pi = 0; pi < pages.length; pi++) {
    const pg = pages[pi];
    const startX = pageOffset(pages, pi, pageGap);
    const endX = startX + pg.width;

    const pageBgStyle = hasActiveLayers(pg.bgLayers) ? layersToBackground(pg.bgLayers) : null;
    out += `  <page width="${pg.width}" height="${pg.height}" bgColor="${pg.bgColor}"${attr("bgStyle", pageBgStyle)}>\n`;

    const pageEls = elements.filter((el) => el.x >= startX && el.x < endX);

    for (const el of pageEls) {
      const rx = el.x - startX;
      const pos = attr("x", rx) + attr("y", el.y) + attr("w", el.width) + attr("h", el.height);
      const elBgStyle = hasActiveLayers(el.bgLayers) ? layersToBackground(el.bgLayers) : null;

      if (el.type === "text") {
        const txt = (el.text ?? "").replace(/"/g, "&quot;");
        out += `    <text${pos}${attr("fontSize", el.fontSize)}${attr("fontFamily", el.fontFamily)}${attr("fontWeight", el.fontWeight !== 400 ? el.fontWeight : undefined)}${attr("fontStyle", el.fontStyle !== "normal" ? el.fontStyle : undefined)}${attr("color", el.color)}${attr("textAlign", el.textAlign)}${attr("opacity", el.opacity !== 1 ? el.opacity : undefined)}${attr("rotation", el.rotation || undefined)}${attr("bgStyle", elBgStyle)}>${txt}</text>\n`;
      } else if (el.type === "image") {
        out += `    <image${pos}${attr("src", el.src)}${attr("bgStyle", elBgStyle)} />\n`;
      } else {
        out += `    <figure${pos}${attr("bgColor", el.backgroundColor)}${attr("borderRadius", el.borderRadius)}${attr("type", el.shapeKind)}${attr("bgStyle", elBgStyle)} />\n`;
      }
    }

    out += "  </page>\n";
  }

  out += "</project>\n";
  return out;
}

interface GuideData {
  id: string; position: number; orientation: "horizontal" | "vertical"; pageId?: string;
}

interface ParsedProject {
  elements: DesignElement[];
  pages: Page[];
  pageGap: number;
  guides: GuideData[];
  config: Record<string, string>;
}

function parseJsx(xml: string):
  | { ok: true; data: ParsedProject }
  | { ok: false; error: string }
{
  try {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const errEl = doc.querySelector("parsererror");
    if (errEl) return { ok: false, error: `XML parse error: ${errEl.textContent}` };

    const root = doc.documentElement;
    if (!root) return { ok: false, error: "Empty document" };
    if (root.tagName !== "project") return { ok: false, error: "Root tag must be <project>, got <" + root.tagName + ">" };

    const configEl = root.querySelector(":scope > config");
    const config: Record<string, string> = {};
    const guides: GuideData[] = [];
    if (configEl) {
      for (const { name, value } of Array.from(configEl.attributes)) {
        config[name] = value;
      }
      for (const guideEl of configEl.querySelectorAll(":scope > guide")) {
        const pos = parseFloat(guideEl.getAttribute("position") || "0");
        const orient = guideEl.getAttribute("orientation") as "horizontal" | "vertical";
        const pid = guideEl.getAttribute("pageId") || undefined;
        if (orient) {
          guides.push({ id: `guide_${guides.length + 1}`, position: pos, orientation: orient, pageId: pid });
        }
      }
    }

    const pageNodes = root.querySelectorAll(":scope > page");
    if (pageNodes.length === 0) return { ok: false, error: 'No <page> elements found inside <project>' };

    const pages: Page[] = [];
    const elements: DesignElement[] = [];
    const pageGap = parseInt(config.pageGap || "0", 10);

    for (let pi = 0; pi < pageNodes.length; pi++) {
      const pg = pageNodes[pi];
      const w = parseInt(pg.getAttribute("width") || "1080", 10);
      const h = parseInt(pg.getAttribute("height") || "1920", 10);
      const bg = pg.getAttribute("bgColor") || "#1a1a2e";

      pages.push({ id: `page_${pi + 1}`, name: `Page ${pi + 1}`, width: w, height: h, bgColor: bg });

      const startX = pageOffset(pages, pi, pageGap);
      const children = pg.querySelectorAll(":scope > text, :scope > image, :scope > figure");

      for (const el of children) {
        const tag = el.tagName.toLowerCase();
        const rx = parseFloat(el.getAttribute("x") || "0");
        const ry = parseFloat(el.getAttribute("y") || "0");
        const rw = parseFloat(el.getAttribute("w") || "100");
        const rh = parseFloat(el.getAttribute("h") || "100");

        const base = {
          x: rx + startX,
          y: ry,
          width: rw,
          height: rh,
          rotation: parseFloat(el.getAttribute("rotation") || "0"),
          opacity: parseFloat(el.getAttribute("opacity") || "1"),
          zIndex: elements.length + 1,
        };

        if (tag === "text") {
          elements.push({
            ...base,
            id: `el_${elements.length + 1}`,
            type: "text",
            text: el.textContent || "Texto",
            fontSize: parseInt(el.getAttribute("fontSize") || "32", 10),
            fontFamily: el.getAttribute("fontFamily") || "system-ui, sans-serif",
            fontWeight: parseInt(el.getAttribute("fontWeight") || "400", 10),
            fontStyle: (el.getAttribute("fontStyle") as "normal" | "italic") || "normal",
            color: el.getAttribute("color") || "#ffffff",
            textAlign: (el.getAttribute("textAlign") as "left" | "center" | "right") || "left",
          });
        } else if (tag === "image") {
          elements.push({
            ...base,
            id: `el_${elements.length + 1}`,
            type: "image",
            src: el.getAttribute("src") || "",
          });
        } else if (tag === "figure") {
          elements.push({
            ...base,
            id: `el_${elements.length + 1}`,
            type: "shape",
            shapeKind: (el.getAttribute("type") as any) || "rect",
            backgroundColor: el.getAttribute("bgColor") || "#4f46e5",
            borderColor: "transparent",
            borderWidth: 0,
            borderRadius: parseFloat(el.getAttribute("borderRadius") || "0"),
          });
        }
      }
    }

    return { ok: true, data: { elements, pages, pageGap, guides, config } };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

function ErrorModal({ error, onClose }: { error: ErrorInfo; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onPointerDown={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-2xl" onPointerDown={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-destructive mb-2">{error.title}</h2>
        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted p-3 rounded-lg max-h-60 overflow-auto">{error.message}</pre>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">OK</button>
      </div>
    </div>
  );
}

export function TopBar({ onExport, exporting, progress }: Props) {
  const zoom = useEditorStore((s) => s.zoom);
  const zoomIn = useEditorStore((s) => s.zoomIn);
  const zoomOut = useEditorStore((s) => s.zoomOut);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const historyIndex = useEditorStore((s) => s.historyIndex);
  const history = useEditorStore((s) => s.history);
  const alignElements = useEditorStore((s) => s.alignElements);
  const distributeElements = useEditorStore((s) => s.distributeElements);
  const groupSelected = useEditorStore((s) => s.groupSelected);
  const ungroupSelected = useEditorStore((s) => s.ungroupSelected);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const pages = useEditorStore((s) => s.pages);
  const activePageIndex = useEditorStore((s) => s.activePageIndex);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const addPage = useEditorStore((s) => s.addPage);
  const showGrid = useEditorStore((s) => s.showGrid);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const showRulers = useEditorStore((s) => s.showRulers);
  const pageGap = useEditorStore((s) => s.pageGap);
  const guideMode = useEditorStore((s) => s.guideMode);
  const setShowGrid = useEditorStore((s) => s.setShowGrid);
  const setSnapToGrid = useEditorStore((s) => s.setSnapToGrid);
  const setShowRulers = useEditorStore((s) => s.setShowRulers);
  const setPageGap = useEditorStore((s) => s.setPageGap);
  const setGuideMode = useEditorStore((s) => s.setGuideMode);
  const projectName = useEditorStore((s) => s.projectName);
  const setProjectName = useEditorStore((s) => s.setProjectName);
  const loadProject = useEditorStore((s) => s.loadProject);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showGapConfig, setShowGapConfig] = useState(false);
  const [showRulerConfig, setShowRulerConfig] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [customW, setCustomW] = useState(String(canvasWidth));
  const [customH, setCustomH] = useState(String(canvasHeight));
  const [error, setError] = useState<ErrorInfo | null>(null);

  const exportRef = useRef<HTMLDivElement>(null);
  const presetsRef = useRef<HTMLDivElement>(null);
  const gapRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const openFileRef = useRef<HTMLInputElement>(null);
  const exportDialogRef = useRef<HTMLDivElement>(null);

  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [exportScale, setExportScale] = useState(2);
  const [exportPages, setExportPages] = useState("all");

  useEffect(() => {
    if (!showExportMenu && !showExportDialog && !showPresets && !showGapConfig && !showRulerConfig) return;
    const handler = (e: MouseEvent) => {
      if (showExportMenu && exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
      if (showExportDialog && exportDialogRef.current && !exportDialogRef.current.contains(e.target as Node)) setShowExportDialog(false);
      if (showPresets && presetsRef.current && !presetsRef.current.contains(e.target as Node)) setShowPresets(false);
      if (showGapConfig && gapRef.current && !gapRef.current.contains(e.target as Node)) setShowGapConfig(false);
      if (showRulerConfig && rulerRef.current && !rulerRef.current.contains(e.target as Node)) setShowRulerConfig(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showExportMenu, showExportDialog, showPresets, showGapConfig, showRulerConfig]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const handleExportJsx = () => {
    try {
      const state = useEditorStore.getState();
      const code = generateJsx(state.elements, state.pages, state.pageGap, state);
      const blob = new Blob([code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportMenu(false);
    } catch (e: any) {
      setError({ title: "Export JSX failed", message: e?.message || String(e) });
    }
  };

  const handleOpenFile = () => {
    openFileRef.current?.click();
  };

  const handleFileLoaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError({ title: "Read file failed", message: "FileReader returned non-string result" });
        return;
      }
      const content = reader.result;
      const name = file.name.toLowerCase();

      // Try JSON first (.designstudio legacy format or .json)
      if (name.endsWith(".json") || name.endsWith(".designstudio")) {
        try {
          const parsed = JSON.parse(content);
          if (!parsed.elements || !parsed.pages) {
            setError({ title: "Invalid .designstudio file", message: "JSON must contain 'elements' and 'pages' arrays" });
            return;
          }
          loadProject(content);
          return;
        } catch (e: any) {
          setError({ title: "Failed to parse JSON", message: e?.message || String(e) });
          return;
        }
      }

      // .jsx format
      if (name.endsWith(".jsx")) {
        const result = parseJsx(content);
        if (!result.ok) {
          setError({ title: "Failed to parse .jsx file", message: result.error + "\n\nFile: " + file.name});
          return;
        }
        const { elements, pages, pageGap, guides, config } = result.data;
        const first = pages[0];
        const patch: Record<string, any> = {
          projectName: file.name.replace(/\.jsx$/i, ""),
          elements,
          pages,
          pageGap,
          guides,
          activePageIndex: 0,
          selectedId: null,
          selectedIds: [],
          history: [],
          historyIndex: -1,
          canvasWidth: first.width,
          canvasHeight: first.height,
          canvasBgColor: first.bgColor,
        };
        if (config.showGrid !== undefined) patch.showGrid = config.showGrid === "true";
        if (config.snapToGrid !== undefined) patch.snapToGrid = config.snapToGrid === "true";
        if (config.showRulers !== undefined) patch.showRulers = config.showRulers === "true";
        if (config.guideMode) patch.guideMode = config.guideMode;
        if (config.gridSize) patch.gridSize = parseInt(config.gridSize, 10);
        if (config.zoom) patch.zoom = parseInt(config.zoom, 10) / 100;
        useEditorStore.setState(patch);
        return;
      }

      setError({ title: "Unsupported file format", message: "Supported formats:\n  - .jsx  (Design Studio project)\n  - .designstudio / .json  (legacy JSON format)" });
    };
    reader.onerror = () => {
      setError({ title: "File read error", message: reader.error?.message || "Unknown error reading file" });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const parsePageSelection = (input: string, totalPages: number): number[] | null => {
    const s = input.trim().toLowerCase();
    if (!s || s === "all") return Array.from({ length: totalPages }, (_, i) => i);

    const excluded = new Set<number>();
    const included = new Set<number>();
    const parts = s.split(",");

    for (const part of parts) {
      const trimmed = part.trim();
      const exclude = trimmed.startsWith("!");
      const val = exclude ? trimmed.slice(1).trim() : trimmed;
      const rangeMatch = val.match(/^(\d+)\s*-\s*(\d+)$/);
      if (rangeMatch) {
        const lo = Math.max(0, parseInt(rangeMatch[1], 10) - 1);
        const hi = Math.min(totalPages - 1, parseInt(rangeMatch[2], 10) - 1);
        for (let i = lo; i <= hi; i++) {
          if (exclude) excluded.add(i); else included.add(i);
        }
      } else {
        const pi = parseInt(val, 10) - 1;
        if (!isNaN(pi) && pi >= 0 && pi < totalPages) {
          if (exclude) excluded.add(pi); else included.add(pi);
        }
      }
    }

    if (excluded.size > 0) {
      return Array.from({ length: totalPages }, (_, i) => i).filter((i) => !excluded.has(i));
    }
    if (included.size > 0) return Array.from(included).sort((a, b) => a - b);
    return null;
  };

  const handleExportWithConfig = () => {
    const store = useEditorStore.getState();
    const indices = parsePageSelection(exportPages, store.pages.length);
    if (!indices || indices.length === 0) {
      setError({ title: "Export: no pages selected", message: "No pages match your selection. Examples: all, 1-5, 1,3,7, !7" });
      return;
    }
    onExport(exportFormat, indices, exportScale);
    setShowExportDialog(false);
  };

  const handleSave = () => {
    try {
      const state = useEditorStore.getState();
      const code = generateJsx(state.elements, state.pages, state.pageGap, state);
      const blob = new Blob([code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${state.projectName.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError({ title: "Save failed", message: e?.message || String(e) });
    }
  };

  const startEditingName = () => {
    setNameInput(projectName);
    setEditingName(true);
  };

  const finishEditingName = () => {
    setEditingName(false);
    const trimmed = nameInput.trim();
    if (trimmed) setProjectName(trimmed);
  };

  return (
    <div className="flex items-center h-14 px-4 bg-card border-b border-border shrink-0 gap-3">
      {error && <ErrorModal error={error} onClose={() => setError(null)} />}

      <div className="font-bold text-base text-primary flex items-center gap-2 shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="currentColor" />
          <path d="M7 17V7l10 5-10 5z" fill="#fff" />
        </svg>
        Design Studio
      </div>

      <div className={divider} />

      {/* Project name + Open/Save */}
      <div className="flex items-center gap-1">
        {editingName ? (
          <input ref={nameInputRef}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={finishEditingName}
            onKeyDown={(e) => { if (e.key === "Enter") finishEditingName(); if (e.key === "Escape") setEditingName(false); }}
            className="h-7 px-2 rounded border border-border bg-background text-foreground text-sm font-medium outline-none w-[160px]"
          />
        ) : (
          <span className="text-sm text-muted-foreground font-medium truncate max-w-[160px] cursor-pointer hover:text-foreground"
            onClick={startEditingName} title="Haz clic para renombrar">
            {projectName}
          </span>
        )}
        <button className="w-6 h-6 flex items-center justify-center border-none rounded bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-xs shrink-0"
          onClick={handleSave} title="Guardar proyecto como .jsx">💾</button>
        <button className="w-6 h-6 flex items-center justify-center border-none rounded bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-xs shrink-0"
          onClick={handleOpenFile} title="Abrir proyecto .jsx / .designstudio">📂</button>
        <input ref={openFileRef} type="file" accept=".jsx,.designstudio,.json" className="hidden" onChange={handleFileLoaded} />
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        <button className={iconBtn} onClick={() => setActivePage(activePageIndex - 1)}
          disabled={activePageIndex <= 0} title="Página anterior">◀</button>
        <span className="text-xs text-muted-foreground font-medium min-w-[60px] text-center select-none">
          {activePageIndex + 1} / {pages.length}
        </span>
        <button className={iconBtn} onClick={() => setActivePage(activePageIndex + 1)}
          disabled={activePageIndex >= pages.length - 1} title="Página siguiente">▶</button>
        <button className={iconBtn} onClick={addPage} title="Añadir página">＋</button>
      </div>

      <div className={divider} />

      <div className="flex-1" />

      {/* Undo/Redo */}
      <button
        className={`${iconBtn} ${historyIndex < 0 ? "opacity-30 pointer-events-none" : ""}`}
        onClick={undo} disabled={historyIndex < 0} title="Deshacer (Ctrl+Z)">
        ↶
      </button>
      <button
        className={`${iconBtn} ${historyIndex >= history.length - 1 ? "opacity-30 pointer-events-none" : ""}`}
        onClick={redo} disabled={historyIndex >= history.length - 1} title="Rehacer (Ctrl+Shift+Z)">
        ↷
      </button>

      <div className={divider} />

      {/* Align */}
      {selectedIds.length >= 2 && (
        <>
          <button className={iconBtn} onClick={() => alignElements("left")} title="Alinear izquierda">⊣</button>
          <button className={iconBtn} onClick={() => alignElements("center")} title="Alinear centro">⊦</button>
          <button className={iconBtn} onClick={() => alignElements("right")} title="Alinear derecha">⊢</button>
          <button className={iconBtn} onClick={() => alignElements("top")} title="Alinear arriba">⊤</button>
          <button className={iconBtn} onClick={() => alignElements("middle")} title="Alinear medio">⊥</button>
          <button className={iconBtn} onClick={() => alignElements("bottom")} title="Alinear abajo">⊣</button>
        </>
      )}

      {/* Distribute */}
      {selectedIds.length >= 3 && (
        <>
          <button className={iconBtn} onClick={() => distributeElements("horizontal")} title="Distribuir horizontal">⇔</button>
          <button className={iconBtn} onClick={() => distributeElements("vertical")} title="Distribuir vertical">⇕</button>
          <div className={divider} />
        </>
      )}

      {/* Group */}
      {selectedIds.length >= 2 && (
        <>
          <button className={iconBtn} onClick={groupSelected} title="Agrupar (Ctrl+G)">⊞</button>
          <button className={iconBtn} onClick={ungroupSelected} title="Desagrupar (Ctrl+Shift+G)">⊟</button>
          <div className={divider} />
        </>
      )}

      {/* Zoom */}
      <button className={iconBtn} onClick={zoomOut} title="Alejar">−</button>
      <span className="text-sm text-muted-foreground font-medium min-w-[44px] text-center">
        {Math.round(zoom * 100)}%
      </span>
      <button className={iconBtn} onClick={zoomIn} title="Acercar">+</button>

      <div className={divider} />

      {/* Toggles */}
      <button className={`${iconBtn} ${showGrid ? "text-primary bg-primary/10" : ""}`}
        onClick={() => setShowGrid(!showGrid)} title="Mostrar rejilla">
        ▦
      </button>
      <div ref={rulerRef} className="relative">
        <button className={`${iconBtn} ${showRulers || showRulerConfig ? "text-primary bg-primary/10" : ""}`}
          onClick={() => setShowRulerConfig(!showRulerConfig)} title="Reglas y guías">
          ┴
        </button>
        {showRulerConfig && (
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg p-3 z-[60] min-w-[180px] shadow-lg"
            onClick={(e) => e.stopPropagation()}>
            <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
              <input type="checkbox" checked={showRulers}
                onChange={() => setShowRulers(!showRulers)}
                className="accent-primary" />
              <span className="text-xs text-muted-foreground">Mostrar reglas</span>
            </label>
            <div className="text-[11px] text-muted-foreground mb-1.5 font-medium">Modo de guías</div>
            <div className="flex gap-2">
              <button onClick={() => setGuideMode("page")}
                className={`flex-1 h-7 rounded border text-xs cursor-pointer ${
                  guideMode === "page"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                }`}>Por página</button>
              <button onClick={() => setGuideMode("global")}
                className={`flex-1 h-7 rounded border text-xs cursor-pointer ${
                  guideMode === "global"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                }`}>Global</button>
            </div>
          </div>
        )}
      </div>
      <button className={`${iconBtn} ${snapToGrid ? "text-primary bg-primary/10" : ""}`}
        onClick={() => setSnapToGrid(!snapToGrid)} title="Snap a rejilla">
        ⬡
      </button>
      <div ref={gapRef} className="relative">
        <button className={`${iconBtn} ${pageGap > 0 || showGapConfig ? "text-primary bg-primary/10" : ""}`}
          onClick={() => setShowGapConfig(!showGapConfig)} title="Separación entre páginas">
          ⊞
        </button>
        {showGapConfig && (
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg p-3 z-[60] min-w-[180px] shadow-lg"
            onClick={(e) => e.stopPropagation()}>
            <div className="text-[11px] text-muted-foreground mb-1.5 font-medium">Separación entre páginas</div>
            <input type="number" min={0} max={200} value={pageGap}
              onChange={(e) => setPageGap(Math.max(0, Math.min(200, Number(e.target.value) || 0)))}
              className="w-full h-7 px-2 rounded border border-border bg-background text-foreground text-xs outline-none" />
          </div>
        )}
      </div>

      <div className={divider} />

      {/* Size presets */}
      <div ref={presetsRef} className="relative">
        <button
          className="h-8 px-2 rounded-md border-none bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium shrink-0"
          onClick={() => setShowPresets(!showPresets)}
          title="Tamaños predefinidos"
        >
          {canvasWidth}×{canvasHeight}
        </button>
        {showPresets && (
          <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-lg p-1.5 z-[60] min-w-[220px] shadow-lg">
            <div className="text-[10px] text-muted-foreground px-2 py-1 font-semibold uppercase tracking-wider">Predefinidos</div>
            {CANVAS_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setCanvasSize(p.w, p.h); setShowPresets(false); setCustomW(String(p.w)); setCustomH(String(p.h)); }}
                className="block w-full px-3 py-1.5 rounded border-none bg-transparent text-popover-foreground hover:bg-accent cursor-pointer text-xs text-left"
              >
                <span className="text-muted-foreground">{p.label}</span>{" "}
                {p.w}×{p.h}
              </button>
            ))}
            <div className="h-px bg-border my-1" />
            <div className="text-[10px] text-muted-foreground px-2 py-1 font-semibold uppercase tracking-wider">Personalizado</div>
            <div className="flex items-center gap-2 px-2 py-1">
              <input type="number" min={50} max={9999} value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                className="w-16 h-7 px-1.5 rounded border border-border bg-background text-foreground text-xs outline-none text-center" />
              <span className="text-xs text-muted-foreground">×</span>
              <input type="number" min={50} max={9999} value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                className="w-16 h-7 px-1.5 rounded border border-border bg-background text-foreground text-xs outline-none text-center" />
              <button onClick={() => {
                const w = parseInt(customW, 10);
                const h = parseInt(customH, 10);
                if (w >= 50 && h >= 50) { setCanvasSize(w, h); setShowPresets(false); }
              }}
                className="h-7 px-2 rounded border border-primary bg-primary/10 text-primary text-xs cursor-pointer font-medium">OK</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete */}
      {selectedIds.length > 0 && (
        <button
          onClick={deleteSelected}
          className="h-8 px-2 flex items-center border-none rounded-md bg-transparent text-destructive hover:bg-destructive/10 cursor-pointer text-sm"
          title="Eliminar (Delete)"
        >
          🗑
        </button>
      )}

      {/* Export */}
      <div ref={exportRef} className="relative">
        <button
          className={`px-5 py-2 border-none rounded-lg text-sm font-semibold cursor-pointer ${
            exporting
              ? "bg-muted text-muted-foreground opacity-70"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
          onClick={() => { if (!exporting) setShowExportDialog(true); }}
          disabled={exporting}
        >
          {exporting ? `Exportando ${progress}%` : "Exportar"}
        </button>
        <button onClick={handleExportJsx}
          className="ml-1 h-8 px-2 border border-border rounded-md bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-xs shrink-0"
          title="Exportar como .JSX (LLM)">{"</>"}</button>
      </div>

      {/* Export dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div ref={exportDialogRef} className="bg-card border border-border rounded-xl p-5 w-[340px] shadow-2xl space-y-4"
            onPointerDown={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-foreground">Exportar diseño</h2>

            <div>
              <div className="text-[11px] text-muted-foreground font-medium mb-1.5">Formato</div>
              <div className="flex gap-2">
                {(["png", "jpg", "webp"] as ExportFormat[]).map((fmt) => (
                  <button key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`flex-1 h-8 rounded border text-xs cursor-pointer font-medium ${
                      exportFormat === fmt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                    }`}>
                    .{fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-muted-foreground font-medium mb-1.5">Escala</div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((s) => (
                  <button key={s}
                    onClick={() => setExportScale(s)}
                    className={`flex-1 h-8 rounded border text-xs cursor-pointer font-medium ${
                      exportScale === s
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                    }`}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-muted-foreground font-medium mb-1.5">Páginas</div>
              <input value={exportPages}
                onChange={(e) => setExportPages(e.target.value)}
                placeholder='all, 1-5, 1,3,7, !7'
                className="w-full h-8 px-2.5 rounded border border-border bg-background text-foreground text-xs outline-none placeholder:text-muted-foreground/50"
              />
              <div className="text-[10px] text-muted-foreground/60 mt-1">
                all · 1-5 · 1,3,7 · !7 (todas menos la 7)
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowExportDialog(false)}
                className="flex-1 h-9 rounded-lg border border-border bg-transparent text-foreground text-xs font-medium cursor-pointer hover:bg-accent">
                Cancelar
              </button>
              <button onClick={handleExportWithConfig}
                className="flex-1 h-9 rounded-lg border-none bg-primary text-primary-foreground text-xs font-semibold cursor-pointer hover:bg-primary/90">
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
