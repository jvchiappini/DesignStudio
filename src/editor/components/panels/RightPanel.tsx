import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import { useEditorStore } from "../../store/editorStore";
import type { DesignElement, Guide } from "../../utils/types";
import { useFontLoader } from "../../../hooks/useFontLoader";
import { useTextToPaths } from "../../../hooks/useTextToPaths";
import { svgHasPaths, svgHasTextElements, textSvgToPaths } from "../../../utils/svgTextToPaths";
import { BackgroundLayerEditor } from "../tools/BackgroundLayerEditor";
import { LayoutEditor } from "../tools/LayoutEditor";
import { GOOGLE_FONTS, loadGoogleFont } from "../../utils/googleFonts";
import { optimizeImage } from "../../utils/imageOptimizer";
import { calculateOptimalFontSize } from "../../utils/textMeasure";

function NumField({ label: lbl, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground font-medium mb-1">{lbl}</div>
      <input type="number"
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
        min={min} max={max} step={step ?? 1}
        className="w-full px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs font-sans box-border"
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "" || raw === "-") return;
          const num = Number(raw);
          if (isFinite(num)) onChange(num);
        }} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide pb-1.5 border-b border-border mb-2.5">
        {title}
      </div>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function GuideProperties({ guide }: { guide: Guide }) {
  const updateGuidePosition = useEditorStore((s) => s.updateGuidePosition);
  const updateGuide = useEditorStore((s) => s.updateGuide);
  const removeGuide = useEditorStore((s) => s.removeGuide);
  const setSelectedGuideId = useEditorStore((s) => s.setSelectedGuideId);
  const pages = useEditorStore((s) => s.pages);
  const activePageIndex = useEditorStore((s) => s.activePageIndex);

  const currentPage = pages[activePageIndex];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-foreground">Guía</span>
        <div className="flex gap-1">
          <button onClick={() => { removeGuide(guide.id); setSelectedGuideId(null); }}
            className="bg-accent border-none rounded text-destructive hover:text-destructive/80 cursor-pointer text-sm px-2 py-1 leading-none">🗑</button>
        </div>
      </div>

      <Section title="Identidad">
        <div className="mb-3">
          <div className="text-[11px] text-muted-foreground font-medium mb-1">ID</div>
          <input type="text" value={guide.id}
            className="w-full px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs font-mono box-border"
            onChange={(e) => updateGuide(guide.id, { id: e.target.value })} />
        </div>
      </Section>

      <Section title="Posición">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumField label={guide.orientation === "horizontal" ? "Y (px)" : "X (px)"}
            value={guide.position}
            onChange={(v) => updateGuidePosition(guide.id, v)} />
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-1">Orientación</div>
            <div className="flex gap-1">
              <button onClick={() => updateGuide(guide.id, { orientation: "vertical" })}
                className={`flex-1 px-2 py-1.5 border-none rounded text-xs cursor-pointer leading-none ${guide.orientation === "vertical" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground"}`}>
                ┃ Vertical
              </button>
              <button onClick={() => updateGuide(guide.id, { orientation: "horizontal" })}
                className={`flex-1 px-2 py-1.5 border-none rounded text-xs cursor-pointer leading-none ${guide.orientation === "horizontal" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground"}`}>
                ━ Horizontal
              </button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Página">
        <div className="text-xs text-muted-foreground">
          {currentPage ? currentPage.name || currentPage.id : "—"}
        </div>
      </Section>

      <Section title="Acciones">
        <button onClick={() => { removeGuide(guide.id); setSelectedGuideId(null); }}
          className="w-full px-2 py-1.5 border border-border rounded bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer text-xs leading-none">
          Eliminar guía
        </button>
      </Section>
    </>
  );
}

