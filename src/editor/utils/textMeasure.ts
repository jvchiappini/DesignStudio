import type { DesignElement } from "./types";

export interface TextSizing {
    requiredH: number;
    lineCount: number;
}

function applyTextTransform(text: string, transform: string | undefined): string {
    if (!transform || transform === "none") return text;
    switch (transform) {
        case "uppercase": return text.toUpperCase();
        case "lowercase": return text.toLowerCase();
        case "capitalize": return text.replace(/\b\w/g, (c) => c.toUpperCase());
        default: return text;
    }
}

/**
 * Calculate the minimum height needed for a text element to fit its content
 * without clipping. Uses canvas measureText for accurate per-glyph metrics.
 * Returns null if measurement is not possible (no canvas, not a text element).
 */
export function calculateTextHeight(el: DesignElement): TextSizing | null {
    if (el.type !== "text" || !el.text) return null;

    const fontSize = el.fontSize ?? 32;
    const fontFamily = el.fontFamily ?? "system-ui, sans-serif";
    const fontWeight = el.fontWeight ?? 400;
    const fontStyle = el.fontStyle ?? "normal";
    const lineHeight = el.lineHeight ?? 1.2;
    const letterSpacing = el.letterSpacing ?? 0;
    const wordSpacing = el.wordSpacing ?? 0;

    const pL = el.textPaddingLeft ?? 4;
    const pR = el.textPaddingRight ?? 4;
    const pT = el.textPaddingTop ?? 4;
    const pB = el.textPaddingBottom ?? 4;

    const availableWidth = el.width - pL - pR;
    if (availableWidth <= 0) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const fontStr = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.font = fontStr;

    const text = applyTextTransform(el.text, el.textTransform);
    const lines = text.split("\n");
    let totalHeight = 0;
    let maxLineCount = 0;

    for (const rawLine of lines) {
        if (!rawLine.trim() && rawLine === "") {
            totalHeight += fontSize * lineHeight;
            maxLineCount++;
            continue;
        }

        const words = rawLine.split(/\s+/);
        let currentLine = "";
        let currentLineWords = 0;
        const wrappedLines: string[] = [];

        for (const word of words) {
            const testLine = currentLine ? currentLine + " " + word : word;
            const metrics = ctx.measureText(testLine);
            const ls = testLine.length > 1 ? (testLine.length - 1) * letterSpacing : 0;
            const ws = currentLineWords * wordSpacing;
            const textWidth = metrics.width + ls + ws;

            if (textWidth > availableWidth && currentLine) {
                wrappedLines.push(currentLine);
                currentLine = word;
                currentLineWords = 1;
            } else {
                currentLine = testLine;
                currentLineWords = currentLine ? currentLineWords + 1 : 1;
            }
        }
        if (currentLine) wrappedLines.push(currentLine);

        totalHeight += fontSize * lineHeight * wrappedLines.length;
        maxLineCount += wrappedLines.length;
    }

    const requiredH = Math.ceil(totalHeight + pT + pB + 2);

    return { requiredH, lineCount: maxLineCount };
}

/**
 * Calculate the optimal font size for a text element so all content fits within
 * both its width and height. Uses binary search with canvas measureText for accuracy.
 * Returns null if measurement is not possible.
 */
export function calculateOptimalFontSize(el: DesignElement): number | null {
    if (el.type !== "text" || !el.text) return null;

    const fontFamily = el.fontFamily ?? "system-ui, sans-serif";
    const fontWeight = el.fontWeight ?? 400;
    const fontStyle = el.fontStyle ?? "normal";
    const letterSpacing = el.letterSpacing ?? 0;
    const wordSpacing = el.wordSpacing ?? 0;
    const pL = el.textPaddingLeft ?? 4;
    const pR = el.textPaddingRight ?? 4;
    const pT = el.textPaddingTop ?? 4;
    const pB = el.textPaddingBottom ?? 4;
    const lineHeight = el.lineHeight ?? 1.2;
    const FIT_MARGIN = 4; // safety px per word to prevent sub-pixel rendering mismatches

    const availableWidth = el.width - pL - pR - FIT_MARGIN;
    if (availableWidth <= 0) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const text = applyTextTransform(el.text, el.textTransform);
    const rawLines = text.split("\n");
    if (rawLines.length === 0) return null;

    // Find the longest single word in the entire text — it sets the lower bound
    const allWords = text.split(/\s+/);
    let longestWord = "";
    for (const w of allWords) {
        if (w.length > longestWord.length) longestWord = w;
    }

    let min = 1;
    let max = Math.max(200, availableWidth * 2);
    let best = el.fontSize ?? 32;
    if (best > max) best = max;

    for (let attempt = 0; attempt < 30; attempt++) {
        const mid = (min + max) / 2;
        ctx.font = `${fontStyle} ${fontWeight} ${mid}px ${fontFamily}`;

        // The longest word must fit by itself (browser will break it otherwise)
        const wordMetrics = ctx.measureText(longestWord);
        const wordLs = longestWord.length > 1 ? (longestWord.length - 1) * letterSpacing : 0;
        if (wordMetrics.width + wordLs > availableWidth) {
            max = mid;
            continue;
        }

        let fits = true;
        let totalHeight = 0;

        for (const rawLine of rawLines) {
            const words = rawLine.split(/\s+/);
            let currentLine = "";
            let currentLineWords = 0;
            let lineCount = 0;

            for (const word of words) {
                const testLine = currentLine ? currentLine + " " + word : word;
                const metrics = ctx.measureText(testLine);
                const ls = testLine.length > 1 ? (testLine.length - 1) * letterSpacing : 0;
                const ws = currentLineWords * wordSpacing;
                const textWidth = metrics.width + ls + ws;

                if (textWidth > availableWidth && currentLine) {
                    lineCount++;
                    currentLine = word;
                    currentLineWords = 1;
                } else {
                    currentLine = testLine;
                    currentLineWords = currentLine ? currentLineWords + 1 : 1;
                }
            }
            if (currentLine) lineCount++;
            totalHeight += mid * lineHeight * lineCount;
            if (totalHeight + pT + pB > el.height) {
                fits = false;
                break;
            }
        }

        if (fits) {
            best = mid;
            min = mid;
        } else {
            max = mid;
        }
    }

    return Math.round(best * 10) / 10;
}

/**
 * Returns the required height if the text element needs resizing to fit content,
 * or null if no change is needed.
 * Does NOT mutate the element.
 */
export function getRequiredTextHeight(el: DesignElement): number | null {
    if (el.type !== "text") return null;
    const sizing = calculateTextHeight(el);
    if (!sizing) return null;
    if (sizing.requiredH > el.height) return sizing.requiredH;
    return null;
}

/**
 * Get height fixes for all text elements in an array. Returns (id, newHeight) pairs.
 * Does NOT mutate the elements.
 */
export function getTextHeightFixes(elements: DesignElement[]): Array<{ id: string; height: number }> {
    const fixes: Array<{ id: string; height: number }> = [];
    for (const el of elements) {
        const h = getRequiredTextHeight(el);
        if (h !== null) {
            fixes.push({ id: el.id, height: h });
        }
    }
    return fixes;
}
