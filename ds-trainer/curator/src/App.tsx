import { useCallback, useEffect, useRef, useState } from "react";
import { useCurationStore } from "./store/curationStore";
import { QueueSidebar } from "./components/QueueSidebar";
import { DesignPreview } from "./components/DesignPreview";
import { RewardPanel } from "./components/RewardPanel";
import { CurationControls } from "./components/CurationControls";
import { TrainingPanel } from "./components/CalidadPanel";
import { StatsBar } from "./components/StatsBar";

// ─── Drop Zone / Welcome ─────────────────────────────────────────────────────

function WelcomeScreen({ onLoad }: { onLoad: (text: string, name: string) => void }) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function readFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) onLoad(e.target.result as string, file.name);
        };
        reader.readAsText(file);
    }

    return (
        <div
            style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0b0b16",
                flexDirection: "column",
                gap: 0,
            }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) readFile(file);
            }}
        >
            {/* Logo */}
            <div style={{ marginBottom: 48, textAlign: "center" }}>
                <div style={{
                    fontSize: 48, fontWeight: 800, fontFamily: "Inter, sans-serif",
                    background: "linear-gradient(135deg, #6c5ce7, #00d2ff)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    letterSpacing: -2,
                }}>
                    DS Curator
                </div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", fontFamily: "Inter, sans-serif", marginTop: 6 }}>
                    Human-in-the-Loop · DesignStudio Dataset Curation
                </div>
            </div>

            {/* Drop zone */}
            <div
                onClick={() => inputRef.current?.click()}
                style={{
                    width: 440,
                    height: 220,
                    borderRadius: 20,
                    border: `2px dashed ${dragging ? "#6c5ce7" : "rgba(255,255,255,0.1)"}`,
                    background: dragging ? "rgba(108,92,231,0.08)" : "rgba(255,255,255,0.02)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    gap: 12,
                }}
            >
                <div style={{ fontSize: 40 }}>📂</div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.7)", fontFamily: "Inter, sans-serif" }}>
                        Cargar dataset JSONL
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "Inter, sans-serif", marginTop: 4 }}>
                        Arrastra aquí o haz clic para seleccionar
                    </div>
                </div>
                <div style={{
                    padding: "6px 16px", borderRadius: 8,
                    background: "rgba(108,92,231,0.15)",
                    border: "1px solid rgba(108,92,231,0.3)",
                    fontSize: 12, color: "#a29bfe",
                    fontFamily: "Inter, sans-serif",
                }}>
                    .jsonl
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept=".jsonl,.json"
                style={{ display: "none" }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) readFile(file);
                }}
            />

            {/* Keyboard shortcuts hint */}
            <div style={{ marginTop: 48, display: "flex", gap: 24. }}>
                {[
                    ["Y", "Aprobar"],
                    ["X", "Rechazar"],
                    ["S", "Saltar"],
                    ["→", "Siguiente"],
                    ["←", "Anterior"],
                    ["J", "Ver JSX"],
                    ["G", "Guías"],
                    ["C", "Training"],
                ].map(([key, label]) => (
                    <div key={key} style={{ textAlign: "center" }}>
                        <div style={{
                            padding: "4px 10px", borderRadius: 6,
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            fontSize: 13, fontFamily: "JetBrains Mono, monospace",
                            color: "rgba(255,255,255,0.6)",
                            marginBottom: 4,
                        }}>
                            {key}
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "Inter, sans-serif" }}>
                            {label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Curation View ──────────────────────────────────────────────────────

function CurationView() {
    const {
        entries,
        filteredIndices,
        currentIndex,
        showJsx,
        showRewardDetails,
        rightPanelMode,
        toggleJsx,
        toggleRewardDetails,
        toggleRightPanelMode,
        setStatus,
        navigateNext,
        navigatePrev,
        isAddingTag,
    } = useCurationStore();

    const [showGuides, setShowGuides] = useState(true);

    const entry = entries[currentIndex];
    const filtered_pos = filteredIndices.indexOf(currentIndex);

    const handleKey = useCallback(
        (e: KeyboardEvent) => {
            if (isAddingTag) return;
            const t = e.target as HTMLElement;
            if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;

            switch (e.key.toLowerCase()) {
                case "y":
                    if (entry) setStatus(entry.id, "approved");
                    break;
                case "x":
                case "n":
                    if (entry) setStatus(entry.id, "rejected");
                    break;
                case "s":
                    if (entry) setStatus(entry.id, "skip");
                    break;
                case "arrowright":
                    navigateNext();
                    break;
                case "arrowleft":
                    navigatePrev();
                    break;
                case "j":
                    toggleJsx();
                    break;
                case "g":
                    setShowGuides((v) => !v);
                    break;
                case "r":
                    toggleRewardDetails();
                    break;
                case "c":
                    toggleRightPanelMode();
                    break;
            }
        },
        [entry, setStatus, navigateNext, navigatePrev, toggleJsx, toggleRewardDetails, toggleRightPanelMode, isAddingTag]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [handleKey]);

    if (!entry) {
        return (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontFamily: "Inter, sans-serif", fontSize: 14 }}>
                {filteredIndices.length === 0 ? "No hay diseños que coincidan con los filtros" : "Selecciona un diseño de la cola"}
            </div>
        );
    }

    return (
        <div style={{ flex: 1, display: "flex", minWidth: 0, height: "100%", overflow: "hidden" }}>
            {/* Preview area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                {/* Toolbar */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 18px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    background: "#0d0d1a",
                    flexShrink: 0,
                }}>
                    {/* Navigation */}
                    <button onClick={navigatePrev} disabled={filtered_pos <= 0} style={navBtn}>◀</button>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "JetBrains Mono, monospace", minWidth: 70, textAlign: "center" }}>
                        {filtered_pos + 1} / {filteredIndices.length}
                    </span>
                    <button onClick={navigateNext} disabled={filtered_pos >= filteredIndices.length - 1} style={navBtn}>▶</button>

                    <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />

                    {/* ID */}
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "JetBrains Mono, monospace" }}>
                        {entry.id}
                    </span>

                    <div style={{ flex: 1 }} />

                    {/* Toggle guides */}
                    <ToggleBtn active={showGuides} onClick={() => setShowGuides((v) => !v)} label="Guías" shortcut="G" />
                    {/* Toggle JSX */}
                    <ToggleBtn active={showJsx} onClick={toggleJsx} label="JSX" shortcut="J" />
                    {/* Toggle Calidad mode */}
                    <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />
                    <ToggleBtn active={rightPanelMode === "calidad"} onClick={toggleRightPanelMode} label="Training" shortcut="C" />
                </div>

                {/* Preview / JSX split */}
                <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
                    {/* Design preview — fills remaining space, handles zoom/pan internally */}
                    <div style={{
                        flex: showJsx ? "0 0 60%" : 1,
                        position: "relative",
                        background: "#111122",
                        minWidth: 0,
                        height: "100%",
                    }}>
                        <DesignPreview jsx={entry.jsx} showGuides={showGuides} />
                    </div>

                    {/* JSX panel */}
                    {showJsx && (
                        <div style={{
                            flex: "0 0 40%",
                            borderLeft: "1px solid rgba(255,255,255,0.06)",
                            overflow: "auto",
                            background: "#0a0a12",
                            padding: 16,
                        }}>
                            <pre style={{
                                margin: 0,
                                fontSize: 11,
                                color: "#a9b7d0",
                                fontFamily: "JetBrains Mono, monospace",
                                lineHeight: 1.6,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-all",
                            }}>
                                {entry.jsx}
                            </pre>
                        </div>
                    )}
                </div>
            </div>

            {/* Right panel — switches between curation and calidad mode */}
            <div style={{
                width: 300,
                flexShrink: 0,
                borderLeft: "1px solid rgba(255,255,255,0.06)",
                background: "#0d0d1a",
                display: "flex",
                flexDirection: "column",
            }}>
                {rightPanelMode === "calidad" ? (
                    <TrainingPanel entry={entry} />
                ) : (
                    <>
                        {/* Mode indicator */}
                        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}>
                            {/* Prompt */}
                            <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: "Inter, sans-serif" }}>
                                    Prompt
                                </div>
                                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.55, fontFamily: "Inter, sans-serif" }}>
                                    {entry.prompt}
                                </div>

                                {/* Metadata chips */}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                                    <MetaChip label={entry.metadata.archetype.replace(/_/g, " ")} />
                                    <MetaChip label={`${entry.metadata.n_pages} ${entry.metadata.n_pages === 1 ? "página" : "páginas"}`} />
                                    <MetaChip label={`${entry.metadata.n_cols} col`} />
                                    {entry.metadata.source && <MetaChip label={entry.metadata.source} dim />}
                                </div>
                            </div>

                            {/* Reward panel */}
                            <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                <RewardPanel
                                    reward={entry.metadata.reward}
                                    expanded={showRewardDetails}
                                    onToggle={toggleRewardDetails}
                                />
                            </div>

                            {/* Curation controls */}
                            <div style={{ padding: 16 }}>
                                <CurationControls entry={entry} />
                            </div>
                        </div>

                        {/* Keyboard hint */}
                        <div style={{ padding: "0 16px 16px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {[["Y", "Aprobar"], ["X", "Rechazar"], ["S", "Saltar"], ["← →", "Navegar"], ["C", "Training"]].map(
                                ([k, l]) => (
                                    <div key={k} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                        <span style={{
                                            padding: "2px 5px", borderRadius: 4,
                                            background: "rgba(255,255,255,0.06)",
                                            fontSize: 9, fontFamily: "JetBrains Mono, monospace",
                                            color: "rgba(255,255,255,0.4)",
                                        }}>
                                            {k}
                                        </span>
                                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "Inter, sans-serif" }}>
                                            {l}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Shared mini-styles ───────────────────────────────────────────────────────

const navBtn: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.5)",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "Inter, sans-serif",
};

