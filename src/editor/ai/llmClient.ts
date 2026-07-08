export type LlmProvider = "openai" | "openrouter" | "google";

export interface ContentPart {
    type: "text" | "image_url";
    text?: string;
    image_url?: { url: string; detail?: "low" | "high" | "auto" };
}

export interface LlmMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string | ContentPart[];
    tool_call_id?: string;
    tool_calls?: ToolCall[];
    name?: string;
    /** Raw Google parts — preserved as-is to keep thoughtSignature and other fields */
    _rawParts?: any[];
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: string;
    /** Google Gemini thought signature — must be preserved across turns for function calling */
    thoughtSignature?: string;
}

export interface LlmCallOptions {
    provider: LlmProvider;
    model: string;
    apiKey: string;
    messages: LlmMessage[];
    temperature?: number;
    maxTokens?: number;
    tools?: ToolDefinition[];
    signal?: AbortSignal;
}

export interface LlmResponse {
    content: string;
    raw: unknown;
    toolCalls?: ToolCall[];
    /** Raw Google parts from the assistant turn — must be passed back as-is */
    _rawParts?: any[];
}

const PROVIDER_ENDPOINTS: Record<LlmProvider, string> = {
    openai: "https://api.openai.com/v1/chat/completions",
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
    google: "https://generativelanguage.googleapis.com/v1beta/models",
};

export const PROVIDER_MODEL_HINTS: Record<LlmProvider, string> = {
    openai: "gpt-4o-mini · gpt-4o · gpt-4-turbo",
    openrouter: "openai/gpt-4o-mini · anthropic/claude-3-haiku · google/gemini-flash-1.5",
    google: "gemini-3.1-flash-lite · gemini-2.0-flash · gemini-1.5-flash",
};

export const PROVIDER_DEFAULT_MODELS: Record<LlmProvider, string> = {
    openai: "gpt-4o-mini",
    openrouter: "openai/gpt-4o-mini",
    google: "gemini-3.1-flash-lite",
};

export const PROVIDER_KEY_PLACEHOLDERS: Record<LlmProvider, string> = {
    openai: "sk-...",
    openrouter: "sk-or-...",
    google: "AIza...",
};

export async function callLlm(opts: LlmCallOptions): Promise<LlmResponse> {
    const { provider, model, apiKey, messages, temperature = 0.7, maxTokens = 8192, signal } = opts;

    if (provider === "google") {
        return callGoogleLlm(model, apiKey, messages, temperature, maxTokens, opts.tools, signal);
    }

    // OpenAI / OpenRouter (same schema)
    const endpoint = PROVIDER_ENDPOINTS[provider];
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
    };

    if (provider === "openrouter") {
        headers["HTTP-Referer"] = window.location.origin;
        headers["X-Title"] = "Design Studio";
    }

    const body: Record<string, unknown> = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
    };

    if (opts.tools && opts.tools.length > 0) {
        body.tools = opts.tools.map((t) => ({
            type: "function",
            function: { name: t.name, description: t.description, parameters: t.parameters },
        }));
    }

    const resp = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal,
    });

    if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`LLM API error ${resp.status} (${provider}): ${errText.slice(0, 300)}`);
    }

    const data = await resp.json();
    const msg = data?.choices?.[0]?.message ?? {};
    const content: string = msg?.content ?? "";
    const toolCalls: ToolCall[] | undefined = msg?.tool_calls?.map((tc: { id: string; function: { name: string; arguments: string } }) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments,
    }));

    return { content, raw: data, toolCalls: toolCalls?.length ? toolCalls : undefined };
}

// ─── Google Gemini ──────────────────────────────────────────────────────────

