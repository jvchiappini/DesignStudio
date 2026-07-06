import { useRef, useCallback, useState, useEffect } from "react";
import { useEditorStore } from "./editorStore";
import { generateJsx } from "./jsxSerializer";
import { parseJsx } from "./jsxParser";
import { applyPatch } from "./ai/patchEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  /** If true, this message includes an applied JSX project */
  applied?: boolean;
}

// ─── System Prompt (SKILL.md–compliant) ──────────────────────────────────────

const SYSTEM_PROMPT = `You are Design Studio AI — an expert designer and code generator for the Design Studio editor.

## Your Role
You edit or create designs by responding with **only valid Design Studio JSX**. No explanations, no markdown fences, no extra text — just the JSX project.

## JSX Format

### Project Structure
\`\`\`
<project>
  <config pageGap="40" showGrid="false" snapToGrid="false" />
  <page width="1080" height="1920" bgColor="#0f0f1a">
    <!-- elements here -->
  </page>
</project>
\`\`\`

### Element Tags
- \`<text>\` — text elements
- \`<shape>\` — shapes (rect, circle, triangle, star, line)
- \`<image>\` — images (use picsum.photos for placeholders)
- \`<svg>\` — SVG vector elements

### Common Attributes (ALL elements)
id, x, y, w, h, rotation, opacity, zIndex, mixBlendMode, flipH, flipV, locked, hidden, groupId,
shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY

### <text> Attributes
fontSize, fontFamily, fontWeight, fontStyle, color, textAlign, verticalAlign,
letterSpacing, lineHeight, wordSpacing, textIndent, textTransform, textDecoration,
fontVariant, charScaleX, charScaleY, textStrokeColor, textStrokeWidth, textBgColor,
textGradient, textGradientColors, textShadows (JSON array), textPaddingLeft/Right/Top/Bottom,
textOutlineColor, textOutlineWidth, textOverflow

### <shape> Attributes
shapeKind (rect|circle|triangle|star|line), backgroundColor, borderColor, borderWidth,
borderStyle, borderRadius, borderRadiusTL/TR/BR/BL, fillGradient, fillGradientColors

### <image> Attributes
src, imgBrightness, imgContrast, imgSaturation, imgBlur, cropX, cropY, cropW, cropH

### <svg> Attributes
svgContent (full <svg xmlns="http://www.w3.org/2000/svg" viewBox="...">...</svg>)

### Background (pages and shapes)
bgStyle — CSS background value with support for gradients, patterns, and images:
- Linear: "linear-gradient(135deg, #667eea, #764ba2)"
- Radial: "radial-gradient(circle at center, #f093fb, #f5576c)"
- Pattern: "repeating-conic-gradient(#1a1a2e 0% 25%, #16213e 0% 50%) 30px 30px"
- Multi-layer: "gradient, url(imageUrl) center/cover no-repeat"

## Rules
1. Output ONLY valid JSX — no other text, no explanations, no markdown.
2. ALWAYS preserve element IDs from the current project when editing. Only generate new IDs for NEW elements.
3. Images with src="@base64_img_XXXX" are user uploads — keep them as-is (don't modify src).
4. Use Google Fonts: Poppins, Oswald, Playfair Display, Inter, Montserrat, Roboto.
5. Use picsum.photos for placeholder images: https://picsum.photos/WIDTH/HEIGHT
6. Minimum font size: 10px. Minimum element size: 20px.
7. Always add at least 40px margin from page edges.
8. Use double quotes for ALL attribute values.
9. Self-close empty elements: <shape ... /> not <shape ...></shape>
10. OPTIMIZATION RULE (CRITICAL): When modifying an existing project, DO NOT return the entire <project>. Return ONLY a \`<patch>\` block with the changes to save tokens.

### Patch Format
To optimize token usage, you MUST reply with a <patch> block containing ONLY the changes needed.
\`\`\`xml
<patch>
  <!-- To edit an existing element, pass ONLY the attributes that change -->
  <edittext id="el_1" text="New Text" fontSize="50" color="#ff0000" />
  <editimage id="el_2" opacity="0.5" imgBrightness="150" />
  <editshape id="el_3" backgroundColor="#000000" />
  <editsvg id="el_4" opacity="0.8" />
  
  <!-- To delete an element -->
  <delete id="el_5" />
  
  <!-- To add new elements -->
  <add>
    <text id="new_50" x="100" y="200" w="200" h="50" text="Hello" />
  </add>
</patch>
\`\`\`
If you must create a new project from scratch, output \`<project>...</project>\`. Otherwise, use \`<patch>...</patch>\`!`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Try to extract a <project>...</project> or <patch>...</patch> block from LLM text output */
function extractJsx(text: string): { type: "project" | "patch"; content: string } | null {
  const patchStart = text.indexOf("<patch>");
  if (patchStart !== -1) {
    const patchEnd = text.lastIndexOf("</patch>");
    if (patchEnd !== -1) return { type: "patch", content: text.slice(patchStart, patchEnd + 8).trim() };
  }
  const projStart = text.indexOf("<project>");
  if (projStart !== -1) {
    const projEnd = text.lastIndexOf("</project>");
    if (projEnd !== -1) return { type: "project", content: text.slice(projStart, projEnd + 10).trim() };
  }
  return null;
}



