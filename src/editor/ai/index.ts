/**
 * src/editor/ai/index.ts
 *
 * Public API of the Design Studio AI module.
 *
 * Sub-modules:
 *   systemPrompt   — canonical LLM system prompt (single source of truth)
 *   llmClient      — provider-agnostic HTTP client (OpenAI / OpenRouter)
 *   responseParser — extract <project>/<patch> blocks from raw LLM text
 *   jsxApplicator  — apply a full <project> string to the editor store
 *   patchEngine    — apply a <patch> XML delta to the editor store
 *   toolRegistry   — all structured AI tools (function-calling schema + handlers)
 *   aiContextBuilder — build the AiContext object from store state
 *   aiToolTypes    — shared TypeScript interfaces (AiTool, AiContext, AiResult)
 */

// ── System prompt ──────────────────────────────────────────────────────────────
export { DS_SYSTEM_PROMPT } from "./systemPrompt";

// ── LLM client ────────────────────────────────────────────────────────────────
export {
    callLlm,
    PROVIDER_MODEL_HINTS,
    PROVIDER_DEFAULT_MODELS,
    PROVIDER_KEY_PLACEHOLDERS,
} from "./llmClient";
export type { LlmProvider, LlmMessage, LlmCallOptions, LlmResponse, ToolDefinition, ToolCall } from "./llmClient";

// ── Response parsing ──────────────────────────────────────────────────────────
export { extractDsResponse, buildProjectContext } from "./responseParser";
export type { ExtractedDsResponse, DsResponseType } from "./responseParser";

// ── JSX application ───────────────────────────────────────────────────────────
export { applyJsxToStore } from "./jsxApplicator";
export type { ApplyJsxResult } from "./jsxApplicator";

// ── Patch engine ──────────────────────────────────────────────────────────────
export { applyPatch } from "./patchEngine";

// ── Tool registry ─────────────────────────────────────────────────────────────
export { allTools } from "./toolRegistry";

// ── Context builder ───────────────────────────────────────────────────────────
export { buildAiContext } from "./aiContextBuilder";

// ── Preview store ──────────────────────────────────────────────────────────────
export { takePreview } from "./previewStore";

// ── Shared types ──────────────────────────────────────────────────────────────
export type { AiTool, AiContext, AiResult } from "./aiToolTypes";
export type { ContentPart } from "./llmClient";
