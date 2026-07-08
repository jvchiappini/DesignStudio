/**
 * ChatPanel.tsx
 *
 * AI chat sidebar — pure UI component.
 *
 * All AI logic (system prompt, LLM client, JSX application, patch engine) has
 * been moved to src/editor/ai/. This component is responsible only for:
 *   - Rendering the chat thread and input area
 *   - Managing local UI state (messages, loading flag, settings visibility)
 *   - Reading/writing the user's API settings from localStorage
 *   - Delegating all LLM & store operations to the ai/ module functions
 */

import { useRef, useCallback, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEditorStore } from "../../store/editorStore";
import { generateJsx } from "../../utils/jsxSerializer";
import {
  DS_SYSTEM_PROMPT,
  callLlm,
  extractDsResponse,
  buildProjectContext,
  buildAiContext,
  applyJsxToStore,
  applyPatch,
  PROVIDER_MODEL_HINTS,
  PROVIDER_DEFAULT_MODELS,
  PROVIDER_KEY_PLACEHOLDERS,
  allTools,
  takePreview,
} from "../../ai";
import type { LlmProvider, LlmMessage, LlmResponse } from "../../ai";

// ─── Local types ──────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant" | "tool_call" | "tool_result";
  text: string;
  applied?: boolean;
  toolName?: string;
  args?: string;
  ok?: boolean;
  imageUrl?: string;
}

// ─── localStorage keys ────────────────────────────────────────────────────────