export function RightPanel() {
  const rightTab = useEditorStore((s) => s.rightTab);
  const selectedId = useEditorStore((s) => s.selectedId);
  const elements = useEditorStore((s) => s.elements);
  const updateElement = useEditorStore((s) => s.updateElement);
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  const bringToFront = useEditorStore((s) => s.bringToFront);
  const sendToBack = useEditorStore((s) => s.sendToBack);
  const selectedGuideId = useEditorStore((s) => s.selectedGuideId);
  const guides = useEditorStore((s) => s.guides);

  const isElementOpen = rightTab === "properties" && selectedId;
  const el = isElementOpen ? elements.find((e) => e.id === selectedId) : null;
  const typeLabel = el ? (el.type === "text" ? "Texto" : el.type === "image" ? "Imagen" : el.type === "shape" ? "Forma" : "SVG") : "";

  const guide = selectedGuideId ? guides.find((g) => g.id === selectedGuideId) : null;
  const isGuideOpen = !!guide;

  return (
    <div className={`absolute right-0 top-0 h-full z-50 transition-transform duration-200 ${
      (isElementOpen && el) || isGuideOpen ? "translate-x-0" : "translate-x-full"
    }`}>
      <div className="w-[280px] h-full bg-card border-l border-border overflow-y-auto p-4">
        {isGuideOpen && guide && <GuideProperties guide={guide} />}

        {!isGuideOpen && el && (
          <>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-foreground">{typeLabel}</span>
            <div className="flex gap-1">
              <button onClick={() => sendToBack(el.id)} title="Al fondo"
                className="bg-accent border-none rounded text-muted-foreground hover:text-foreground cursor-pointer text-sm px-2 py-1 leading-none">⬇</button>
              <button onClick={() => bringToFront(el.id)} title="Al frente"
                className="bg-accent border-none rounded text-muted-foreground hover:text-foreground cursor-pointer text-sm px-2 py-1 leading-none">⬆</button>
              <button onClick={deleteSelected} title="Eliminar"
                className="bg-accent border-none rounded text-destructive hover:text-destructive/80 cursor-pointer text-sm px-2 py-1 leading-none">🗑</button>
            </div>
        </div>

            <Section title="Posición">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <NumField label="X" value={el.x} onChange={(v) => updateElement(el.id, { x: v })} />
                <NumField label="Y" value={el.y} onChange={(v) => updateElement(el.id, { y: v })} />
              </div>
            </Section>

            <Section title="Tamaño">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <NumField label="Ancho" value={el.width} onChange={(v) => updateElement(el.id, { width: Math.max(10, v) })} min={10} />
                <NumField label="Alto" value={el.height} onChange={(v) => updateElement(el.id, { height: Math.max(10, v) })} min={10} />
              </div>
            </Section>

            <Section title="Transformar">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <NumField label="Rotación" value={el.rotation} onChange={(v) => updateElement(el.id, { rotation: v })} />
                <NumField label="Opacidad" value={el.opacity} onChange={(v) => updateElement(el.id, { opacity: Math.max(0, Math.min(1, v)) })} min={0} max={1} step={0.05} />
              </div>
            </Section>

            <Section title="Voltear">
              <div className="flex gap-2 mb-3">
                <button onClick={() => updateElement(el.id, { flipH: !el.flipH })}
                  className={`flex-1 px-2 py-1.5 border-none rounded text-xs cursor-pointer leading-none ${el.flipH ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground"
                    }`}>
                  ↔ Horizontal
                </button>
                <button onClick={() => updateElement(el.id, { flipV: !el.flipV })}
                  className={`flex-1 px-2 py-1.5 border-none rounded text-xs cursor-pointer leading-none ${el.flipV ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground"
                    }`}>
                  ↕ Vertical
                </button>
              </div>
            </Section>

            <Section title="Sombra">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <div className="text-[11px] text-muted-foreground font-medium mb-1">Color</div>
                  <input type="color" value={el.shadowColor ?? "#000000"}
                    className="w-full px-2 py-1 border border-border rounded bg-background h-8 box-border"
                    onChange={(e) => updateElement(el.id, { shadowColor: e.target.value })} />
                </div>
                <NumField label="Difuminado" value={el.shadowBlur ?? 0}
                  onChange={(v) => updateElement(el.id, { shadowBlur: v })} min={0} />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <NumField label="Offset X" value={el.shadowOffsetX ?? 0}
                  onChange={(v) => updateElement(el.id, { shadowOffsetX: v })} />
                <NumField label="Offset Y" value={el.shadowOffsetY ?? 4}
                  onChange={(v) => updateElement(el.id, { shadowOffsetY: v })} />
              </div>
              <button onClick={() => updateElement(el.id, { shadowColor: undefined, shadowBlur: undefined, shadowOffsetX: undefined, shadowOffsetY: undefined })}
                className="w-full px-2 py-1.5 border-none rounded bg-accent text-destructive hover:text-destructive/80 cursor-pointer text-xs leading-none mt-1">
                Eliminar sombra
              </button>
            </Section>

            {el.type === "text" && <TextFields el={el} updateElement={updateElement} />}
            {el.type === "image" && <ImageFields el={el} updateElement={updateElement} />}
            {el.type === "shape" && <ShapeFields el={el} updateElement={updateElement} />}
            {el.type === "svg" && <SvgFields el={el} updateElement={updateElement} />}

            {/* Auto Layout — available for all element types */}
            <Section title="Auto Layout">
              <LayoutEditor el={el} updateElement={updateElement} elements={elements} />
            </Section>

            {/* Clip / Mask */}
            <ClipFields el={el} updateElement={updateElement} />
          </>
        )}
      </div>
    </div>
  );
}

interface FontEntry { value: string; display: string }
interface FontGroup { label: string; fonts: FontEntry[] }

const FONT_GROUPS: FontGroup[] = [
  {
    label: "Sistema", fonts: [
      { value: "Inter, system-ui, sans-serif", display: "Inter" },
      { value: "system-ui, sans-serif", display: "System UI" },
      { value: "Arial, sans-serif", display: "Arial" },
      { value: "Arial Black, sans-serif", display: "Arial Black" },
      { value: "Helvetica, sans-serif", display: "Helvetica" },
      { value: "Verdana, sans-serif", display: "Verdana" },
      { value: "'Trebuchet MS', sans-serif", display: "Trebuchet MS" },
      { value: "'Segoe UI', sans-serif", display: "Segoe UI" },
      { value: "Tahoma, sans-serif", display: "Tahoma" },
      { value: "'Century Gothic', sans-serif", display: "Century Gothic" },
      { value: "Calibri, sans-serif", display: "Calibri" },
      { value: "Candara, sans-serif", display: "Candara" },
      { value: "Futura, sans-serif", display: "Futura" },
      { value: "'Gill Sans', sans-serif", display: "Gill Sans" },
      { value: "Impact, sans-serif", display: "Impact" },
      { value: "'Comic Sans MS', cursive", display: "Comic Sans" },
    ]
  },
  {
    label: "Serif", fonts: [
      { value: "'Times New Roman', serif", display: "Times New Roman" },
      { value: "Georgia, serif", display: "Georgia" },
      { value: "Garamond, serif", display: "Garamond" },
      { value: "'Book Antiqua', serif", display: "Book Antiqua" },
      { value: "'Palatino Linotype', serif", display: "Palatino" },
      { value: "'Lucida Bright', serif", display: "Lucida Bright" },
    ]
  },
  {
    label: "Monoespaciadas", fonts: [
      { value: "'Courier New', monospace", display: "Courier New" },
      { value: "'Lucida Console', monospace", display: "Lucida Console" },
    ]
  },
];

const styleBtn =
  "w-7 h-7 flex items-center justify-center border border-border rounded bg-background text-foreground text-xs cursor-pointer leading-none";

