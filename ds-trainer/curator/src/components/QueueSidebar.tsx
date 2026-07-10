import { useCurationStore } from "../store/curationStore";
import type { DesignEntry, CurationStatus } from "../types";

const STATUS_COLOR: Record<CurationStatus, string> = {
    approved: "#00d2ff",
    rejected: "#ff6b6b",
    skip: "#f9ca24",
    pending: "rgba(255,255,255,0.2)",
};
const STATUS_DOT: Record<CurationStatus, string> = {
    approved: "✓",
    rejected: "✕",
    skip: "→",
    pending: "○",
};

function QueueItem({
    entry,
    isActive,
    index,
    onClick,
}: {
    entry: DesignEntry;
    isActive: boolean;
    index: number;
    onClick: () => void;
}) {
    const st = entry.curation.status;
    return (
        <button
            onClick={onClick}
            style={{
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 12px",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                background: isActive ? "rgba(108,92,231,0.18)" : "rgba(255,255,255,0.02)",
                borderLeft: isActive ? "3px solid #6c5ce7" : "3px solid transparent",
                transition: "all 0.12s",
                textAlign: "left",
            }}
        >
            {/* Status dot */}
            <span
                style={{
                    fontSize: 12,
                    color: STATUS_COLOR[st],
                    flexShrink: 0,
                    marginTop: 2,
                }}
            >
                {STATUS_DOT[st]}
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
                {/* ID + score */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span
                        style={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.3)",
                            fontFamily: "JetBrains Mono, monospace",
                        }}
                    >
                        #{String(index + 1).padStart(4, "0")}
                    </span>
                    <span
                        style={{
                            fontSize: 10,
                            color: "#a29bfe",
                            fontFamily: "JetBrains Mono, monospace",
                            fontWeight: 600,
                        }}
                    >
                        {(entry.metadata.reward.total * 100).toFixed(0)}
                    </span>
                </div>

                {/* Prompt preview */}
                <div
                    style={{
                        fontSize: 11,
                        color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
                        lineHeight: 1.4,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as any,
                        fontFamily: "Inter, sans-serif",
                    }}
                >
                    {entry.prompt}
                </div>

                {/* Archetype badge */}
                <div
                    style={{
                        display: "inline-flex",
                        marginTop: 4,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: "rgba(108,92,231,0.1)",
                        fontSize: 9,
                        color: "rgba(162,155,254,0.6)",
                        fontFamily: "Inter, sans-serif",
                        letterSpacing: 0.5,
                    }}
                >
                    {entry.metadata.archetype.replace(/_/g, " ")}
                </div>
            </div>
        </button>
    );
}

export function QueueSidebar() {
    const {
        entries,
        filteredIndices,
        currentIndex,
        filter,
        setFilter,
        setCurrentIndex,
        fileName,
    } = useCurationStore();

    const archetypes = Array.from(new Set(entries.map((e) => e.metadata.archetype))).sort();

    return (
        <div
            style={{
                width: 260,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                borderRight: "1px solid rgba(255,255,255,0.06)",
                background: "#0d0d1a",
                height: "100%",
            }}
        >
            {/* File name */}
            <div
                style={{
                    padding: "14px 14px 10px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>
                    Archivo
                </div>
                <div
                    style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.6)",
                        fontFamily: "JetBrains Mono, monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {fileName || "—"}
                </div>
            </div>

            {/* Filters */}
            <div
                style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                }}
            >
                {/* Status filter tabs */}
                <div style={{ display: "flex", gap: 4 }}>
                    {(["pending", "approved", "rejected", "all"] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter({ status: s })}
                            style={{
                                flex: 1,
                                padding: "4px 2px",
                                borderRadius: 6,
                                border: "none",
                                background: filter.status === s ? "rgba(108,92,231,0.25)" : "rgba(255,255,255,0.04)",
                                color: filter.status === s ? "#a29bfe" : "rgba(255,255,255,0.3)",
                                fontSize: 9,
                                cursor: "pointer",
                                fontFamily: "Inter, sans-serif",
                                fontWeight: filter.status === s ? 600 : 400,
                                textTransform: "capitalize",
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <input
                    value={filter.searchQuery}
                    onChange={(e) => setFilter({ searchQuery: e.target.value })}
                    placeholder="Buscar prompt..."
                    style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 11,
                        outline: "none",
                        fontFamily: "Inter, sans-serif",
                        boxSizing: "border-box",
                    }}
                />

                {/* Min reward slider */}
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "Inter" }}>
                            Reward mín.
                        </span>
                        <span style={{ fontSize: 10, color: "#a29bfe", fontFamily: "JetBrains Mono, monospace" }}>
                            {(filter.minReward * 100).toFixed(0)}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={filter.minReward}
                        onChange={(e) => setFilter({ minReward: parseFloat(e.target.value) })}
                        style={{ width: "100%", accentColor: "#6c5ce7" }}
                    />
                </div>

                {/* Archetype filter */}
                {archetypes.length > 0 && (
                    <select
                        value={filter.archetype}
                        onChange={(e) => setFilter({ archetype: e.target.value })}
                        style={{
                            width: "100%",
                            padding: "5px 8px",
                            borderRadius: 8,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.6)",
                            fontSize: 11,
                            outline: "none",
                            fontFamily: "Inter, sans-serif",
                        }}
                    >
                        <option value="all">Todos los arquetipos</option>
                        {archetypes.map((a) => (
                            <option key={a} value={a}>
                                {a.replace(/_/g, " ")}
                            </option>
                        ))}
                    </select>
                )}

                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "Inter", textAlign: "right" }}>
                    {filteredIndices.length} de {entries.length} diseños
                </div>
            </div>

            {/* Queue list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
                {filteredIndices.length === 0 ? (
                    <div
                        style={{
                            padding: 20,
                            textAlign: "center",
                            color: "rgba(255,255,255,0.2)",
                            fontSize: 12,
                            fontFamily: "Inter",
                        }}
                    >
                        Sin resultados
                    </div>
                ) : (
                    filteredIndices.map((realIdx) => (
                        <QueueItem
                            key={realIdx}
                            entry={entries[realIdx]}
                            isActive={realIdx === currentIndex}
                            index={realIdx}
                            onClick={() => setCurrentIndex(realIdx)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
