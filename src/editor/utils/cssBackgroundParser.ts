import type { BackgroundLayer } from "./types";
import { genLayerId } from "./backgroundUtils";

/**
 * Parse a CSS background shorthand value into BackgroundLayer[].
 * Handles the common patterns: linear-gradient, radial-gradient, conic-gradient, colors.
 * Multiple layers separated by comma.
 */
export function cssBackgroundToLayers(css: string): BackgroundLayer[] {
    const trimmed = css.trim();
    if (!trimmed) return [];

    const layers: BackgroundLayer[] = [];

    // Split by comma at top-level (not inside parens)
    const parts = splitTopLevel(trimmed);
    for (const part of parts) {
        const p = part.trim();
        if (!p) continue;

        const layer = parseSingleLayer(p);
        if (layer) layers.push(layer);
    }

    return layers;
}

function splitTopLevel(s: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let current = "";
    for (const ch of s) {
        if (ch === "," && depth === 0) {
            parts.push(current);
            current = "";
        } else {
            if (ch === "(") depth++;
            if (ch === ")") depth--;
            current += ch;
        }
    }
    if (current.trim()) parts.push(current);
    return parts;
}

function parseSingleLayer(s: string): BackgroundLayer | null {
    // linear-gradient(angle, stops...)
    const linearMatch = s.match(/^linear-gradient\s*\(([^)]+)\)$/i);
    if (linearMatch) return parseGradientLayer("linear", linearMatch[1]);

    // radial-gradient([shape] at [position], stops...)
    const radialMatch = s.match(/^radial-gradient\s*\(([^)]+)\)$/i);
    if (radialMatch) return parseGradientLayer("radial", radialMatch[1]);

    // conic-gradient(from angle at position, stops...)
    const conicMatch = s.match(/^conic-gradient\s*\(([^)]+)\)$/i);
    if (conicMatch) return parseGradientLayer("conic", conicMatch[1]);

    // Plain color
    if (/^#/.test(s) || /^rgb/.test(s) || /^transparent$/i.test(s)) {
        return {
            id: genLayerId(),
            type: "color",
            enabled: true,
            color: s,
        };
    }

    // url("...")
    const urlMatch = s.match(/^url\s*\(\s*["']?([^"')]+)["']?\s*\)/i);
    if (urlMatch) {
        return {
            id: genLayerId(),
            type: "image",
            enabled: true,
            src: urlMatch[1],
            imageSize: "cover",
            imagePosition: "center",
            imageRepeat: "no-repeat",
        };
    }

    // Fallback: parse as a CSS color
    return {
        id: genLayerId(),
        type: "color",
        enabled: true,
        color: s,
    };
}

function parseGradientLayer(kind: "linear" | "radial" | "conic", inner: string): BackgroundLayer | null {
    const stops: { color: string; position: number }[] = [];
    let angle: number | undefined;
    let position: string | undefined;

    // Parse comma-separated tokens inside the gradient function
    const tokens = splitTopLevel(inner);

    for (const token of tokens) {
        const t = token.trim();

        // Angle: "135deg" or "0.25turn"
        const angleMatch = t.match(/^([\d.]+)\s*(deg|turn|rad|grad)$/i);
        if (angleMatch) {
            let deg = parseFloat(angleMatch[1]);
            const unit = angleMatch[2].toLowerCase();
            if (unit === "turn") deg *= 360;
            else if (unit === "rad") deg = deg * 180 / Math.PI;
            else if (unit === "grad") deg = deg * 0.9;
            angle = deg;
            continue;
        }

        // Radial position: "circle at 20% 50%" or "ellipse at 50% 50%"
        if (kind === "radial") {
            const posMatch = t.match(/(?:circle|ellipse)?\s*at\s+(.+)/i);
            if (posMatch) {
                position = posMatch[1].trim();
                continue;
            }
        }

        // Conic position: "from 45deg at 50% 50%"
        if (kind === "conic") {
            const fromMatch = t.match(/^from\s+([\d.]+(?:deg|turn|rad|grad))/i);
            if (fromMatch) {
                let deg = parseFloat(fromMatch[1]);
                const unit = (fromMatch[1].match(/(deg|turn|rad|grad)/i)?.[1] || "deg").toLowerCase();
                if (unit === "turn") deg *= 360;
                else if (unit === "rad") deg = deg * 180 / Math.PI;
                else if (unit === "grad") deg *= 0.9;
                angle = deg;
                continue;
            }
            const atMatch = t.match(/at\s+(.+)/i);
            if (atMatch) {
                position = atMatch[1].trim();
                continue;
            }
        }

        // Color stop: "rgba(102,126,234,0.3) 0%" or "#667eea 0%" or "transparent 50%"
        const stopMatch = t.match(/^(.+?)\s+([\d.]+)%$/);
        if (stopMatch) {
            stops.push({ color: stopMatch[1].trim(), position: parseFloat(stopMatch[2]) });
            continue;
        }

        // Plain color (last resort for this token)
        if (/^#/.test(t) || /^rgba?/.test(t) || /^transparent$/i.test(t) || /^hsla?/.test(t)) {
            stops.push({ color: t, position: 100 });
            continue;
        }
    }

    if (stops.length === 0) return null;

    const layer: BackgroundLayer = {
        id: genLayerId(),
        type: "gradient",
        enabled: true,
        gradientKind: kind,
        gradientStops: stops,
    };

    if (angle !== undefined) layer.gradientAngle = angle;
    if (position !== undefined) layer.gradientPosition = kind === "radial" ? position : position;

    return layer;
}