function TextFields({ el, updateElement }: {
  el: DesignElement; updateElement: (id: string, u: Partial<DesignElement>) => void;
}) {
  const { loadCustomFont, getFonts, removeFont, loadFontFromUrl } = useFontLoader();
  const { convertToSvgPaths } = useTextToPaths();
  const allGuides = useEditorStore((s) => s.guides);
  const pages = useEditorStore((s) => s.pages);
  const activePageIndex = useEditorStore((s) => s.activePageIndex);
  const pageGap = useEditorStore((s) => s.pageGap);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const fontUrlRef = useRef<HTMLInputElement>(null);
  const fontPickerRef = useRef<HTMLDivElement>(null);
  const [converting, setConverting] = useState(false);
  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  const [fontUrl, setFontUrl] = useState("");
  const [loadingUrl, setLoadingUrl] = useState(false);
  const customFonts = getFonts();
  const gradColors = el.textGradientColors ?? ["#ff6b6b", "#4ecdc4"];

  useEffect(() => {
    if (!fontPickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (fontPickerRef.current && !fontPickerRef.current.contains(e.target as Node)) setFontPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [fontPickerOpen]);

  const handleFontUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const cf = await loadCustomFont(file);
    if (cf) updateElement(el.id, { fontFamily: cf.name });
    e.target.value = "";
  }, [el.id, updateElement, loadCustomFont]);

  const updateGradient = useCallback((colors: string[]) => {
    const grad = `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
    updateElement(el.id, { textGradient: grad, textGradientColors: colors });
  }, [el.id, updateElement]);

  const handleConvertToSvg = useCallback(async () => {
    setConverting(true);
    const svg = await convertToSvgPaths(el);
    if (svg) {
      const store = useEditorStore.getState();
      store.saveSnapshot();
      store.updateElement(el.id, {
        type: "svg",
        svgContent: svg,
        isSvgPath: true,
        text: undefined, fontSize: undefined, fontFamily: undefined,
        fontWeight: undefined, fontStyle: undefined, textAlign: undefined,
        color: undefined, letterSpacing: undefined, lineHeight: undefined,
        textDecoration: undefined, textBgColor: undefined,
        textTransform: undefined, textStrokeColor: undefined,
        textStrokeWidth: undefined, textIndent: undefined,
        wordSpacing: undefined, fontVariant: undefined,
        verticalAlign: undefined, charScaleX: undefined, charScaleY: undefined,
        textGradient: undefined, textGradientColors: undefined,
      });
    }
    setConverting(false);
  }, [el, convertToSvgPaths]);

  const handleAnchorOffsetChange = useCallback((targetEl: DesignElement, side: "leftAnchorOffset" | "rightAnchorOffset", value: number) => {
    const guideId = side === "leftAnchorOffset" ? targetEl.leftAnchor : targetEl.rightAnchor;
    if (!guideId) {
      updateElement(targetEl.id, { [side]: value });
      return;
    }
    const guide = allGuides.find((g) => g.id === guideId);
    if (!guide) {
      updateElement(targetEl.id, { [side]: value });
      return;
    }
    let pageStart = 0;
    for (let i = 0; i < activePageIndex; i++) {
      pageStart += pages[i].width + pageGap;
    }
    if (side === "leftAnchorOffset") {
      const newX = guide.position + pageStart + value;
      updateElement(targetEl.id, { leftAnchorOffset: value, x: newX });
    } else {
      const newRight = guide.position + pageStart + value;
      if (targetEl.leftAnchor && targetEl.leftAnchor !== guideId) {
        const newWidth = Math.max(10, newRight - targetEl.x);
        updateElement(targetEl.id, { rightAnchorOffset: value, width: newWidth });
      } else {
        const newX = newRight - targetEl.width;
        updateElement(targetEl.id, { rightAnchorOffset: value, x: newX });
      }
    }
  }, [allGuides, pages, activePageIndex, pageGap, updateElement]);

  return (
    <>
      <Section title="Contenido">
        <textarea value={el.text ?? ""}
          className="w-full px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs font-sans box-border min-h-[56px] resize-vertical"
          onChange={(e) => updateElement(el.id, { text: e.target.value })} />
      </Section>

      <Section title="Fuente">
        <div className="mb-3 relative" ref={fontPickerRef}>
          <button onClick={() => setFontPickerOpen(!fontPickerOpen)}
            className="w-full px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs text-left flex items-center gap-2 cursor-pointer hover:border-foreground/30">
            <span style={{ fontFamily: el.fontFamily, fontSize: 14 }} className="flex-1 truncate">
              {el.fontFamily?.split(",")[0] ?? "System UI"}
            </span>
            <span className="text-muted-foreground text-[10px]">▾</span>
          </button>
          {fontPickerOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg z-[70] shadow-lg max-h-[260px] overflow-y-auto">
              {(() => {
                const groups: FontGroup[] = [
                  ...FONT_GROUPS,
                  ...(customFonts.length > 0
                    ? [{ label: "Personalizadas", fonts: customFonts.map((f) => ({ value: f.name, display: f.name })) }]
                    : []),
                  { label: "Google Fonts", fonts: GOOGLE_FONTS.map((f) => ({ value: f + ", sans-serif", display: f })) },
                ];
                return groups.map((g) => (
                  <div key={g.label}>
                    <div className="text-[10px] text-muted-foreground px-2.5 pt-2 pb-0.5 font-semibold uppercase tracking-wider">{g.label}</div>
                    {g.fonts.map((f) => (
                      <button key={f.value}
                        onClick={() => { updateElement(el.id, { fontFamily: f.value }); loadGoogleFont(f.display); setFontPickerOpen(false); }}
                        className={`w-full px-2.5 py-1.5 border-none bg-transparent text-left text-xs cursor-pointer flex items-center gap-2 hover:bg-accent ${el.fontFamily === f.value ? "bg-primary/10 text-primary" : "text-popover-foreground"
                          }`}
                        style={{ fontFamily: f.value, fontSize: 14 }}>
                        {f.display}
                      </button>
                    ))}
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumField label="Tamaño" value={el.fontSize ?? 32} onChange={(v) => updateElement(el.id, { fontSize: v })} min={8} />
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-1">Color</div>
            <input type="color" value={el.color ?? "#ffffff"}
              className="w-full px-2 py-1 border border-border rounded bg-background h-8 box-border"
              onChange={(e) => updateElement(el.id, { color: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input type="checkbox" id="autoFitSize"
            checked={!!el.autoFitSize}
            onChange={(e) => {
              const newVal = e.target.checked || undefined;
              updateElement(el.id, { autoFitSize: newVal });
              if (newVal) {
                const optimal = calculateOptimalFontSize(el);
                if (optimal !== null && optimal !== el.fontSize) {
                  updateElement(el.id, { fontSize: optimal });
                }
              }
            }}
            className="cursor-pointer accent-primary" />
          <label htmlFor="autoFitSize" className="text-[10px] text-muted-foreground cursor-pointer select-none">
            Auto ajustar texto al contenedor
          </label>
        </div>
      </Section>

      <Section title="Anclaje a guías">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-1">Guía izquierda</div>
            <input type="text" value={el.leftAnchor ?? ""}
              placeholder="—"
              className="w-full px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs font-mono box-border"
              onChange={(e) => updateElement(el.id, { leftAnchor: e.target.value || undefined })} />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-1">Distancia</div>
            <input type="text" inputMode="numeric"
              value={String(el.leftAnchorOffset ?? 0)}
              className="w-full px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs font-mono box-border"
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "" || raw === "-") return;
                const num = Number(raw);
                if (isFinite(num)) handleAnchorOffsetChange(el, "leftAnchorOffset", num);
              }} />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-1">Guía derecha</div>
            <input type="text" value={el.rightAnchor ?? ""}
              placeholder="—"
              className="w-full px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs font-mono box-border"
              onChange={(e) => updateElement(el.id, { rightAnchor: e.target.value || undefined })} />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-1">Distancia</div>
            <input type="text" inputMode="numeric"
              value={String(el.rightAnchorOffset ?? 0)}
              className="w-full px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs font-mono box-border"
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "" || raw === "-") return;
                const num = Number(raw);
                if (isFinite(num)) handleAnchorOffsetChange(el, "rightAnchorOffset", num);
              }} />
          </div>
        </div>
        {(() => {
          const currentPageId = pages[activePageIndex]?.id;
          const pageGuides = allGuides.filter((g) => !g.pageId || g.pageId === currentPageId);
          if (pageGuides.length === 0) return null;
          return (
            <details className="text-[10px] text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Guías disponibles ({pageGuides.length})
              </summary>
              <div className="mt-1.5 space-y-0.5 max-h-[120px] overflow-y-auto">
                {pageGuides.map((g) => (
                  <div key={g.id} className="flex items-center gap-2 py-0.5">
                    <span className="font-mono text-[10px]">{g.id}</span>
                    <span className="text-[9px] opacity-60">{Math.round(g.position)}px {g.orientation === "vertical" ? "↕" : "↔"}</span>
                  </div>
                ))}
              </div>
            </details>
          );
        })()}
      </Section>

      <Section title="Estilo">
        <div className="flex items-center gap-1 mb-3">
          <button onClick={() => updateElement(el.id, { fontWeight: el.fontWeight === 700 ? 400 : 700 })}
            className={`${styleBtn} ${(el.fontWeight ?? 400) >= 600 ? "bg-accent text-foreground" : ""}`}
            title="Negrita"><b>B</b></button>
          <button onClick={() => updateElement(el.id, { fontStyle: el.fontStyle === "italic" ? "normal" : "italic" })}
            className={`${styleBtn} ${el.fontStyle === "italic" ? "bg-accent text-foreground" : ""}`}
            title="Cursiva"><i>I</i></button>
          <button onClick={() => updateElement(el.id, { textDecoration: el.textDecoration === "underline" ? "none" : "underline" })}
            className={`${styleBtn} ${el.textDecoration === "underline" ? "bg-accent text-foreground" : ""}`}
            title="Subrayado"><u>U</u></button>
          <button onClick={() => updateElement(el.id, { textDecoration: el.textDecoration === "line-through" ? "none" : "line-through" })}
            className={`${styleBtn} ${el.textDecoration === "line-through" ? "bg-accent text-foreground" : ""}`}
            title="Tachado"><s>S</s></button>
          <div className="w-px h-5 bg-border mx-1" />
          <button onClick={() => updateElement(el.id, { fontVariant: el.fontVariant === "small-caps" ? "normal" : "small-caps" })}
            className={`${styleBtn} ${el.fontVariant === "small-caps" ? "bg-accent text-foreground" : ""}`}
            title="Versalitas"><span style={{ fontVariant: "small-caps" }}>Aa</span></button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-1">Peso</div>
            <select value={el.fontWeight}
              className="w-full px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs font-sans box-border"
              onChange={(e) => updateElement(el.id, { fontWeight: Number(e.target.value) })}>
              <option value={100}>Thin</option>
              <option value={200}>Extra Light</option>
              <option value={300}>Light</option>
              <option value={400}>Normal</option>
              <option value={500}>Medium</option>
              <option value={600}>Semi Bold</option>
              <option value={700}>Bold</option>
              <option value={800}>Extra Bold</option>
              <option value={900}>Black</option>
            </select>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-1">Transformar</div>
            <select value={el.textTransform ?? "none"}
              className="w-full px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs font-sans box-border"
              onChange={(e) => updateElement(el.id, { textTransform: e.target.value as "none" | "uppercase" | "lowercase" | "capitalize" })}>
              <option value="none">Normal</option>
              <option value="uppercase">MAYÚSCULAS</option>
              <option value="lowercase">minúsculas</option>
              <option value="capitalize">Capitalizar</option>
            </select>
          </div>
        </div>
      </Section>

      <Section title="Espaciado">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumField label="Interletraje" value={el.letterSpacing ?? 0}
            onChange={(v) => updateElement(el.id, { letterSpacing: v })} step={0.5} />
          <NumField label="Altura línea" value={el.lineHeight ?? 1.2}
            onChange={(v) => updateElement(el.id, { lineHeight: Math.max(0.5, v) })} step={0.1} min={0.5} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumField label="Esp. palabras" value={el.wordSpacing ?? 0}
            onChange={(v) => updateElement(el.id, { wordSpacing: v })} step={0.5} />
          <NumField label="Sangría" value={el.textIndent ?? 0}
            onChange={(v) => updateElement(el.id, { textIndent: v })} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumField label="Escala X %" value={el.charScaleX ?? 100}
            onChange={(v) => updateElement(el.id, { charScaleX: Math.max(10, v) })} min={10} />
          <NumField label="Escala Y %" value={el.charScaleY ?? 100}
            onChange={(v) => updateElement(el.id, { charScaleY: Math.max(10, v) })} min={10} />
        </div>
      </Section>

      <Section title="Padding interno">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <NumField label="Izquierdo" value={el.textPaddingLeft ?? 4}
            onChange={(v) => updateElement(el.id, { textPaddingLeft: Math.max(0, v) })} min={0} />
          <NumField label="Derecho" value={el.textPaddingRight ?? 4}
            onChange={(v) => updateElement(el.id, { textPaddingRight: Math.max(0, v) })} min={0} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Superior" value={el.textPaddingTop ?? 4}
            onChange={(v) => updateElement(el.id, { textPaddingTop: Math.max(0, v) })} min={0} />
          <NumField label="Inferior" value={el.textPaddingBottom ?? 4}
            onChange={(v) => updateElement(el.id, { textPaddingBottom: Math.max(0, v) })} min={0} />
        </div>
      </Section>

      <Section title="Outline (borde externo)">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-1">Color</div>
            <input type="color" value={el.textOutlineColor ?? "#6c5ce7"}
              className="w-full px-2 py-1 border border-border rounded bg-background h-8 box-border"
              onChange={(e) => updateElement(el.id, { textOutlineColor: e.target.value })} />
          </div>
          <NumField label="Grosor" value={el.textOutlineWidth ?? 0}
            onChange={(v) => updateElement(el.id, { textOutlineWidth: Math.max(0, v) })} min={0} />
        </div>
        {(el.textOutlineWidth ?? 0) > 0 && (
          <button onClick={() => updateElement(el.id, { textOutlineColor: undefined, textOutlineWidth: undefined })}
            className="w-full px-2 py-1 border border-border rounded bg-transparent text-destructive text-[10px] cursor-pointer leading-none">
            Quitar outline
          </button>
        )}
      </Section>

      <Section title="Desbordamiento">
        <div className="flex gap-1">
          {(["hidden", "visible", "ellipsis", "clip"] as const).map((o) => (
            <button key={o} onClick={() => updateElement(el.id, { textOverflow: o === "hidden" ? undefined : o })}
              className={`flex-1 h-8 text-[10px] border rounded cursor-pointer leading-none
                ${(el.textOverflow ?? "hidden") === o ? "bg-accent text-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"}`}>
              {o === "hidden" ? "Ocultar" : o === "visible" ? "Visible" : o === "ellipsis" ? "..." : "Clip"}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Decoración">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-1">Borde texto</div>
            <input type="color" value={el.textStrokeColor ?? "#000000"}
              className="w-full px-2 py-1 border border-border rounded bg-background h-8 box-border"
              onChange={(e) => updateElement(el.id, { textStrokeColor: e.target.value })} />
          </div>
          <NumField label="Grosor borde" value={el.textStrokeWidth ?? 0}
            onChange={(v) => updateElement(el.id, { textStrokeWidth: Math.max(0, v) })} min={0} step={0.5} />
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground font-medium mb-1">Fondo texto</div>
          <input type="color" value={el.textBgColor ?? "#00000000"}
            className="w-full px-2 py-1 border border-border rounded bg-background h-8 box-border"
            onChange={(e) => updateElement(el.id, { textBgColor: e.target.value })} />
        </div>
      </Section>

      <ShadowList el={el} updateElement={updateElement} />

      <Section title="Degradado">
        <div className="flex items-center gap-2 mb-2">
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-1">Color 1</div>
            <input type="color" value={gradColors[0]}
              className="w-full px-2 py-1 border border-border rounded bg-background h-8 box-border"
              onChange={(e) => updateGradient([e.target.value, gradColors[1]])} />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-1">Color 2</div>
            <input type="color" value={gradColors[1]}
              className="w-full px-2 py-1 border border-border rounded bg-background h-8 box-border"
              onChange={(e) => updateGradient([gradColors[0], e.target.value])} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => updateGradient(["#ff6b6b", "#4ecdc4"])}
            className="w-7 h-7 rounded border border-border"
            style={{ background: "linear-gradient(135deg, #ff6b6b, #4ecdc4)" }} title="Verde-Rosa" />
          <button onClick={() => updateGradient(["#667eea", "#764ba2"])}
            className="w-7 h-7 rounded border border-border"
            style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }} title="Púrpura" />
          <button onClick={() => updateGradient(["#f093fb", "#f5576c"])}
            className="w-7 h-7 rounded border border-border"
            style={{ background: "linear-gradient(135deg, #f093fb, #f5576c)" }} title="Rosa" />
          <button onClick={() => updateGradient(["#4facfe", "#00f2fe"])}
            className="w-7 h-7 rounded border border-border"
            style={{ background: "linear-gradient(135deg, #4facfe, #00f2fe)" }} title="Celeste" />
          <button onClick={() => updateGradient(["#43e97b", "#38f9d7"])}
            className="w-7 h-7 rounded border border-border"
            style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)" }} title="Verde" />
          <button onClick={() => updateElement(el.id, { textGradient: undefined, textGradientColors: undefined })}
            className="w-7 h-7 rounded border border-border bg-muted text-[10px] flex items-center justify-center text-muted-foreground"
            title="Quitar degradado">✕</button>
        </div>
      </Section>

      <Section title="Alineación">
        <div className="flex items-center gap-1 mb-3">
          <button onClick={() => updateElement(el.id, { textAlign: "left" })}
            className={`${styleBtn} ${el.textAlign === "left" || !el.textAlign ? "bg-accent text-foreground" : ""}`}
            title="Izquierda">≡</button>
          <button onClick={() => updateElement(el.id, { textAlign: "center" })}
            className={`${styleBtn} ${el.textAlign === "center" ? "bg-accent text-foreground" : ""}`}
            title="Centro">≡</button>
          <button onClick={() => updateElement(el.id, { textAlign: "right" })}
            className={`${styleBtn} ${el.textAlign === "right" ? "bg-accent text-foreground" : ""}`}
            title="Derecha">≡</button>
          <div className="w-px h-5 bg-border mx-1" />
          <button onClick={() => updateElement(el.id, { verticalAlign: "top" })}
            className={`${styleBtn} ${el.verticalAlign === "top" ? "bg-accent text-foreground" : ""}`}
            title="Arriba">⊤</button>
          <button onClick={() => updateElement(el.id, { verticalAlign: "middle" })}
            className={`${styleBtn} ${(el.verticalAlign ?? "middle") === "middle" ? "bg-accent text-foreground" : ""}`}
            title="Centro vertical">⟂</button>
          <button onClick={() => updateElement(el.id, { verticalAlign: "bottom" })}
            className={`${styleBtn} ${el.verticalAlign === "bottom" ? "bg-accent text-foreground" : ""}`}
            title="Abajo">⊥</button>
        </div>
      </Section>

      <Section title="Fuentes personalizadas">
        <button onClick={() => fontInputRef.current?.click()}
          className="w-full h-9 px-3 border border-border rounded-lg bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-xs flex items-center justify-center gap-1.5">
          📁 Subir fuente (TTF/OTF/WOFF)
        </button>
        <input ref={fontInputRef} type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleFontUpload} />
        <div className="flex gap-1.5 mt-2">
          <input ref={fontUrlRef} type="url" value={fontUrl}
            onChange={(e) => setFontUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") fontUrlRef.current?.form?.requestSubmit(); }}
            placeholder="URL de Google Fonts o .ttf/.woff"
            className="flex-1 px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs font-sans box-border min-w-0" />
          <button onClick={async () => {
            if (!fontUrl.trim() || loadingUrl) return;
            setLoadingUrl(true);
            try {
              const result = await loadFontFromUrl(fontUrl.trim());
              if (result) {
                updateElement(el.id, { fontFamily: result.name });
                setFontUrl("");
              } else {
                alert("No se pudo cargar la fuente desde esa URL");
              }
            } finally {
              setLoadingUrl(false);
            }
          }} disabled={loadingUrl}
            className="shrink-0 h-8 px-2.5 border border-border rounded-lg bg-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30 cursor-pointer text-xs disabled:opacity-50">
            {loadingUrl ? "..." : "Cargar"}
          </button>
        </div>
        {customFonts.length > 0 && (
          <div className="mt-2 space-y-1">
            {customFonts.map((f) => (
              <div key={f.name} className="flex items-center justify-between px-2 py-1 rounded bg-muted">
                <span className="text-xs text-muted-foreground truncate flex-1">{f.name}</span>
                <button onClick={() => removeFont(f.name)}
                  className="text-destructive hover:text-destructive/80 text-xs border-none bg-transparent cursor-pointer ml-2">✕</button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Exportar como SVG">
        <button onClick={handleConvertToSvg} disabled={converting}
          className="w-full h-9 px-3 border border-border rounded-lg bg-accent text-foreground hover:bg-accent/50 cursor-pointer text-xs flex items-center justify-center gap-1.5 disabled:opacity-50">
          {converting ? "Convirtiendo..." : "📐 Convertir texto a SVG vectorial"}
        </button>
        <div className="text-[10px] text-muted-foreground mt-1">
          Descarga el texto como SVG con paths editables (opentype.js)
        </div>
      </Section>
    </>
  );
}

function ShadowList({ el, updateElement }: {
  el: DesignElement; updateElement: (id: string, u: Partial<DesignElement>) => void;
}) {
  const shadows = el.textShadows ?? [];
  const updateShadows = (list: typeof shadows) => updateElement(el.id, { textShadows: list.length > 0 ? list : undefined });
  const addShadow = () => updateShadows([...shadows, { color: "#000000", blur: 10, offsetX: 0, offsetY: 4 }]);

  return (
    <Section title="Sombras múltiples">
      {shadows.length === 0 ? (
        <div className="text-[10px] text-muted-foreground mb-2">
          Sin sombras adicionales. El panel Sombra general aplica la primera capa.
        </div>
      ) : (
        <div className="space-y-2 mb-2">
          {shadows.map((s, i) => (
            <div key={i} className="flex flex-col gap-1 p-2 border border-border rounded bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-medium">Sombra {i + 1}</span>
                <button onClick={() => updateShadows(shadows.filter((_, j) => j !== i))}
                  className="text-[10px] border-none bg-transparent cursor-pointer text-destructive hover:text-destructive/80 leading-none p-0.5">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <div className="text-[9px] text-muted-foreground">Color</div>
                  <input type="color" value={s.color}
                    className="w-full h-6 border-none p-0 cursor-pointer"
                    onChange={(e) => {
                      const copy = [...shadows];
                      copy[i] = { ...s, color: e.target.value };
                      updateShadows(copy);
                    }} />
                </div>
                <NumField label="Dif" value={s.blur} onChange={(v) => {
                  const copy = [...shadows];
                  copy[i] = { ...s, blur: Math.max(0, v) };
                  updateShadows(copy);
                }} min={0} />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <NumField label="X" value={s.offsetX} onChange={(v) => {
                  const copy = [...shadows];
                  copy[i] = { ...s, offsetX: v };
                  updateShadows(copy);
                }} />
                <NumField label="Y" value={s.offsetY} onChange={(v) => {
                  const copy = [...shadows];
                  copy[i] = { ...s, offsetY: v };
                  updateShadows(copy);
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {shadows.length < 6 && (
        <button onClick={addShadow}
          className="w-full px-2 py-1.5 border border-border rounded bg-accent text-muted-foreground hover:text-foreground cursor-pointer text-[10px] leading-none">
          + Añadir sombra
        </button>
      )}
      {shadows.length > 0 && (
        <button onClick={() => updateShadows([])}
          className="w-full mt-1 px-2 py-1 border border-border rounded bg-transparent text-destructive text-[10px] cursor-pointer leading-none">
          Quitar todas las sombras
        </button>
      )}
    </Section>
  );
}

function ImageFields({ el, updateElement }: {
  el: DesignElement; updateElement: (id: string, u: Partial<DesignElement>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const setCropElementId = useEditorStore((s) => s.setCropElementId);
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const { dataUrl, summary } = await optimizeImage(file);
      console.log(`[Image Optimization] ${summary}`);
      updateElement(el.id, { src: dataUrl });
    } catch (err) {
      console.error("Error optimizando imagen:", err);
    }
    e.target.value = "";
  }, [el.id, updateElement]);

  const handleCrop = useCallback(() => {
    setCropElementId(el.id);
  }, [el.id, setCropElementId]);

  return (
    <Section title="Imagen">
      <div className="mb-3">
        <div className="text-[11px] text-muted-foreground font-medium mb-1">URL</div>
        <input type="text" value={el.src ?? ""}
          className="w-full px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs font-sans box-border"
          onChange={(e) => updateElement(el.id, { src: e.target.value })} />
      </div>
      <button onClick={() => inputRef.current?.click()}
        className="w-full px-2 py-1.5 border-none rounded bg-accent text-muted-foreground hover:text-foreground cursor-pointer text-xs leading-none">
        Subir desde archivo
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      <button onClick={handleCrop}
        className="w-full mt-2 px-2 py-1.5 border border-border rounded bg-accent text-muted-foreground hover:text-foreground cursor-pointer text-xs leading-none">
        ✂ Recortar
      </button>

      <Section title="Filtros">
        {(["imgBrightness", "imgContrast", "imgSaturation"] as const).map((f) => {
          const labels: Record<string, string> = { imgBrightness: "Brillo", imgContrast: "Contraste", imgSaturation: "Saturación" };
          const defaults: Record<string, number> = { imgBrightness: 100, imgContrast: 100, imgSaturation: 100 };
          const val = (el as any)[f] ?? defaults[f];
          return (
            <div key={f} className="mb-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-muted-foreground">{labels[f]}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{val}%</span>
              </div>
              <input type="range" value={val} min={0} max={200}
                onChange={(e) => updateElement(el.id, { [f]: Number(e.target.value) })}
                className="w-full h-1.5 appearance-none bg-muted rounded-full cursor-pointer accent-primary" />
            </div>
          );
        })}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-muted-foreground">Desenfoque</span>
            <span className="text-[10px] text-muted-foreground tabular-nums">{el.imgBlur ?? 0}px</span>
          </div>
          <input type="range" value={el.imgBlur ?? 0} min={0} max={20} step={0.5}
            onChange={(e) => updateElement(el.id, { imgBlur: Number(e.target.value) })}
            className="w-full h-1.5 appearance-none bg-muted rounded-full cursor-pointer accent-primary" />
        </div>
        {([el.imgBrightness, el.imgContrast, el.imgSaturation, el.imgBlur].some((v) => v != null && v !== 0 && v !== 100)) && (
          <button onClick={() => updateElement(el.id, { imgBrightness: undefined, imgContrast: undefined, imgSaturation: undefined, imgBlur: undefined })}
            className="w-full h-7 px-2 border border-border rounded bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-[10px]">
            Restablecer filtros
          </button>
        )}
      </Section>
    </Section>
  );
}

function ShapeFields({ el, updateElement }: {
  el: DesignElement; updateElement: (id: string, u: Partial<DesignElement>) => void;
}) {
  return (
    <>
      <Section title="Relleno de fondo">
        <div className="mb-3">
          <div className="text-[10px] text-muted-foreground mb-1.5">Color sólido rápido</div>
          <input type="color" value={el.backgroundColor ?? "#4f46e5"}
            className="w-full h-8 border border-border rounded p-0.5 cursor-pointer box-border"
            onChange={(e) => updateElement(el.id, { backgroundColor: e.target.value })} />
        </div>
        <div className="border-t border-border pt-2">
          <div className="text-[10px] text-muted-foreground mb-2">Capas avanzadas</div>
          <BackgroundLayerEditor
            target={el}
            setLayers={(layers) => updateElement(el.id, { bgLayers: layers })}
          />
        </div>
      </Section>

      <Section title="Borde">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-1">Color</div>
            <input type="color" value={el.borderColor ?? "transparent"}
              className="w-full px-2 py-1 border border-border rounded bg-background h-8 box-border"
              onChange={(e) => updateElement(el.id, { borderColor: e.target.value })} />
          </div>
          <NumField label="Grosor" value={el.borderWidth ?? 0} onChange={(v) => updateElement(el.id, { borderWidth: v })} min={0} />
        </div>
        <div className="mb-3">
          <div className="text-[10px] text-muted-foreground mb-1.5">Radio</div>
          <NumField label="Global" value={el.borderRadius ?? 0}
            onChange={(v) => updateElement(el.id, { borderRadius: v, borderRadiusTL: undefined, borderRadiusTR: undefined, borderRadiusBR: undefined, borderRadiusBL: undefined })} min={0} />
          <div className="grid grid-cols-4 gap-1 mt-1">
            {(["TL", "TR", "BR", "BL"] as const).map((corner) => {
              const field = `borderRadius${corner}` as const;
              const label = { TL: "↖", TR: "↗", BR: "↘", BL: "↙" }[corner];
              const val = (el as any)[field] ?? el.borderRadius ?? 0;
              return (
                <div key={corner} className="flex flex-col items-center">
                  <span className="text-[9px] text-muted-foreground mb-0.5">{label}</span>
                  <input type="number" value={val} min={0}
                    onChange={(e) => updateElement(el.id, { [field]: Number(e.target.value) })}
                    className="w-full px-1 py-1 border border-border rounded bg-background text-foreground text-[10px] font-mono text-center box-border" />
                </div>
              );
            })}
          </div>
        </div>
        <div className="mb-3">
          <div className="text-[10px] text-muted-foreground mb-1">Estilo</div>
          <div className="flex gap-1">
            {(["solid", "dashed", "dotted"] as const).map((s) => (
              <button key={s} onClick={() => updateElement(el.id, { borderStyle: s === "solid" ? undefined : s })}
                className={`flex-1 h-8 text-[10px] border rounded cursor-pointer
                  ${(el.borderStyle ?? "solid") === s ? "bg-accent text-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"}`}>
                {s === "solid" ? "Sólido" : s === "dashed" ? "Discontinuo" : "Punteado"}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <div className="text-[10px] text-muted-foreground mb-1">Modo de fusión</div>
          <select value={el.mixBlendMode ?? "normal"}
            onChange={(e) => updateElement(el.id, { mixBlendMode: e.target.value === "normal" ? undefined : e.target.value })}
            className="w-full px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs font-sans box-border">
            {[
              ["normal", "Normal"], ["multiply", "Multiplicar"], ["screen", "Pantalla"],
              ["overlay", "Superponer"], ["darken", "Oscurecer"], ["lighten", "Aclarar"],
              ["color-dodge", "Subexponer"], ["color-burn", "Sobreexponer"],
              ["hard-light", "Luz fuerte"], ["soft-light", "Luz suave"],
              ["difference", "Diferencia"], ["exclusion", "Exclusión"],
            ].map(([v, lbl]) => (
              <option key={v} value={v}>{lbl}</option>
            ))}
          </select>
        </div>
      </Section>
    </>
  );
}

function SvgFields({ el, updateElement }: {
  el: DesignElement; updateElement: (id: string, u: Partial<DesignElement>) => void;
}) {
  const saveSnapshot = useEditorStore((s) => s.saveSnapshot);
  const pathEditingId = useEditorStore((s) => s.pathEditingId);
  const setPathEditingId = useEditorStore((s) => s.setPathEditingId);
  const isPathEditing = pathEditingId === el.id;

  const svgContent = el.svgContent ?? "";
  const hasPaths = useMemo(() => svgHasPaths(svgContent), [svgContent]);
  const hasText = useMemo(() => svgHasTextElements(svgContent), [svgContent]);

  const [converting, setConverting] = useState(false);

  const handleConvertTextToPaths = useCallback(async () => {
    setConverting(true);
    saveSnapshot();
    const result = await textSvgToPaths(svgContent);
    if (result) {
      updateElement(el.id, { svgContent: result });
    }
    setConverting(false);
  }, [svgContent, el.id, updateElement, saveSnapshot]);

  return (
    <>
      {el.isSvgPath && (
        <Section title="Convertido de texto">
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded mb-2 leading-relaxed">
            Este SVG fue generado a partir de texto.
          </div>
        </Section>
      )}

      {hasText && !hasPaths && (
        <Section title="Texto en SVG">
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded mb-2 leading-relaxed">
            Este SVG contiene texto editable. Para editar paths, conviértelo a curvas primero.
          </div>
          <button onClick={handleConvertTextToPaths} disabled={converting}
            className="w-full h-9 px-3 border border-border rounded-lg cursor-pointer text-xs flex items-center justify-center gap-1.5 mb-2 bg-transparent text-muted-foreground hover:text-foreground disabled:opacity-50">
            {converting ? "Convirtiendo..." : "↻ Convertir texto a paths"}
          </button>
        </Section>
      )}

      {hasPaths && (
        <Section title="Edición visual">
          <button onClick={() => {
            if (isPathEditing) {
              setPathEditingId(null);
            } else {
              saveSnapshot();
              setPathEditingId(el.id);
            }
          }}
            className={`w-full h-9 px-3 border rounded-lg cursor-pointer text-xs flex items-center justify-center gap-1.5 mb-2 ${isPathEditing
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border bg-transparent text-muted-foreground hover:text-foreground"
              }`}>
            {isPathEditing ? "✕ Salir de edición de paths" : "✎ Editar paths en canvas"}
          </button>
          {isPathEditing && (
            <div className="text-[10px] text-muted-foreground leading-relaxed px-1">
              Arrastra los puntos ◻ y controles ◯ directamente en el canvas para modificar los subpaths.
            </div>
          )}
        </Section>
      )}

      {!isPathEditing && (
        <>
          <Section title="Máscara / Clip">
            <ClipFields el={el} updateElement={updateElement} />
          </Section>
          <Section title="Editar subpaths">
            <textarea value={svgContent}
              className="w-full px-2 py-1.5 border border-border rounded bg-background text-foreground font-mono text-[11px] box-border min-h-[180px] resize-vertical"
              onChange={(e) => updateElement(el.id, { svgContent: e.target.value })}
              onFocus={() => saveSnapshot()} />
            <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Edita el código SVG directamente.
            </div>
          </Section>
          <Section title="Propiedades">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <div className="text-[11px] text-muted-foreground font-medium mb-1">Relleno</div>
                <input type="color" value={el.backgroundColor ?? "#000000"}
                  className="w-full px-2 py-1 border border-border rounded bg-background h-8 box-border"
                  onChange={(e) => updateElement(el.id, { backgroundColor: e.target.value })} />
              </div>
              <NumField label="Opacidad" value={el.opacity}
                onChange={(v) => updateElement(el.id, { opacity: Math.max(0, Math.min(1, v)) })} min={0} max={1} step={0.05} />
            </div>
          </Section>
        </>
      )}
    </>
  );
}

function ClipFields({ el, updateElement }: {
  el: DesignElement; updateElement: (id: string, u: Partial<DesignElement>) => void;
}) {
  const mask = el.clipMask;
  const hasMask = !!mask;
  const toggleMask = () => {
    if (hasMask) { updateElement(el.id, { clipMask: undefined }); }
    else { updateElement(el.id, { clipMask: { type: "circle", value: "50%" } }); }
  };
  const updateMask = (patch: Partial<NonNullable<DesignElement["clipMask"]>>) => {
    if (!mask) return;
    updateElement(el.id, { clipMask: { ...mask, ...patch } });
  };
  const maskTypes = [
    { id: "circle" as const, label: "Circulo", default: "50%" },
    { id: "ellipse" as const, label: "Elipse", default: "50% 50%" },
    { id: "polygon" as const, label: "Poligono", default: "50% 0%, 100% 50%, 50% 100%, 0% 50%" },
    { id: "inset" as const, label: "Inset", default: "10%" },
    { id: "path" as const, label: "Path", default: "" },
  ];
  return (
    <Section title="Mascara / Clip">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground">Recortar forma del elemento</span>
        <button onClick={toggleMask} className={`text-[10px] px-2 py-1 rounded border cursor-pointer leading-none ${hasMask ? "bg-accent text-foreground border-primary" : "bg-transparent text-muted-foreground border-border"}`}>
          {hasMask ? "Quitar mascara" : "Anadir mascara"}
        </button>
      </div>
      {hasMask && mask && (
        <>
          <div className="flex gap-1 flex-wrap mb-2">
            {maskTypes.map((mt) => (
              <button key={mt.id} onClick={() => updateMask({ type: mt.id, value: mt.default })}
                className={`text-[9px] px-2 py-1 rounded border cursor-pointer ${mask.type === mt.id ? "bg-accent border-primary" : "bg-transparent border-border text-muted-foreground"}`}>
                {mt.label}
              </button>
            ))}
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Valor CSS</div>
            <input value={mask.value} onChange={(e) => updateMask({ value: e.target.value })}
              placeholder={maskTypes.find((mt) => mt.id === mask.type)?.default}
              className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-[10px] font-mono box-border" />
          </div>
          <div className="text-[9px] text-muted-foreground mt-1 leading-relaxed">
            {mask.type === "circle" && "Ej: 50% (circulo perfecto), 30% (mas pequeno)"}
            {mask.type === "ellipse" && "Ej: 50% 50% (circulo), 25% 50% (ovalado)"}
            {mask.type === "polygon" && "Ej: 50% 0%, 100% 100%, 0% 100% (triangulo)"}
            {mask.type === "inset" && "Ej: 10% (10% de cada lado), 20% 10% (20% top/bottom, 10% left/right)"}
            {mask.type === "path" && "SVG path data URL. Ej: M0,0 L100,0 L50,100 Z"}
          </div>
        </>
      )}
    </Section>
  );
}