// ─── Build the LLM context payload ───────────────────────────────────────────

function buildProjectContext(projectJsx: string): string {
  return `## Current Project\n\`\`\`jsx\n${projectJsx}\n\`\`\``;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatPanel() {
  const chatOpen = useEditorStore((s) => s.chatOpen);
  const chatWidth = useEditorStore((s) => s.chatWidth);
  const setChatWidth = useEditorStore((s) => s.setChatWidth);
  const setChatOpen = useEditorStore((s) => s.setChatOpen);
  const projectName = useEditorStore((s) => s.projectName);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("ds_openai_key") || "");
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState<"openai" | "openrouter">(() =>
    (localStorage.getItem("ds_ai_provider") as any) || "openai"
  );
  const [model, setModel] = useState(() =>
    localStorage.getItem("ds_ai_model") || "gpt-4o-mini"
  );

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Apply incoming JSX to the store ────────────────────────────────────────

  const applyJsx = useCallback((jsx: string): boolean => {
    // We need to delegate to the store's loadProject-like logic.
    // We use the same parseJsx approach but through a store setState.
    try {
      const store = useEditorStore.getState();
      const result = parseJsx(jsx);
      if (!result.ok) {
        console.error("parseJsx error:", result.error);
        return false;
      }
      const { elements, pages, pageGap, guides, config } = result.data;

      // Restore base64 image data from current session
      for (const el of elements) {
        if (el.type === "image" && el.src && el.src.startsWith("@base64_img_")) {
          const oldEl = store.elements.find((e) => e.id === el.id);
          if (oldEl && oldEl.type === "image" && oldEl.src) {
            el.src = oldEl.src;
          }
        }
      }

      const first = pages[0];
      const patch: Record<string, any> = {
        elements,
        pages,
        pageGap,
        guides,
        activePageIndex: 0,
        selectedId: null,
        selectedIds: [],
        history: store.history,
        historyIndex: store.historyIndex,
        canvasWidth: first.width,
        canvasHeight: first.height,
        canvasBgColor: first.bgColor,
      };
      if (config.showGrid !== undefined) patch.showGrid = config.showGrid === "true";
      if (config.snapToGrid !== undefined) patch.snapToGrid = config.snapToGrid === "true";
      if (config.showRulers !== undefined) patch.showRulers = config.showRulers === "true";
      if (config.guideMode) patch.guideMode = config.guideMode;
      if (config.gridSize) patch.gridSize = parseInt(config.gridSize, 10);
      if (config.zoom) patch.zoom = parseFloat(config.zoom);
      useEditorStore.setState(patch);
      return true;
    } catch (e) {
      console.error("applyJsx error:", e);
      return false;
    }
  }, []);

  // ── Get current project as JSX for LLM context ─────────────────────────────

  const getCurrentJsx = useCallback((): string => {
    try {
      const state = useEditorStore.getState();
      return generateJsx(state.elements, state.pages, state.pageGap, state, true);
    } catch {
      return "(project JSX not available)";
    }
  }, []);

  // ── Call LLM API ───────────────────────────────────────────────────────────

  const callLLM = useCallback(async (userMessage: string): Promise<string> => {
    if (!apiKey.trim()) {
      return "⚠️ Por favor configura tu API key en el botón ⚙️ arriba.";
    }

    const projectJsx = getCurrentJsx();
    const contextBlock = buildProjectContext(projectJsx);

    const messages_payload = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `${contextBlock}\n\n## Request\n${userMessage}` },
    ];

    let endpoint = "";
    let headers: Record<string, string> = { "Content-Type": "application/json" };
    let body: Record<string, any> = {};

    if (provider === "openai") {
      endpoint = "https://api.openai.com/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      body = { model, messages: messages_payload, temperature: 0.7, max_tokens: 8192 };
    } else {
      // openrouter
      endpoint = "https://openrouter.ai/api/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["HTTP-Referer"] = window.location.origin;
      headers["X-Title"] = "Design Studio";
      body = { model, messages: messages_payload, temperature: 0.7, max_tokens: 8192 };
    }

    const resp = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`API error ${resp.status}: ${errText.slice(0, 200)}`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? "";
  }, [apiKey, provider, model, getCurrentJsx]);

  // ── Send message ───────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const rawResponse = await callLLM(text);
      const extracted = extractJsx(rawResponse);

      if (extracted) {
        let applied = false;
        if (extracted.type === "patch") {
          const valid = applyPatch(extracted.content);
          applied = valid.ok;
          if (!valid.ok) console.error("Patch error:", valid.error);
        } else {
          // It's a full project
          const valid = parseJsx(extracted.content);
          if (valid.ok) {
            applied = applyJsx(extracted.content);
          } else {
            console.error("Parse error:", valid.error);
          }
        }

        const label = extracted.type === "patch" ? "Parche aplicado" : "Diseño aplicado al canvas.";

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: applied
              ? `✅ ${label}\n\n<details>\n<summary>Ver JSX generado</summary>\n\n\`\`\`jsx\n${extracted.content.slice(0, 600)}${extracted.content.length > 600 ? "\n... (truncado)" : ""}\n\`\`\`\n</details>`
              : `⚠️ El JSX/Patch fue generado pero no se pudo aplicar.\n\n\`\`\`jsx\n${extracted.content}\n\`\`\``,
            applied,
          },
        ]);
      } else if (rawResponse.trim()) {
        // LLM responded with text (e.g. question, clarification)
        setMessages((prev) => [...prev, { role: "assistant", text: rawResponse }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "⚠️ El LLM no devolvió ningún contenido." },
        ]);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `❌ Error: ${e?.message || String(e)}` },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, callLLM, applyJsx]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ── Save settings ──────────────────────────────────────────────────────────

  const saveSettings = useCallback(() => {
    localStorage.setItem("ds_openai_key", apiKey);
    localStorage.setItem("ds_ai_provider", provider);
    localStorage.setItem("ds_ai_model", model);
    setShowSettings(false);
  }, [apiKey, provider, model]);

  // ── Resize handle ──────────────────────────────────────────────────────────

  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startW: chatWidth };
    const move = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = dragRef.current.startX - ev.clientX;
      setChatWidth(dragRef.current.startW + dx);
    };
    const up = () => {
      dragRef.current = null;
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }, [chatWidth, setChatWidth]);

  if (!chatOpen) return null;

  return (
    <div
      className="flex-shrink-0 border-l border-border bg-background flex flex-col relative"
      style={{ width: chatWidth }}
    >
      {/* Resize handle */}
      <div
        onPointerDown={handleResizeStart}
        style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
          cursor: "ew-resize", zIndex: 10,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Chat IA</span>
          {loading && (
            <span className="text-[9px] text-muted-foreground animate-pulse">pensando...</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="border border-border bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-[10px] px-1.5 py-0.5 rounded"
            title="Configurar API key"
          >⚙️</button>
          <button
            onClick={() => setMessages([])}
            className="border border-border bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-[10px] px-1.5 py-0.5 rounded"
            title="Limpiar chat"
          >🗑</button>
          <button
            onClick={() => setChatOpen(false)}
            className="border-none bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-xs leading-none px-1"
          >✕</button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-b border-border px-3 py-3 space-y-2 bg-muted/30">
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Configuración IA</div>

          <div>
            <label className="text-[10px] text-muted-foreground block mb-0.5">Proveedor</label>
            <div className="flex gap-1">
              {(["openai", "openrouter"] as const).map((p) => (
                <button key={p} onClick={() => setProvider(p)}
                  className={`flex-1 h-6 rounded text-[10px] border cursor-pointer ${provider === p
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                    }`}>
                  {p === "openai" ? "OpenAI" : "OpenRouter"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground block mb-0.5">Modelo</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={provider === "openai" ? "gpt-4o-mini" : "openai/gpt-4o-mini"}
              className="w-full h-7 px-2 rounded border border-border bg-background text-foreground text-[10px] outline-none"
            />
            <div className="text-[9px] text-muted-foreground mt-0.5">
              {provider === "openai"
                ? "gpt-4o-mini · gpt-4o · gpt-4-turbo"
                : "openai/gpt-4o-mini · anthropic/claude-3-haiku · google/gemini-flash-1.5"}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground block mb-0.5">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === "openai" ? "sk-..." : "sk-or-..."}
              className="w-full h-7 px-2 rounded border border-border bg-background text-foreground text-[10px] outline-none"
            />
          </div>

          <button
            onClick={saveSettings}
            className="w-full h-7 rounded bg-primary text-primary-foreground text-[10px] font-medium border-none cursor-pointer"
          >
            Guardar
          </button>
        </div>
      )}

      {/* Project name indicator */}
      <div className="px-3 py-1 border-b border-border">
        <div className="text-[9px] text-muted-foreground truncate">
          📄 {projectName} · {useEditorStore.getState().elements.length} elementos
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="text-[10px] text-muted-foreground text-center py-8 space-y-2">
            <div className="text-2xl">🎨</div>
            <div>Describe el diseño que quieres crear o editar.</div>
            <div className="text-[9px] opacity-60">El LLM verá el proyecto actual y generará JSX.</div>
            {!apiKey && (
              <div className="text-[9px] text-destructive mt-2">
                ⚠️ Configura tu API key en ⚙️
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[90%] px-2.5 py-1.5 rounded-lg text-[10px] leading-relaxed whitespace-pre-wrap break-words ${m.role === "user"
              ? "bg-primary text-primary-foreground"
              : m.applied
                ? "bg-emerald-950/40 border border-emerald-800/40 text-foreground"
                : "bg-accent text-foreground"
              }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-accent text-foreground px-3 py-2 rounded-lg text-[10px]">
              <span className="animate-pulse">●●●</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-2 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe el cambio… (Enter para enviar, Shift+Enter para nueva línea)"
          rows={2}
          className="flex-1 px-2 py-1.5 border border-border rounded bg-background text-foreground text-[10px] outline-none box-border resize-none leading-relaxed"
          style={{ minHeight: 48, maxHeight: 120 }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className={`px-3 py-1.5 border-none rounded cursor-pointer text-[10px] leading-none font-medium whitespace-nowrap h-8 ${loading || !input.trim()
            ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
            : "bg-primary text-primary-foreground"
            }`}
        >
          {loading ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
