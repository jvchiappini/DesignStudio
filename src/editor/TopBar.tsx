import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "./editorStore";
import { CANVAS_PRESETS } from "./types";
import type { ExportFormat } from "./types";
import { generateJsx } from "./jsxSerializer";
import { parseJsx } from "./jsxParser";

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

  // Install bridge functions on window so ChatPanel can call generateJsx / parseJsx
  // without creating a circular import between TopBar and ChatPanel.
  useEffect(() => {
    (window as any).__ds_generateJsx = generateJsx;
    (window as any).__ds_parseJsx = parseJsx;
    return () => {
      delete (window as any).__ds_generateJsx;
      delete (window as any).__ds_parseJsx;
    };
  }, []);

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
      // llmMode=true: strips base64 image data so the file stays small for LLMs
      const code = generateJsx(state.elements, state.pages, state.pageGap, state, true);
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
          setError({ title: "Failed to parse .jsx file", message: result.error + "\n\nFile: " + file.name });
          return;
        }
        const { elements, pages, pageGap, guides, config } = result.data;

        // Restore base64 image data from current session for LLM-JSX files
        const currentState = useEditorStore.getState();
        for (const el of elements) {
          if (el.type === "image" && el.src && el.src.startsWith("@base64_img_")) {
            const oldEl = currentState.elements.find((e) => e.id === el.id);
            if (oldEl && oldEl.type === "image" && oldEl.src) {
              el.src = oldEl.src;
            } else {
              console.warn(`Could not restore image data for ${el.id}`);
            }
          }
        }

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
      // llmMode=false: save keeps full base64 so the project is complete when reopened
      const code = generateJsx(state.elements, state.pages, state.pageGap, state, false);
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
                className={`flex-1 h-7 rounded border text-xs cursor-pointer ${guideMode === "page"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                  }`}>Por página</button>
              <button onClick={() => setGuideMode("global")}
                className={`flex-1 h-7 rounded border text-xs cursor-pointer ${guideMode === "global"
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
          className={`px-5 py-2 border-none rounded-lg text-sm font-semibold cursor-pointer ${exporting
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
                    className={`flex-1 h-8 rounded border text-xs cursor-pointer font-medium ${exportFormat === fmt
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
                    className={`flex-1 h-8 rounded border text-xs cursor-pointer font-medium ${exportScale === s
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