async function callGoogleLlm(
    model: string,
    apiKey: string,
    messages: LlmMessage[],
    temperature: number,
    maxTokens: number,
    tools?: ToolDefinition[],
    signal?: AbortSignal,
): Promise<LlmResponse> {
    const { systemInstruction, contents } = toGoogleMessages(messages);

    const body: Record<string, unknown> = {
        contents,
        generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
        },
    };

    if (systemInstruction) {
        body.system_instruction = systemInstruction;
    }

    if (tools && tools.length > 0) {
        body.tools = tools.map((t) => ({
            functionDeclarations: [{
                name: t.name,
                description: t.description,
                parameters: t.parameters,
            }],
        }));
    }

    const endpoint = `${PROVIDER_ENDPOINTS.google}/${model}:generateContent?key=${apiKey}`;

    const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
    });

    if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Google AI API error ${resp.status}: ${errText.slice(0, 300)}`);
    }

    const data = await resp.json();
    return fromGoogleResponse(data);
}

interface GoogleContent {
    role?: string;
    parts: GooglePart[];
}

interface GooglePart {
    text?: string;
    inlineData?: { mimeType: string; data: string };
    functionCall?: { name: string; args: Record<string, unknown>; thoughtSignature?: string };
    functionResponse?: { name: string; response: Record<string, unknown> };
}

function toGoogleMessages(messages: LlmMessage[]): {
    systemInstruction?: { parts: { text: string }[] };
    contents: GoogleContent[];
} {
    let systemText: string | null = null;
    const contents: GoogleContent[] = [];
    /** Track raw function call names from previous assistant message (Google may prefix with default_api:) */
    let prevRawFunctionNames: string[] | null = null;
    let prevRawFunctionIdx = 0;

    for (const msg of messages) {
        if (msg.role === "system") {
            systemText = typeof msg.content === "string"
                ? msg.content
                : msg.content.map((c) => c.text || "").filter(Boolean).join("\n");
            continue;
        }

        if (msg.role === "tool") {
            const name = msg.name || "unknown";
            const responseText = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
            // Use the raw function call name (which may have Google's prefix) if available
            const responseName = (prevRawFunctionNames && prevRawFunctionIdx < prevRawFunctionNames.length)
                ? prevRawFunctionNames[prevRawFunctionIdx++]
                : name;
            contents.push({
                role: "function",
                parts: [{
                    functionResponse: {
                        name: responseName,
                        response: { output: responseText },
                    },
                }],
            });
            if (!prevRawFunctionNames) {
                prevRawFunctionIdx = 0;
            }
            continue;
        }

        // Use raw parts if available (preserves thoughtSignature and other Google fields)
        if (msg._rawParts && msg._rawParts.length > 0) {
            const role = msg.role === "assistant" ? "model" : "user";
            contents.push({ role, parts: msg._rawParts });
            // Extract function call names from raw parts for matching with subsequent tool responses
            prevRawFunctionNames = msg._rawParts
                .filter((p: any) => p.functionCall)
                .map((p: any) => p.functionCall.name);
            prevRawFunctionIdx = 0;
            continue;
        }

        // No raw parts — reset tracking
        prevRawFunctionNames = null;
        prevRawFunctionIdx = 0;

        const parts: GooglePart[] = contentToGoogleParts(msg.content);

        if (msg.tool_calls && msg.tool_calls.length > 0) {
            for (const tc of msg.tool_calls) {
                const fc: any = {
                    name: tc.name,
                    args: {},
                };
                try {
                    fc.args = JSON.parse(tc.arguments);
                } catch {
                    fc.args = {};
                }
                if (tc.thoughtSignature) {
                    fc.thoughtSignature = tc.thoughtSignature;
                }
                parts.push({ functionCall: fc });
            }
        }

        const role = msg.role === "assistant" ? "model" : "user";
        contents.push({ role, parts });
    }

    return {
        systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
        contents,
    };
}

function contentToGoogleParts(content: string | ContentPart[]): GooglePart[] {
    if (typeof content === "string") {
        return content ? [{ text: content }] : [];
    }
    return content.map((part) => {
        if (part.type === "text") {
            return { text: part.text || "" };
        }
        if (part.type === "image_url") {
            const url = part.image_url?.url || "";
            if (url.startsWith("data:")) {
                const comma = url.indexOf(",");
                if (comma !== -1) {
                    const mimePart = url.slice(0, comma);
                    const base64Data = url.slice(comma + 1);
                    const mimeType = mimePart.replace("data:", "").replace(/;.*$/, "") || "image/png";
                    return {
                        inlineData: {
                            mimeType,
                            data: base64Data,
                        },
                    };
                }
            }
            return { text: `[Image: ${url}]` };
        }
        return { text: "" };
    });
}

function fromGoogleResponse(data: any): LlmResponse {
    const candidate = data?.candidates?.[0];
    if (!candidate) {
        const blockReason = data?.promptFeedback?.blockReason;
        if (blockReason) {
            return { content: `[Blocked: ${blockReason}]`, raw: data };
        }
        return { content: "", raw: data };
    }

    const parts: GooglePart[] = candidate?.content?.parts || [];
    let text = "";
    const toolCalls: ToolCall[] = [];

    for (const part of parts) {
        if (part.text) text += part.text;
        if (part.functionCall) {
            toolCalls.push({
                id: `fc_${Date.now()}_${toolCalls.length}`,
                name: part.functionCall.name,
                arguments: JSON.stringify(part.functionCall.args || {}),
                thoughtSignature: part.functionCall.thoughtSignature,
            });
        }
    }

    return {
        content: text,
        raw: data,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        _rawParts: parts,
    };
}