const LS_API_KEY = "ds_openai_key";
const LS_PROVIDER = "ds_ai_provider";
const LS_MODEL = "ds_ai_model";

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatPanel() {
  // ── Store subscriptions ────────────────────────────────────────────────────
  const chatOpen = useEditorStore((s) => s.chatOpen);
  const chatWidth = useEditorStore((s) => s.chatWidth);
  const setChatWidth = useEditorStore((s) => s.setChatWidth);
  const setChatOpen = useEditorStore((s) => s.setChatOpen);
  const projectName = useEditorStore((s) => s.projectName);
  const elementCount = useEditorStore((s) => s.elements.length);

  // ── Local state ────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings — persisted to localStorage
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_API_KEY) || "");
  const [provider, setProvider] = useState<LlmProvider>(
    () => (localStorage.getItem(LS_PROVIDER) as LlmProvider | null) ?? "openai"
  );
  const [model, setModel] = useState(
    () => localStorage.getItem(LS_MODEL) || PROVIDER_DEFAULT_MODELS[provider]
  );

  // ── Refs ───────────────────────────────────────────────────────────────────
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync model when provider changes
  useEffect(() => {
    setModel(PROVIDER_DEFAULT_MODELS[provider]);
  }, [provider]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Serialize the current project as LLM-safe JSX (base64 → placeholders) */
  const getCurrentJsx = useCallback((): string => {
    try {
      const state = useEditorStore.getState();
      return generateJsx(state.elements, state.pages, state.pageGap, state, true);
    } catch {
      return "(project JSX not available)";
    }
  }, []);

  // ── Send message ───────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!apiKey.trim()) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Por favor configura tu API key en el botón ⚙️ arriba." },
      ]);
      return;
    }

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    // Create abort controller so the user can stop
    const controller = new AbortController();
    abortRef.current = controller;

    // Build tool definitions for the LLM
    const toolDefs = allTools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters as Record<string, unknown>,
    }));

    // Build tool registry map for quick lookup
    const toolMap = new Map(allTools.map((t) => [t.name, t]));

    try {
      const projectJsx = getCurrentJsx();
      const contextBlock = buildProjectContext(projectJsx);
      const store = useEditorStore.getState();
      const aiCtx = buildAiContext(store);

      // Build conversation messages
      const msgs: LlmMessage[] = [
        { role: "system", content: DS_SYSTEM_PROMPT },
        { role: "user", content: `${contextBlock}\n\n## Request\n${text}` },
      ];

      // Tool-use loop: up to 10 rounds to prevent infinite loops
      let finalContent = "";
      for (let round = 0; round < 10; round++) {
        if (controller.signal.aborted) {
          setMessages((prev) => [...prev, { role: "assistant", text: "⏹️ Generación detenida." }]);
          break;
        }

        const resp: LlmResponse = await callLlm({
          provider,
          model,
          apiKey,
          messages: msgs,
          tools: toolDefs,
          signal: controller.signal,
        });

        if (resp.toolCalls && resp.toolCalls.length > 0) {
          // Add assistant message with tool_calls to history
          const assistantMsg: LlmMessage = {
            role: "assistant",
            content: resp.content || "",
            tool_calls: resp.toolCalls.map((tc) => ({ id: tc.id, name: tc.name, arguments: tc.arguments })),
          };
          // Preserve raw Google parts (thoughtSignature etc.) for subsequent requests
          if ((resp as any)._rawParts) {
            (assistantMsg as any)._rawParts = (resp as any)._rawParts;
          }
          msgs.push(assistantMsg);

          // Show tool calls to the user
          for (const tc of resp.toolCalls) {
            setMessages((prev) => [
              ...prev,
              {
                role: "tool_call",
                text: `🔧 ${tc.name}`,
                toolName: tc.name,
                args: tc.arguments,
              },
            ]);
          }

          for (const tc of resp.toolCalls) {
            const tool = toolMap.get(tc.name);
            if (!tool) {
              msgs.push({
                role: "tool",
                tool_call_id: tc.id,
                name: tc.name,
                content: `Error: Tool "${tc.name}" not found.`,
              } as LlmMessage);
              setMessages((prev) => [
                ...prev,
                { role: "tool_result", text: `❌ Tool "${tc.name}" not found`, ok: false },
              ]);
              continue;
            }

            try {
              const params = JSON.parse(tc.arguments);
              const result = await tool.handler(params, aiCtx);
              msgs.push({
                role: "tool",
                tool_call_id: tc.id,
                name: tc.name,
                content: JSON.stringify({ message: result.message, data: result.data }),
              } as LlmMessage);
              setMessages((prev) => [
                ...prev,
                {
                  role: "tool_result",
                  text: result.message.slice(0, 500),
                  ok: result.success,
                },
              ]);
            } catch {
              msgs.push({
                role: "tool",
                tool_call_id: tc.id,
                name: tc.name,
                content: `Error executing tool "${tc.name}".`,
              } as LlmMessage);
              setMessages((prev) => [
                ...prev,
                { role: "tool_result", text: `❌ Error executing "${tc.name}"`, ok: false },
              ]);
            }
          }

          // Stop early if user cancelled
          if (controller.signal.aborted) {
            setMessages((prev) => [...prev, { role: "assistant", text: "⏹️ Generación detenida." }]);
            break;
          }

          // After executing tools, check if there's a captured preview to inject
          const previewUrl = takePreview();
          if (previewUrl) {
            msgs.push({
              role: "user",
              content: [
                { type: "text", text: "Aquí está un render actual del canvas en alta fidelidad. Analízalo al EXTREMO DETALLE: comprueba explícitamente si hay texto recortado por cajas pequeñas, si hay solapamientos indeseados, y si los elementos respetan las guías. Si ves problemas visuales, usa inmediatamente un XML de <patch> para ampliar el w/h de las cajas de texto o ajustar la posición." },
                { type: "image_url", image_url: { url: previewUrl, detail: "high" } },
              ],
            });
            setMessages((prev) => [
              ...prev,
              { role: "user", text: "🖼️ (Auto-preview enviado para revisión visual)", imageUrl: previewUrl },
            ]);
          }
          // Continue loop — LLM will see tool results + optional image
        } else {
          finalContent = resp.content;
          break;
        }
      }

      // Parse and apply the final response
      const extracted = extractDsResponse(finalContent);

      if (extracted) {
        let applied = false;

        if (extracted.type === "patch") {
          const result = applyPatch(extracted.content);
          applied = result.ok;
          if (!result.ok) console.error("[ChatPanel] Patch error:", result.error);
        } else {
          const result = applyJsxToStore(extracted.content);
          applied = result.ok;
          if (!result.ok) console.error("[ChatPanel] JSX apply error:", result.error);
        }

        const label = extracted.type === "patch" ? "Parche aplicado" : "Diseño aplicado al canvas.";

        let msgText = "";
        if (extracted.message) {
          msgText += extracted.message + "\n\n";
        }

        if (applied) {
          msgText += `✅ ${label}\n\n<details>\n<summary>Ver JSX generado</summary>\n\n\`\`\`jsx\n${extracted.content.slice(0, 600)}${extracted.content.length > 600 ? "\n... (truncado)" : ""}\n\`\`\`\n</details>`;
        } else {
          msgText += `⚠️ El JSX/Patch fue generado pero no se pudo aplicar.\n\n\`\`\`jsx\n${extracted.content}\n\`\`\``;
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", applied, text: msgText },
        ]);
      } else if (finalContent.trim()) {
        setMessages((prev) => [...prev, { role: "assistant", text: finalContent }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "⚠️ El LLM no devolvió ningún contenido." },
        ]);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if ((e as any)?.name === "AbortError") {
        setMessages((prev) => [...prev, { role: "assistant", text: "⏹️ Generación detenida." }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", text: `❌ Error: ${msg}` }]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [input, loading, apiKey, provider, model, getCurrentJsx]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ── Persist settings ───────────────────────────────────────────────────────

  const saveSettings = useCallback(() => {
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_PROVIDER, provider);
    localStorage.setItem(LS_MODEL, model);
    setShowSettings(false);
  }, [apiKey, provider, model]);

  // ── Panel resize handle ────────────────────────────────────────────────────

  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      dragRef.current = { startX: e.clientX, startW: chatWidth };

      const onMove = (ev: PointerEvent) => {
        if (!dragRef.current) return;
        const dx = dragRef.current.startX - ev.clientX;
        setChatWidth(dragRef.current.startW + dx);
      };
      const onUp = () => {
        dragRef.current = null;
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [chatWidth, setChatWidth]
  );

  // ── Early return ───────────────────────────────────────────────────────────

  if (!chatOpen) return null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex-shrink-0 border-l border-border bg-background flex flex-col relative"
      style={{ width: chatWidth }}
    >
      {/* ── Resize handle ── */}
      <div
        onPointerDown={handleResizeStart}
        style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
          cursor: "ew-resize", zIndex: 10,
        }}
      />

      {/* ── Header ── */}
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

      {/* ── Settings panel ── */}
      {showSettings && (
        <div className="border-b border-border px-3 py-3 space-y-2 bg-muted/30">
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Configuración IA</div>

          {/* Provider selector */}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-0.5">Proveedor</label>
            <div className="flex gap-1">
              {(["openai", "openrouter", "google"] as LlmProvider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`flex-1 h-6 rounded text-[10px] border cursor-pointer ${provider === p
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {p === "openai" ? "OpenAI" : p === "openrouter" ? "OpenRouter" : "Google"}
                </button>
              ))}
            </div>
          </div>

          {/* Model input */}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-0.5">Modelo</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={PROVIDER_DEFAULT_MODELS[provider]}
              className="w-full h-7 px-2 rounded border border-border bg-background text-foreground text-[10px] outline-none"
            />
            <div className="text-[9px] text-muted-foreground mt-0.5">
              {PROVIDER_MODEL_HINTS[provider]}
            </div>
          </div>

          {/* API key input */}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-0.5">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={PROVIDER_KEY_PLACEHOLDERS[provider]}
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

      {/* ── Project indicator ── */}
      <div className="px-3 py-1 border-b border-border">
        <div className="text-[9px] text-muted-foreground truncate">
          📄 {projectName} · {elementCount} elementos
        </div>
      </div>

      {/* ── Messages ── */}
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
            {m.role === "tool_call" && (
              <div className="max-w-[90%] px-2.5 py-1.5 rounded-lg text-[10px] leading-relaxed break-words bg-blue-950/20 border border-blue-800/20 text-muted-foreground font-mono">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-blue-400">🔧</span>
                  <span className="text-blue-300 font-semibold">{m.toolName}</span>
                </div>
                <pre className="text-[9px] text-blue-200/70 whitespace-pre-wrap mt-0.5">{m.args?.slice(0, 300)}{m.args && m.args.length > 300 ? "…" : ""}</pre>
              </div>
            )}
            {m.role === "tool_result" && (
              <div className={`max-w-[90%] px-2.5 py-1.5 rounded-lg text-[10px] leading-relaxed break-words font-mono ${m.ok !== false
                ? "bg-emerald-950/20 border border-emerald-800/20 text-emerald-300"
                : "bg-red-950/20 border border-red-800/20 text-red-300"
                }`}>
                <span className="opacity-80">{m.ok !== false ? "✓" : "✗"} {m.text}</span>
              </div>
            )}
            {m.role === "user" && (
              <div className="max-w-[90%] px-2.5 py-1.5 rounded-lg text-[10px] leading-relaxed whitespace-pre-wrap break-words bg-primary text-primary-foreground">
                {m.text}
                {m.imageUrl && (
                  <img src={m.imageUrl} alt="preview" className="mt-2 w-full h-auto rounded border border-white/20" />
                )}
              </div>
            )}
            {m.role === "assistant" && (
              <div
                className={`max-w-[90%] px-2.5 py-1.5 rounded-lg text-[10px] leading-relaxed break-words prose prose-invert prose-xs ${m.applied
                  ? "bg-emerald-950/40 border border-emerald-800/40 text-foreground"
                  : "bg-accent text-foreground"
                  }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const isInline = !className;
                      if (isInline) {
                        return <code className="bg-muted/60 px-1 rounded text-[9px]" {...props}>{children}</code>;
                      }
                      return (
                        <pre className="bg-muted/60 p-2 rounded text-[9px] overflow-x-auto my-1">
                          <code className={className} {...props}>{children}</code>
                        </pre>
                      );
                    },
                    a({ href, children }) {
                      return <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">{children}</a>;
                    },
                    ul({ children }) {
                      return <ul className="list-disc pl-4 my-1">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal pl-4 my-1">{children}</ol>;
                    },
                    p({ children }) {
                      return <p className="my-1">{children}</p>;
                    },
                    h1({ children }) {
                      return <h1 className="text-xs font-bold my-1.5">{children}</h1>;
                    },
                    h2({ children }) {
                      return <h2 className="text-[11px] font-bold my-1">{children}</h2>;
                    },
                    h3({ children }) {
                      return <h3 className="text-[10px] font-bold my-1">{children}</h3>;
                    },
                    blockquote({ children }) {
                      return <blockquote className="border-l-2 border-muted-foreground/30 pl-2 my-1 text-muted-foreground italic">{children}</blockquote>;
                    },
                    hr() {
                      return <hr className="border-border my-2" />;
                    },
                    table({ children }) {
                      return <table className="border-collapse w-full text-[9px] my-1">{children}</table>;
                    },
                    th({ children }) {
                      return <th className="border border-border px-1.5 py-0.5 font-semibold bg-muted/30">{children}</th>;
                    },
                    td({ children }) {
                      return <td className="border border-border px-1.5 py-0.5">{children}</td>;
                    },
                  }}
                >
                  {m.text}
                </ReactMarkdown>
              </div>
            )}
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

      {/* ── Input ── */}
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
        {loading && (
          <button
            onClick={() => abortRef.current?.abort()}
            className="px-3 py-1.5 border border-red-500/40 rounded cursor-pointer text-[10px] leading-none font-medium whitespace-nowrap h-8 bg-red-950/20 text-red-400 hover:bg-red-950/40"
          >
            ⏹ Stop
          </button>
        )}
      </div>
    </div>
  );
}
