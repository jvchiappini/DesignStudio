import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "../../store/editorStore";
import { CANVAS_PRESETS } from "../../utils/types";
import type { ExportFormat } from "../../utils/types";
import { generateJsx } from "../../utils/jsxSerializer";
import { parseJsx } from "../../utils/jsxParser";
import { loadJsxIntoStore } from "../../ai/jsxApplicator";
import { Icon } from "../ui/Icons";

interface Props {
  onExport: (format: ExportFormat, pages?: number | number[], scale?: number) => void;
  exporting: boolean;
  progress: number;
}

interface ErrorInfo {
  title: string;
  message: string;
}

const divider = "w-px h-5 bg-border";

function ErrorModal({ error, onClose }: { error: ErrorInfo; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onPointerDown={onClose}>
      <div className="bg-card border border-border rounded-xl p-5 max-w-lg w-full shadow-2xl" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <Icon name="close" size={14} />
          </div>
          <h2 className="text-sm font-semibold text-destructive">{error.title}</h2>
        </div>
        <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted p-3 rounded-lg max-h-60 overflow-auto border border-border">{error.message}</pre>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">OK</button>
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
  const newProject = useEditorStore((s) => s.newProject);

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

  const handleOpenFile = () => openFileRef.current?.click();

  const handleFileLoaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== "string") {
        setError({ title: "Read file failed", message: "FileReader returned non-string result" });
        return;
      }
      const content = reader.result;
      const name = file.name.toLowerCase();

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

      if (name.endsWith(".jsx")) {
        const applyResult = await loadJsxIntoStore(content, {
          preserveHistory: false,
          preservePageIds: false,
          alwaysReplaceGuides: true,
          projectName: file.name.replace(/\.jsx$/i, ""),
        });
        if (!applyResult.ok) {
          setError({ title: "Failed to parse .jsx file", message: (applyResult.error ?? "") + "\n\nFile: " + file.name });
        }
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
    <div className="flex items-center h-14 px-3 bg-card border-b border-border shrink-0 gap-2">
      {error && <ErrorModal error={error} onClose={() => setError(null)} />}

      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0 pl-1">
        <Icon name="logo" size={24} className="text-primary" />
        <span className="font-bold text-sm text-foreground tracking-tight">Design Studio</span>
      </div>

      <div className={divider} />

      {/* Project name + Open/Save */}
      <div className="flex items-center gap-1">
        {editingName ? (
          <input
            ref={nameInputRef}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={finishEditingName}
            onKeyDown={(e) => { if (e.key === "Enter") finishEditingName(); if (e.key === "Escape") setEditingName(false); }}
            className="ds-input h-7 w-[160px]"
          />
        ) : (
          <span
            className="text-xs text-muted-foreground font-medium truncate max-w-[140px] cursor-pointer hover:text-foreground transition-colors px-1.5 py-1 rounded hover:bg-accent"
            onClick={startEditingName}
            title="Haz clic para renombrar"
          >
            {projectName}
          </span>
        )}
        <button className="ds-icon-btn w-7 h-7" onClick={newProject} title="Nuevo proyecto">
          <Icon name="new" size={16} />
        </button>
        <button className="ds-icon-btn w-7 h-7" onClick={handleSave} title="Guardar proyecto">
          <Icon name="save" size={16} />
        </button>
        <button className="ds-icon-btn w-7 h-7" onClick={handleOpenFile} title="Abrir proyecto">
          <Icon name="open" size={16} />
        </button>
        <input ref={openFileRef} type="file" accept=".jsx,.designstudio,.json" className="hidden" onChange={handleFileLoaded} />
      </div>

      <div className={divider} />

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        <button className="ds-icon-btn" onClick={() => setActivePage(activePageIndex - 1)} disabled={activePageIndex <= 0} title="Página anterior">
          <Icon name="chevron-left" size={16} />
        </button>
        <span className="text-xs text-muted-foreground font-medium min-w-[56px] text-center select-none">
          {activePageIndex + 1} / {pages.length}
        </span>
        <button className="ds-icon-btn" onClick={() => setActivePage(activePageIndex + 1)} disabled={activePageIndex >= pages.length - 1} title="Página siguiente">
          <Icon name="chevron-right" size={16} />
        </button>
        <button className="ds-icon-btn" onClick={addPage} title="Añadir página">
          <Icon name="plus" size={16} />
        </button>
      </div>

      <div className={divider} />

      <div className="flex-1" />

      {/* Undo/Redo */}
      <button
        className={`ds-icon-btn ${historyIndex < 0 ? "opacity-40 cursor-not-allowed" : ""}`}
        onClick={undo} disabled={historyIndex < 0} title="Deshacer (Ctrl+Z)"
      >
        <Icon name="undo" size={16} />
      </button>
      <button
        className={`ds-icon-btn ${historyIndex >= history.length - 1 ? "opacity-40 cursor-not-allowed" : ""}`}
        onClick={redo} disabled={historyIndex >= history.length - 1} title="Rehacer (Ctrl+Shift+Z)"
      >
        <Icon name="redo" size={16} />
      </button>

      <div className={divider} />

      {/* Align */}
      {selectedIds.length >= 2 && (
        <>
          <button className="ds-icon-btn" onClick={() => alignElements("left")} title="Alinear izquierda"><Icon name="align-left" size={16} /></button>
          <button className="ds-icon-btn" onClick={() => alignElements("center")} title="Alinear centro"><Icon name="align-center" size={16} /></button>
          <button className="ds-icon-btn" onClick={() => alignElements("right")} title="Alinear derecha"><Icon name="align-right" size={16} /></button>
          <button className="ds-icon-btn" onClick={() => alignElements("top")} title="Alinear arriba"><Icon name="align-top" size={16} /></button>
          <button className="ds-icon-btn" onClick={() => alignElements("middle")} title="Alinear medio"><Icon name="align-middle" size={16} /></button>
          <button className="ds-icon-btn" onClick={() => alignElements("bottom")} title="Alinear abajo"><Icon name="align-bottom" size={16} /></button>
        </>
      )}

      {/* Distribute */}
      {selectedIds.length >= 3 && (
        <>
          <button className="ds-icon-btn" onClick={() => distributeElements("horizontal")} title="Distribuir horizontal"><Icon name="distribute-h" size={16} /></button>
          <button className="ds-icon-btn" onClick={() => distributeElements("vertical")} title="Distribuir vertical"><Icon name="distribute-v" size={16} /></button>
          <div className={divider} />
        </>
      )}

      {/* Group */}
      {selectedIds.length >= 2 && (
        <>
          <button className="ds-icon-btn" onClick={groupSelected} title="Agrupar"><Icon name="group" size={16} /></button>
          <button className="ds-icon-btn" onClick={ungroupSelected} title="Desagrupar"><Icon name="ungroup" size={16} /></button>
          <div className={divider} />
        </>
      )}

      {/* Zoom */}
      <button className="ds-icon-btn" onClick={zoomOut} title="Alejar"><Icon name="zoom-out" size={16} /></button>
      <span className="text-xs text-muted-foreground font-medium min-w-[44px] text-center tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      <button className="ds-icon-btn" onClick={zoomIn} title="Acercar"><Icon name="zoom-in" size={16} /></button>

      <div className={divider} />

      {/* Toggles */}
      <button className={`ds-icon-btn ${showGrid ? "active" : ""}`} onClick={() => setShowGrid(!showGrid)} title="Mostrar rejilla">
        <Icon name="grid" size={16} />
      </button>
      <div ref={rulerRef} className="relative">
        <button className={`ds-icon-btn ${showRulers || showRulerConfig ? "active" : ""}`} onClick={() => setShowRulerConfig(!showRulerConfig)} title="Reglas y guías">
          <Icon name="ruler" size={16} />
        </button>
        {showRulerConfig && (
          <div className="absolute top-full right-0 mt-2 bg-popover border border-border rounded-xl p-3 z-[60] min-w-[190px] shadow-lg"
            onClick={(e) => e.stopPropagation()}>
            <label className="flex items-center gap-2.5 mb-3 cursor-pointer select-none">
              <input type="checkbox" checked={showRulers} onChange={() => setShowRulers(!showRulers)} className="accent-primary w-4 h-4" />
              <span className="text-xs text-muted-foreground">Mostrar reglas</span>
            </label>
            <div className="text-[11px] text-muted-foreground mb-1.5 font-medium">Modo de guías</div>
            <div className="flex gap-2">
              <button onClick={() => setGuideMode("page")}
                className={`flex-1 h-7 rounded-lg border text-xs cursor-pointer transition-colors ${guideMode === "page"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}>Por página</button>
              <button onClick={() => setGuideMode("global")}
                className={`flex-1 h-7 rounded-lg border text-xs cursor-pointer transition-colors ${guideMode === "global"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}>Global</button>
            </div>
          </div>
        )}
      </div>
      <button className={`ds-icon-btn ${snapToGrid ? "active" : ""}`} onClick={() => setSnapToGrid(!snapToGrid)} title="Snap a rejilla">
        <Icon name="snap" size={16} />
      </button>
      <div ref={gapRef} className="relative">
        <button className={`ds-icon-btn ${pageGap > 0 || showGapConfig ? "active" : ""}`} onClick={() => setShowGapConfig(!showGapConfig)} title="Separación entre páginas">
          <Icon name="gap" size={16} />
        </button>
        {showGapConfig && (
          <div className="absolute top-full right-0 mt-2 bg-popover border border-border rounded-xl p-3 z-[60] min-w-[190px] shadow-lg"
            onClick={(e) => e.stopPropagation()}>
            <div className="text-[11px] text-muted-foreground mb-1.5 font-medium">Separación entre páginas</div>
            <input type="number" min={0} max={200} value={pageGap}
              onChange={(e) => setPageGap(Math.max(0, Math.min(200, Number(e.target.value) || 0)))}
              className="ds-input" />
          </div>
        )}
      </div>

      <div className={divider} />

      {/* Size presets */}
      <div ref={presetsRef} className="relative">
        <button
          className="ds-btn-ghost h-7 px-2 text-xs font-medium"
          onClick={() => setShowPresets(!showPresets)}
          title="Tamaños predefinidos"
        >
          {canvasWidth}×{canvasHeight}
        </button>
        {showPresets && (
          <div className="absolute top-full right-0 mt-2 bg-popover border border-border rounded-xl p-2 z-[60] min-w-[240px] shadow-lg">
            <div className="text-[10px] text-muted-foreground px-2 py-1.5 font-semibold uppercase tracking-wider">Predefinidos</div>
            {CANVAS_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setCanvasSize(p.w, p.h); setShowPresets(false); setCustomW(String(p.w)); setCustomH(String(p.h)); }}
                className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg border-none bg-transparent text-popover-foreground hover:bg-accent cursor-pointer text-xs transition-colors"
              >
                <span>{p.label}</span>
                <span className="text-muted-foreground tabular-nums">{p.w}×{p.h}</span>
              </button>
            ))}
            <div className="h-px bg-border my-2" />
            <div className="text-[10px] text-muted-foreground px-2 py-1.5 font-semibold uppercase tracking-wider">Personalizado</div>
            <div className="flex items-center gap-2 px-2 py-1">
              <input type="number" min={50} max={9999} value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                className="ds-input w-16 text-center h-7" />
              <span className="text-xs text-muted-foreground">×</span>
              <input type="number" min={50} max={9999} value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                className="ds-input w-16 text-center h-7" />
              <button onClick={() => {
                const w = parseInt(customW, 10);
                const h = parseInt(customH, 10);
                if (w >= 50 && h >= 50) { setCanvasSize(w, h); setShowPresets(false); }
              }}
                className="ds-btn-primary h-7 px-2.5">OK</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete */}
      {selectedIds.length > 0 && (
        <button onClick={deleteSelected} className="ds-icon-btn text-destructive hover:bg-destructive/10 hover:text-destructive" title="Eliminar">
          <Icon name="trash" size={16} />
        </button>
      )}

      {/* Export */}
      <div ref={exportRef} className="relative flex items-center gap-1">
        <button
          className={`ds-btn h-8 px-4 text-xs font-semibold ${exporting
            ? "bg-muted text-muted-foreground opacity-70 cursor-not-allowed"
            : "ds-btn-primary"
            }`}
          onClick={() => { if (!exporting) setShowExportDialog(true); }}
          disabled={exporting}
        >
          {exporting ? `Exportando ${progress}%` : "Exportar"}
        </button>
        <button onClick={handleExportJsx} className="ds-btn-ghost h-8 px-2" title="Exportar como JSX">
          <Icon name="code" size={16} />
        </button>
      </div>

      {/* Export dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div ref={exportDialogRef} className="bg-card border border-border rounded-xl p-5 w-[360px] shadow-2xl space-y-4"
            onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Exportar diseño</h2>
              <button onClick={() => setShowExportDialog(false)} className="ds-icon-btn w-6 h-6"><Icon name="close" size={14} /></button>
            </div>

            <div>
              <div className="ds-section-title mb-2">Formato</div>
              <div className="flex gap-2">
                {(["png", "jpg", "webp"] as ExportFormat[]).map((fmt) => (
                  <button key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`flex-1 h-8 rounded-lg border text-xs cursor-pointer font-medium transition-colors ${exportFormat === fmt
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}>
                    .{fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="ds-section-title mb-2">Escala</div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((s) => (
                  <button key={s}
                    onClick={() => setExportScale(s)}
                    className={`flex-1 h-8 rounded-lg border text-xs cursor-pointer font-medium transition-colors ${exportScale === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="ds-section-title mb-2">Páginas</div>
              <input value={exportPages}
                onChange={(e) => setExportPages(e.target.value)}
                placeholder='all, 1-5, 1,3,7, !7'
                className="ds-input"
              />
              <div className="text-[10px] text-muted-foreground/60 mt-1.5">
                all · 1-5 · 1,3,7 · !7 (todas menos la 7)
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowExportDialog(false)} className="ds-btn-secondary flex-1 h-9">Cancelar</button>
              <button onClick={handleExportWithConfig} className="ds-btn-primary flex-1 h-9">Exportar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