function ToggleBtn({ active, onClick, label, shortcut }: { active: boolean; onClick: () => void; label: string; shortcut: string }) {
    return (
        <button
            onClick={onClick}
            title={`[${shortcut}]`}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 7,
                border: `1px solid ${active ? "rgba(108,92,231,0.5)" : "rgba(255,255,255,0.08)"}`,
                background: active ? "rgba(108,92,231,0.15)" : "rgba(255,255,255,0.03)",
                color: active ? "#a29bfe" : "rgba(255,255,255,0.35)",
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "Inter, sans-serif",
            }}
        >
            {label}
            <span style={{ fontSize: 9, opacity: 0.6, background: "rgba(255,255,255,0.08)", borderRadius: 3, padding: "1px 4px" }}>
                {shortcut}
            </span>
        </button>
    );
}

function MetaChip({ label, dim }: { label: string; dim?: boolean }) {
    return (
        <span style={{
            padding: "2px 8px",
            borderRadius: 4,
            background: dim ? "rgba(255,255,255,0.04)" : "rgba(108,92,231,0.1)",
            border: `1px solid ${dim ? "rgba(255,255,255,0.06)" : "rgba(108,92,231,0.2)"}`,
            fontSize: 10,
            color: dim ? "rgba(255,255,255,0.25)" : "rgba(162,155,254,0.7)",
            fontFamily: "Inter, sans-serif",
        }}>
            {label}
        </span>
    );
}

// ─── Root App ────────────────────────────────────────────────────────────────

export default function App() {
    const { entries, loadJsonl } = useCurationStore();
    const hasData = entries.length > 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0b0b16", color: "#fff", overflow: "hidden" }}>
            {/* Top bar */}
            <div style={{
                height: 44,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "#0a0a14",
                display: "flex",
                alignItems: "center",
                padding: "0 18px",
                gap: 12,
                flexShrink: 0,
            }}>
                <div style={{
                    fontSize: 14, fontWeight: 700,
                    background: "linear-gradient(90deg, #6c5ce7, #00d2ff)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    fontFamily: "Inter, sans-serif",
                    letterSpacing: -0.5,
                }}>
                    DS Curator
                </div>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "Inter, sans-serif" }}>
                    Human-in-the-Loop Dataset Curation
                </span>
            </div>

            {/* Body */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {hasData ? (
                    <>
                        <QueueSidebar />
                        <CurationView />
                    </>
                ) : (
                    <WelcomeScreen onLoad={loadJsonl} />
                )}
            </div>

            {/* Stats bar */}
            {hasData && <StatsBar />}
        </div>
    );
}
