import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { parseDesignJsx, type ParsedPage, type ParsedElement, type ParsedGuide } from "../lib/jsxRenderer";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
    jsx: string;
    showGuides?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page renderer (no scaling — zoom is applied by the pan/zoom wrapper)
// ─────────────────────────────────────────────────────────────────────────────

function RenderedPage({
    page,
    guides,
    pageNum,
    showGuides,
}: {
    page: ParsedPage;
    guides: ParsedGuide[];
    pageNum: number;
    showGuides: boolean;
}) {
    const pageGuides = guides.filter(
        (g) => g.pageNumber === undefined || g.pageNumber === pageNum
    );

    return (
        <div
            style={{
                position: "relative",
                width: page.width,
                height: page.height,
                background: page.bgColor,
                flexShrink: 0,
                overflow: "hidden",
                borderRadius: 2,
                boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
        >
            {showGuides &&
                pageGuides.map((g) => (
                    <div
                        key={g.id}
                        title={`${g.id} @ ${g.position}px`}
                        style={{
                            position: "absolute",
                            background: "rgba(108,92,231,0.55)",
                            pointerEvents: "none",
                            zIndex: 10,
                            ...(g.orientation === "vertical"
                                ? { left: g.position, top: 0, width: 1, height: "100%" }
                                : { top: g.position, left: 0, height: 1, width: "100%" }),
                        }}
                    />
                ))}

            {page.elements.map((el, i) => (
                <RenderedElement key={i} el={el} />
            ))}

            {/* Page label */}
            <div
                style={{
                    position: "absolute",
                    bottom: 8,
                    left: 12,
                    fontSize: 18,
                    color: "rgba(255,255,255,0.25)",
                    fontFamily: "Inter, sans-serif",
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            >
                {page.name}
            </div>
        </div>
    );
}

function RenderedElement({ el }: { el: ParsedElement }) {
    const base: React.CSSProperties = {
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.w,
        height: el.h,
        overflow: "hidden",
    };

    if (el.type === "text") {
        const tt =
            el.textTransform === "uppercase"
                ? "uppercase"
                : el.textTransform === "lowercase"
                    ? "lowercase"
                    : "none";
        return (
            <div
                style={{
                    ...base,
                    fontSize: el.fontSize ?? 16,
                    fontWeight: el.fontWeight as any,
                    fontFamily: el.fontFamily,
                    color: el.color,
                    textAlign: el.textAlign as any,
                    letterSpacing: el.letterSpacing ?? 0,
                    textTransform: tt as any,
                    lineHeight: el.lineHeight,
                    fontStyle: el.fontStyle as any,
                    display: "flex",
                    alignItems:
                        el.verticalAlign === "middle"
                            ? "center"
                            : el.verticalAlign === "bottom"
                                ? "flex-end"
                                : "flex-start",
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                }}
            >
                <span style={{ width: "100%" }}>{el.text}</span>
            </div>
        );
    }

    if (el.type === "image") {
        return (
            <div
                style={{
                    ...base,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 14,
                    fontFamily: "Inter, sans-serif",
                }}
            >
                <span>IMG</span>
            </div>
        );
    }

    if (el.type === "shape") {
        return (
            <div
                style={{
                    ...base,
                    background: el.bgColor,
                    borderRadius: el.borderRadius ?? 0,
                }}
            />
        );
    }

    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Zoom + Pan wrapper — all layout at natural size, CSS transform for zoom/pan
// ─────────────────────────────────────────────────────────────────────────────

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

export function DesignPreview({ jsx, showGuides = true }: Props) {
    const parsed = useMemo(() => parseDesignJsx(jsx), [jsx]);

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });
    const [isSpaceDown, setIsSpaceDown] = useState(false);

    // ── Fit-to-view on new design ────────────────────────────────────────────
    const fitToView = useCallback(() => {
        if (!containerRef.current || !parsed.ok || parsed.pages.length === 0) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        const totalNaturalW =
            parsed.pages.reduce((s, p) => s + p.width, 0) +
            parsed.pageGap * (parsed.pages.length - 1);
        const maxH = Math.max(...parsed.pages.map((p) => p.height));
        const fitZoom = Math.min(
            (width - 80) / totalNaturalW,
            (height - 80) / maxH,
            1
        );
        setZoom(fitZoom);
        setPan({ x: 0, y: 0 });
    }, [parsed]);

    // Fit every time jsx changes
    useEffect(() => {
        fitToView();
    }, [fitToView]);

    // ── Keyboard: Space = pan mode ───────────────────────────────────────────
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space" && e.target === document.body) {
                setIsSpaceDown(true);
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === "Space") setIsSpaceDown(false);
        };
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        };
    }, []);

    // ── Wheel: zoom centered on cursor ───────────────────────────────────────
    const onWheel = useCallback(
        (e: React.WheelEvent) => {
            e.preventDefault();
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            // Cursor position relative to container center
            const cx = e.clientX - rect.left - rect.width / 2;
            const cy = e.clientY - rect.top - rect.height / 2;

            const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
            const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta * zoom));
            const ratio = newZoom / zoom;

            setPan((p) => ({
                x: cx - ratio * (cx - p.x),
                y: cy - ratio * (cy - p.y),
            }));
            setZoom(newZoom);
        },
        [zoom]
    );

    // ── Mouse drag to pan ─────────────────────────────────────────────────────
    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            // Middle mouse OR (left mouse + space)
            if (e.button === 1 || (e.button === 0 && isSpaceDown)) {
                e.preventDefault();
                isPanning.current = true;
                lastMouse.current = { x: e.clientX, y: e.clientY };
            }
        },
        [isSpaceDown]
    );

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanning.current) return;
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    }, []);

    const onMouseUp = useCallback(() => {
        isPanning.current = false;
    }, []);

    // ── Zoom buttons ──────────────────────────────────────────────────────────
    const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP * z));
    const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP * z));
    const zoomReset = () => fitToView();

    // ── Render ────────────────────────────────────────────────────────────────
    if (!parsed.ok) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#ff6b6b", fontFamily: "Inter, sans-serif", fontSize: 13, flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <span>Parse error: {parsed.error}</span>
            </div>
        );
    }

    if (parsed.pages.length === 0) {
        return <div style={{ color: "#888", fontFamily: "Inter", fontSize: 13, padding: 20 }}>No pages found</div>;
    }

    const cursorStyle = isPanning.current
        ? "grabbing"
        : isSpaceDown
            ? "grab"
            : "default";

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
            {/* Zoom/pan canvas */}
            <div
                ref={containerRef}
                onWheel={onWheel}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                style={{
                    width: "100%",
                    height: "100%",
                    cursor: cursorStyle,
                    userSelect: "none",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Transformed content */}
                <div
                    ref={contentRef}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
                        transformOrigin: "center center",
                        display: "flex",
                        gap: parsed.pageGap,
                        alignItems: "flex-start",
                    }}
                >
                    {parsed.pages.map((page, i) => (
                        <RenderedPage
                            key={i}
                            page={page}
                            guides={parsed.guides}
                            pageNum={i + 1}
                            showGuides={showGuides}
                        />
                    ))}
                </div>
            </div>

            {/* Zoom controls HUD */}
            <div
                style={{
                    position: "absolute",
                    bottom: 16,
                    right: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "rgba(10,10,20,0.85)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: "5px 8px",
                }}
            >
                <ZoomBtn onClick={zoomOut} label="−" />
                <button
                    onClick={zoomReset}
                    title="Fit to view"
                    style={{
                        padding: "3px 10px",
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 11,
                        cursor: "pointer",
                        fontFamily: "JetBrains Mono, monospace",
                        minWidth: 50,
                        textAlign: "center",
                    }}
                >
                    {Math.round(zoom * 100)}%
                </button>
                <ZoomBtn onClick={zoomIn} label="+" />
                <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", margin: "0 2px" }} />
                <ZoomBtn onClick={fitToView} label="⊡" title="Fit" />
            </div>

            {/* Pan hint */}
            <div
                style={{
                    position: "absolute",
                    bottom: 16,
                    left: 16,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.2)",
                    fontFamily: "Inter, sans-serif",
                    pointerEvents: "none",
                }}
            >
                Scroll: zoom · Space+drag / rueda: paneo
            </div>
        </div>
    );
}

function ZoomBtn({ onClick, label, title }: { onClick: () => void; label: string; title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: "none",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.7)",
                cursor: "pointer",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Inter, sans-serif",
                lineHeight: 1,
                flexShrink: 0,
            }}
        >
            {label}
        </button>
    );
}
