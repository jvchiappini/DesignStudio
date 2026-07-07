/**
 * imageOptimizer.ts
 *
 * Compresses an uploaded image file before storing it in the editor.
 *
 * Strategy (no quality loss visible to the human eye):
 *   1. Decode the image into an off-screen <canvas>
 *   2. Downscale if either dimension exceeds MAX_SIDE (default 2048px)
 *      – aspect ratio is always preserved
 *   3. Re-encode to WebP at QUALITY (default 0.88)
 *
 * Why WebP?
 *   - 30–80% smaller than PNG for the same visual quality
 *   - Supported in all modern browsers
 *   - Lossless option available (quality = 1.0)
 *
 * Result: a `data:image/webp;base64,...` string safe to store in DesignElement.src.
 *
 * SVG files are returned as-is (they are already compact text).
 * GIF files are returned as-is (WebP conversion loses animation).
 */

// ─── Configuration ────────────────────────────────────────────────────────────

/** Max pixel dimension (width OR height). Images larger than this are downscaled. */
const MAX_SIDE = 2048;

/** WebP quality: 0.0–1.0. 0.88 ≈ indistinguishable from lossless for photos. */
const QUALITY = 0.88;

// ─── Public API ───────────────────────────────────────────────────────────────

export interface OptimizeResult {
    /** The optimized data URL (data:image/webp;base64,...) */
    dataUrl: string;
    /** Original file size in bytes */
    originalBytes: number;
    /** Optimized base64 string byte count (~0.75 × output byteLength) */
    optimizedBytes: number;
    /** Human-readable summary, e.g. "1.4 MB → 210 KB (−85%)" */
    summary: string;
}

/**
 * Compress a browser File (image upload) and return an optimized data URL.
 *
 * Pass-through cases (returns original DataURL):
 *   - SVG files (text format, already compact)
 *   - GIF files (animation would be lost)
 *   - Files < 50 KB (not worth the overhead)
 *
 * @param file The image File from an <input type="file"> element.
 * @param maxSide Maximum allowed dimension in pixels. Default: 2048.
 * @param quality WebP quality 0–1. Default: 0.88.
 */
/**
 * Shared canvas optimization logic
 */
function optimizeViaCanvas(
    url: string,
    originalBytes: number,
    maxSide: number,
    quality: number,
    resolve: (r: OptimizeResult) => void,
    reject: (e: Error) => void,
    fallbackUrl: () => string
) {
    const img = new Image();
    img.onload = () => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);

        let { naturalWidth: w, naturalHeight: h } = img;
        if (w > maxSide || h > maxSide) {
            const ratio = Math.min(maxSide / w, maxSide / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            reject(new Error("Could not get 2D canvas context"));
            return;
        }
        ctx.drawImage(img, 0, 0, w, h);

        const dataUrl = canvas.toDataURL("image/webp", quality);
        const base64Part = dataUrl.split(",")[1] ?? "";
        const optimizedBytes = Math.round(base64Part.length * 0.75);

        if (originalBytes > 0 && optimizedBytes >= originalBytes) {
            resolve({
                dataUrl: fallbackUrl(),
                originalBytes,
                optimizedBytes: originalBytes,
                summary: `${fmtBytes(originalBytes)} (sin cambios — optimizado era mayor)`
            });
            return;
        }

        const pct = originalBytes > 0 ? Math.round((1 - optimizedBytes / originalBytes) * 100) : 0;
        const summary = originalBytes > 0
            ? `${fmtBytes(originalBytes)} → ${fmtBytes(optimizedBytes)} (−${pct}%)`
            : `Optimized to ${fmtBytes(optimizedBytes)}`;

        resolve({ dataUrl, originalBytes, optimizedBytes, summary });
    };

    img.onerror = () => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        resolve({
            dataUrl: fallbackUrl(),
            originalBytes,
            optimizedBytes: originalBytes,
            summary: `${fmtBytes(originalBytes)} (sin cambios — error al optimizar)`,
        });
    };

    img.src = url;
}

export function optimizeImage(
    file: File,
    maxSide: number = MAX_SIDE,
    quality: number = QUALITY,
): Promise<OptimizeResult> {
    return new Promise((resolve, reject) => {
        const originalBytes = file.size;

        if (file.type === "image/svg+xml" || file.type === "image/gif" || originalBytes < 50_000) {
            const reader = new FileReader();
            reader.onload = () => {
                resolve({
                    dataUrl: reader.result as string,
                    originalBytes,
                    optimizedBytes: originalBytes,
                    summary: `${fmtBytes(originalBytes)} (sin cambios)`,
                });
            };
            reader.onerror = () => reject(new Error("Error reading file"));
            reader.readAsDataURL(file);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        optimizeViaCanvas(
            objectUrl,
            originalBytes,
            maxSide,
            quality,
            resolve,
            reject,
            () => {
                // Fallback doesn't immediately load file to avoid memory bloat unless needed
                return "";
            }
        );
    });
}

/**
 * Compress an existing base64 data URL. Useful for saving/exporting.
 * Skips compression if it's already a WebP or if size is too small.
 */
export function optimizeBase64Image(
    dataUrl: string,
    maxSide: number = MAX_SIDE,
    quality: number = QUALITY,
): Promise<OptimizeResult> {
    return new Promise((resolve, reject) => {
        if (!dataUrl.startsWith("data:image/")) {
            return resolve({ dataUrl, originalBytes: 0, optimizedBytes: 0, summary: "Not a data URL" });
        }

        const base64Part = dataUrl.split(",")[1] ?? "";
        const originalBytes = Math.round(base64Part.length * 0.75);

        if (
            dataUrl.startsWith("data:image/svg+xml") ||
            dataUrl.startsWith("data:image/gif") ||
            dataUrl.startsWith("data:image/webp") ||
            originalBytes < 50_000
        ) {
            resolve({
                dataUrl,
                originalBytes,
                optimizedBytes: originalBytes,
                summary: `${fmtBytes(originalBytes)} (sin cambios)`
            });
            return;
        }

        optimizeViaCanvas(
            dataUrl,
            originalBytes,
            maxSide,
            quality,
            resolve,
            reject,
            () => dataUrl
        );
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
