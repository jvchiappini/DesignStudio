/**
 * responseParser.ts
 *
 * Pure utility functions for working with raw LLM text output:
 *   - extractDsResponse: find a <project> or <patch> block in raw LLM text
 *   - buildProjectContext: wrap serialized JSX into a markdown context block
 *
 * These have ZERO React or store dependencies — easy to unit-test.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type DsResponseType = "project" | "patch";

export interface ExtractedDsResponse {
    /** Whether the LLM returned a full project replacement or a granular patch */
    type: DsResponseType;
    /** The raw XML string (the <project>…</project> or <patch>…</patch> block) */
    content: string;
    /** Any conversational text provided by the LLM outside the XML blocks */
    message?: string;
}

// ─── Extraction ───────────────────────────────────────────────────────────────

/**
 * Scan raw LLM text for the first <patch> or <project> block.
 * Patches are checked first because they are the preferred optimized format.
 *
 * @returns The extracted block, or null if neither tag is found.
 */
export function extractDsResponse(text: string): ExtractedDsResponse | null {
    // Prefer <patch> — the LLM is instructed to use it for edits
    const patchStart = text.indexOf("<patch>");
    if (patchStart !== -1) {
        const patchEnd = text.lastIndexOf("</patch>");
        if (patchEnd !== -1) {
            const before = text.slice(0, patchStart).trim();
            const after = text.slice(patchEnd + 8).trim();
            return {
                type: "patch",
                content: text.slice(patchStart, patchEnd + 8).trim(),
                message: [before, after].filter(Boolean).join("\n\n") || undefined,
            };
        }
    }

    // Fall back to a full <project> replacement (used for brand-new designs)
    const projStart = text.indexOf("<project>");
    if (projStart !== -1) {
        const projEnd = text.lastIndexOf("</project>");
        if (projEnd !== -1) {
            const before = text.slice(0, projStart).trim();
            const after = text.slice(projEnd + 10).trim();
            return {
                type: "project",
                content: text.slice(projStart, projEnd + 10).trim(),
                message: [before, after].filter(Boolean).join("\n\n") || undefined,
            };
        }
    }

    return null;
}

// ─── Context building ─────────────────────────────────────────────────────────

/**
 * Wrap the serialized project JSX into a markdown block that the LLM can read
 * as "Current Project" context before acting on a user request.
 */
export function buildProjectContext(projectJsx: string): string {
    return `## Current Project\n\`\`\`jsx\n${projectJsx}\n\`\`\``;
}
