/**
 * ChatPanel.tsx
 *
 * AI chat sidebar — pure UI component.
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
import { Icon } from "../ui/Icons";

interface ChatMessage {
  role: "user" | "assistant" | "tool_call" | "tool_result";
  text: string;
  applied?: boolean;
  toolName?: string;
  args?: string;
  ok?: boolean;
  imageUrl?: string;
}

const LS_API_KEY = "ds_openai_key";
const LS_PROVIDER = "ds_ai_provider";
const LS_MODEL = "ds_ai_model";

export function ChatPanel() {
  const chatOpen = useEditorStore((s) => s.chatOpen);
  const chatWidth = useEditorStore((s) => s.chatWidth);
  const setChatWidth = useEditorStore((s) => s.setChatWidth);
  const setChatOpen = useEditorStore((s) => s.setChatOpen);
  const projectName = useEditorStore((s) => s.projectName);
  const elementCount = useEditorStore((s) => s.elements.length);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_API_KEY) || "");
  const [provider, setProvider] = useState<LlmProvider>(
    () => (localStorage.getItem(LS_PROVIDER) as LlmProvider | null) ?? "openai"
  );
  const [model, setModel] = useState(
    () => localStorage.getItem(LS_MODEL) || PROVIDER_DEFAULT_MODELS[provider]
  );

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setModel(PROVIDER_DEFAULT_MODELS[provider]);
  }, [provider]);

  const getCurrentJsx = useCallback((): string => {
    try {
      const state = useEditorStore.getState();
      return generateJsx(state.elements, state.pages, state.pageGap, state, true);
    } catch {
      return "(project JSX not available)";
    }
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!apiKey.trim()) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Por favor configura tu API key en el botón de configuración arriba." },
      ]);
      return;
    }

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const toolDefs = allTools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters as Record<string, unknown>,
    }));

    const toolMap = new Map(allTools.map((t) => [t.name, t]));

    try {
      const projectJsx = getCurrentJsx();
      const contextBlock = buildProjectContext(projectJsx);
      const store = useEditorStore.getState();
      const aiCtx = buildAiContext(store);

      const msgs: LlmMessage[] = [
        { role: "system", content: DS_SYSTEM_PROMPT },
        { role: "user", content: `${contextBlock}\n\n## Request\n${text}` },
      ];

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
          const assistantMsg: LlmMessage = {
            role: "assistant",
            content: resp.content || "",
            tool_calls: resp.toolCalls.map((tc) => ({ id: tc.id, name: tc.name, arguments: tc.arguments })),
          };
          if ((resp as any)._rawParts) {
            (assistantMsg as any)._rawParts = (resp as any)._rawParts;
          }
          msgs.push(assistantMsg);

          for (const tc of resp.toolCalls) {
            setMessages((prev) => [
              ...prev,
              {
                role: "tool_call",
                text: `${tc.name}`,
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
                { role: "tool_result", text: `Tool "${tc.name}" not found`, ok: false },
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
                { role: "tool_result", text: `Error executing "${tc.name}"`, ok: false },
              ]);
            }
          }

          if (controller.signal.aborted) {
            setMessages((prev) => [...prev, { role: "assistant", text: "⏹️ Generación detenida." }]);
            break;
          }

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
        } else {
          finalContent = resp.content;
          break;
        }
      }

      const extracted = extractDsResponse(finalContent);

      if (extracted) {
        let applied = false;

        if (extracted.type === "patch") {
          const result = applyPatch(extracted.content);
          applied = result.ok;
          if (!result.ok) console.error("[ChatPanel] Patch error:", result.error);
        } else {
          const result = await applyJsxToStore(extracted.content);
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

  const saveSettings = useCallback(() => {
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_PROVIDER, provider);
    localStorage.setItem(LS_MODEL, model);
    setShowSettings(false);
  }, [apiKey, provider, model]);

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

  if (!chatOpen) return null;

  return (
    <div
      className="flex-shrink-0 border-l border-border bg-card flex flex-col relative"
      style={{ width: chatWidth }}
    >
      {/* Resize handle */}
      <div
        onPointerDown={handleResizeStart}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize z-10 hover:bg-primary/30 transition-colors"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            <Icon name="chat" size={14} />
          </div>
          <span className="text-xs font-semibold text-foreground">Chat IA</span>
          {loading && (
            <span className="text-[10px] text-muted-foreground animate-pulse">pensando…</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowSettings(!showSettings)} className={`ds-icon-btn w-7 h-7 ${showSettings ? "active" : ""}`} title="Configurar API key">
            <Icon name="settings" size={15} />
          </button>
          <button onClick={() => setMessages([])} className="ds-icon-btn w-7 h-7" title="Limpiar chat">
            <Icon name="clear" size={15} />
          </button>
          <button onClick={() => setChatOpen(false)} className="ds-icon-btn w-7 h-7" title="Cerrar">
            <Icon name="close" size={15} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-b border-border px-3 py-3 space-y-3 bg-muted/20">
          <div className="ds-section-title">Configuración IA</div>

          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Proveedor</label>
            <div className="flex gap-2">
              {(["openai", "openrouter", "google"] as LlmProvider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`flex-1 h-7 rounded-lg text-[10px] border cursor-pointer transition-colors ${provider === p
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                >
                  {p === "openai" ? "OpenAI" : p === "openrouter" ? "OpenRouter" : "Google"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Modelo</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={PROVIDER_DEFAULT_MODELS[provider]}
              className="ds-input h-7 text-[11px]"
            />
            <div className="text-[9px] text-muted-foreground mt-1">
              {PROVIDER_MODEL_HINTS[provider]}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={PROVIDER_KEY_PLACEHOLDERS[provider]}
              className="ds-input h-7 text-[11px]"
            />
          </div>

          <button onClick={saveSettings} className="ds-btn-primary w-full h-8">
            Guardar
          </button>
        </div>
      )}

      {/* Project indicator */}
      <div className="px-3 py-1.5 border-b border-border bg-muted/10">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
          <Icon name="open" size={12} />
          <span className="truncate">{projectName}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{elementCount} elementos</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-10 px-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
              <Icon name="chat" size={24} />
            </div>
            <div className="text-xs text-foreground font-medium mb-1">Describe el diseño que quieres</div>
            <div className="text-[10px] text-muted-foreground max-w-[200px]">El LLM verá el proyecto actual y generará JSX o un parche.</div>
            {!apiKey && (
              <div className="mt-3 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[10px]">
                Configura tu API key en <Icon name="settings" size={10} className="inline" />
              </div>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "tool_call" && (
              <div className="max-w-[90%] px-3 py-2 rounded-xl text-[10px] leading-relaxed break-words bg-blue-950/20 border border-blue-800/20 text-muted-foreground font-mono">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon name="settings" size={12} className="text-blue-400" />
                  <span className="text-blue-300 font-semibold">{m.toolName}</span>
                </div>
                <pre className="text-[9px] text-blue-200/70 whitespace-pre-wrap">{m.args?.slice(0, 300)}{m.args && m.args.length > 300 ? "…" : ""}</pre>
              </div>
            )}
            {m.role === "tool_result" && (
              <div className={`max-w-[90%] px-3 py-2 rounded-xl text-[10px] leading-relaxed break-words font-mono border ${m.ok !== false
                ? "bg-emerald-950/20 border-emerald-800/20 text-emerald-300"
                : "bg-red-950/20 border-red-800/20 text-red-300"
                }`}>
                <span className="opacity-80 flex items-center gap-1">
                  <Icon name={m.ok !== false ? "check" : "close"} size={10} />
                  {m.text}
                </span>
              </div>
            )}
            {m.role === "user" && (
              <div className="max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap break-words bg-primary text-primary-foreground shadow-sm">
                {m.text}
                {m.imageUrl && (
                  <img src={m.imageUrl} alt="preview" className="mt-2 w-full h-auto rounded-lg border border-white/20" />
                )}
              </div>
            )}
            {m.role === "assistant" && (
              <div
                className={`max-w-[92%] px-3 py-2.5 rounded-xl text-[11px] leading-relaxed break-words prose prose-invert prose-xs border ${m.applied
                  ? "bg-emerald-950/20 border-emerald-800/20 text-foreground"
                  : "bg-muted/30 border-border text-foreground"
                  }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const isInline = !className;
                      if (isInline) {
                        return <code className="bg-background/60 px-1 rounded text-[10px]" {...props}>{children}</code>;
                      }
                      return (
                        <pre className="bg-background/60 p-2 rounded-lg text-[10px] overflow-x-auto my-1 border border-border">
                          <code className={className} {...props}>{children}</code>
                        </pre>
                      );
                    },
                    a({ href, children }) {
                      return <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-primary">{children}</a>;
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
                      return <blockquote className="border-l-2 border-primary/40 pl-2 my-1 text-muted-foreground italic">{children}</blockquote>;
                    },
                    hr() {
                      return <hr className="border-border my-2" />;
                    },
                    table({ children }) {
                      return <table className="border-collapse w-full text-[10px] my-1">{children}</table>;
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
            <div className="bg-muted/50 text-foreground px-3 py-2 rounded-xl text-[10px] flex items-center gap-1.5 border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex gap-2 items-end bg-card">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe el cambio…"
          rows={2}
          className="flex-1 px-3 py-2 border border-border rounded-xl bg-background text-foreground text-xs outline-none box-border resize-none leading-relaxed focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
          style={{ minHeight: 48, maxHeight: 120 }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className={`w-9 h-9 flex items-center justify-center rounded-xl border-none cursor-pointer transition-all ${loading || !input.trim()
            ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
            }`}
        >
          <Icon name="send" size={16} />
        </button>
        {loading && (
          <button
            onClick={() => abortRef.current?.abort()}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-destructive/40 cursor-pointer bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            title="Detener"
          >
            <Icon name="stop" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
