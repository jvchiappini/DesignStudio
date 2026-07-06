import { useRef, useCallback, useState, useEffect } from "react";
import { useEditorStore } from "./editorStore";
import { allTools, buildAiContext } from "./ai";

export function ChatPanel() {
  const chatOpen = useEditorStore((s) => s.chatOpen);
  const chatWidth = useEditorStore((s) => s.chatWidth);
  const setChatWidth = useEditorStore((s) => s.setChatWidth);
  const setChatOpen = useEditorStore((s) => s.setChatOpen);
  const store = useEditorStore;

  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [showTools, setShowTools] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /** Execute an AI tool by name with given params */
  const executeTool = useCallback(async (toolName: string, toolParams: Record<string, unknown>) => {
    const tool = allTools.find((t) => t.name === toolName);
    if (!tool) return `Error: Tool "${toolName}" not found.`;

    const s = store.getState();
    const ctx = buildAiContext({
      elements: s.elements,
      pages: s.pages,
      activePageIndex: s.activePageIndex,
      updateElement: s.updateElement,
      selectElement: s.selectElement,
      removeElement: s.removeElement,
      addElement: s.addElement,
      addText: s.addText,
      addShape: s.addShape as (kind: string, overrides?: Partial<any>) => void,
      setCropPreview: s.setCropPreview,
    });

    const result = await tool.handler(toolParams, ctx);
    return result.message;
  }, [store]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");

    // Simple AI: parse command-like patterns to call tools
    const lower = text.toLowerCase();
    let response = "";

    if (lower === "estado" || lower === "canvas" || lower === "estado del canvas") {
      response = await executeTool("get_canvas_state", {});
    } else if (lower === "tools" || lower === "herramientas" || lower === "tool list") {
      response = await executeTool("list_available_tools", {});
    } else if (lower.startsWith("seleccionar ") || lower.startsWith("select ")) {
      const id = text.split(" ").pop() || "";
      response = await executeTool("select_element", { elementId: id });
    } else if (lower.startsWith("eliminar ") || lower.startsWith("delete ")) {
      const id = text.split(" ").pop() || "";
      response = await executeTool("delete_element", { elementId: id });
    } else if (lower.startsWith("mover ") || lower.startsWith("move ")) {
      const parts = text.split(" ");
      // move el_id x y
      if (parts.length >= 4) {
        response = await executeTool("move_element", { elementId: parts[1], x: Number(parts[2]), y: Number(parts[3]) });
      } else {
        response = "Formato: mover [id] [x] [y]";
      }
    } else if (lower.startsWith("texto ") || lower.startsWith("text ")) {
      const rest = text.substring(text.indexOf(" ") + 1);
      // Simple: create text with content
      response = `Intentando crear texto: "${rest}". Usa formato: crear_texto contenido|x|y|tamaño`;
    } else {
      response = [
        `Recibido: "${text}".`,
        "",
        "Comandos disponibles:",
        "- estado / canvas - ver estado del canvas",
        "- tools / herramientas - listar herramientas disponibles",
        "- seleccionar [id] - seleccionar elemento",
        "- eliminar [id] - eliminar elemento",
        "- mover [id] [x] [y] - mover elemento",
        "- texto [contenido] - crear texto (usar formato avanzado para parametros)",
        "",
        "Los comandos ejecutan las AI tools internamente.",
      ].join("\n");
    }

    setMessages((prev) => [...prev, { role: "assistant", text: response }]);
  }, [input, executeTool]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

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
        <span className="text-xs font-medium text-foreground">Chat IA</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowTools(!showTools)}
            className="border-none bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-[9px] px-1.5 py-0.5 rounded border border-border">
            {showTools ? "Ocultar tools" : "Tools"}
          </button>
          <button onClick={() => setChatOpen(false)}
            className="border-none bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-xs leading-none px-1">
            ✕
          </button>
        </div>
      </div>

      {/* Tools panel (collapsible) */}
      {showTools && (
        <div className="border-b border-border px-3 py-2 max-h-[200px] overflow-y-auto">
          <div className="text-[10px] text-muted-foreground font-medium mb-1">Herramientas IA ({allTools.length})</div>
          {allTools.map((tool) => (
            <div key={tool.name} className="mb-1 last:mb-0">
              <button onClick={async () => {
                const result = await executeTool(tool.name, {});
                setMessages((prev) => [...prev, { role: "assistant", text: result }]);
              }}
                className="w-full text-left px-2 py-1 rounded bg-muted hover:bg-accent text-[9px] text-muted-foreground hover:text-foreground border-none cursor-pointer transition-colors">
                <span className="font-mono text-[10px] text-primary">{tool.name}</span>
                <span className="ml-1">{tool.description.slice(0, 60)}...</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="text-[10px] text-muted-foreground text-center py-8">
            Haz una pregunta sobre tu diseño.<br />
            Escribe <span className="font-mono text-primary">tools</span> para ver comandos.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-2.5 py-1.5 rounded-lg text-xs leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-foreground"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-2 flex gap-2">
        <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs outline-none box-border" />
        <button onClick={handleSend}
          className="px-3 py-1.5 border-none rounded bg-primary text-primary-foreground cursor-pointer text-xs leading-none font-medium whitespace-nowrap">
          Enviar
        </button>
      </div>
    </div>
  );
}
