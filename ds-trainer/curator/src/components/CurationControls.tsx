import { useRef } from "react";
import type { DesignEntry, CurationStatus } from "../types";
import { useCurationStore } from "../store/curationStore";

interface Props {
    entry: DesignEntry;
}

const STATUS_CONFIG: Record<CurationStatus, { label: string; icon: string; color: string; bg: string; key: string }> = {
    approved: { label: "Aprobar", icon: "✓", color: "#00d2ff", bg: "rgba(0,210,255,0.12)", key: "Y" },
    rejected: { label: "Rechazar", icon: "✕", color: "#ff6b6b", bg: "rgba(255,107,107,0.12)", key: "X" },
    skip: { label: "Saltar", icon: "→", color: "#f9ca24", bg: "rgba(249,202,36,0.12)", key: "S" },
    pending: { label: "Pendiente", icon: "○", color: "#888", bg: "transparent", key: "" },
};

export function CurationControls({ entry }: Props) {
    const { setStatus, addTag, removeTag, setIsAddingTag, setPendingTag, isAddingTag, pendingTag } =
        useCurationStore();
    const tagInputRef = useRef<HTMLInputElement>(null);
    const current = entry.curation.status;

    function handleDecision(status: CurationStatus) {
        setStatus(entry.id, status);
    }

    function handleTagSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (pendingTag.trim()) {
            addTag(entry.id, pendingTag.trim());
            setPendingTag("");
        }
        setIsAddingTag(false);
    }

    const decisions: CurationStatus[] = ["approved", "rejected", "skip"];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Decision buttons */}
            <div style={{ display: "flex", gap: 8 }}>
                {decisions.map((status) => {
                    const cfg = STATUS_CONFIG[status];
                    const isActive = current === status;
                    return (
                        <button
                            key={status}
                            onClick={() => handleDecision(status)}
                            title={`${cfg.label} [${cfg.key}]`}
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                padding: "10px 8px",
                                borderRadius: 10,
                                border: `1.5px solid ${isActive ? cfg.color : "rgba(255,255,255,0.1)"}`,
                                background: isActive ? cfg.bg : "rgba(255,255,255,0.03)",
                                color: isActive ? cfg.color : "rgba(255,255,255,0.45)",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: isActive ? 700 : 500,
                                fontFamily: "Inter, sans-serif",
                                transition: "all 0.15s",
                                boxShadow: isActive ? `0 0 12px ${cfg.color}33` : "none",
                            }}
                        >
                            <span style={{ fontSize: 15 }}>{cfg.icon}</span>
                            <span>{cfg.label}</span>
                            <span
                                style={{
                                    fontSize: 9,
                                    opacity: 0.5,
                                    background: "rgba(255,255,255,0.08)",
                                    borderRadius: 3,
                                    padding: "1px 4px",
                                }}
                            >
                                {cfg.key}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Current status badge */}
            {current !== "pending" && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: STATUS_CONFIG[current].bg,
                        border: `1px solid ${STATUS_CONFIG[current].color}44`,
                        alignSelf: "flex-start",
                    }}
                >
                    <span style={{ color: STATUS_CONFIG[current].color, fontSize: 12 }}>
                        {STATUS_CONFIG[current].icon}
                    </span>
                    <span
                        style={{
                            color: STATUS_CONFIG[current].color,
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: "Inter, sans-serif",
                        }}
                    >
                        {STATUS_CONFIG[current].label.toUpperCase()}
                    </span>
                </div>
            )}

            {/* Tags */}
            <div>
                <div
                    style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.35)",
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontFamily: "Inter, sans-serif",
                    }}
                >
                    Etiquetas
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {entry.curation.tags.map((tag) => (
                        <span
                            key={tag}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "3px 8px 3px 10px",
                                borderRadius: 20,
                                background: "rgba(108,92,231,0.15)",
                                border: "1px solid rgba(108,92,231,0.3)",
                                fontSize: 11,
                                color: "#a29bfe",
                                fontFamily: "Inter, sans-serif",
                            }}
                        >
                            {tag}
                            <button
                                onClick={() => removeTag(entry.id, tag)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "rgba(162,155,254,0.5)",
                                    cursor: "pointer",
                                    fontSize: 11,
                                    lineHeight: 1,
                                    padding: 0,
                                }}
                            >
                                ×
                            </button>
                        </span>
                    ))}

                    {/* Suggested tags */}
                    {[
                        "excellent-grid", "strong-hierarchy", "high-contrast",
                        "bold-typography", "elegant", "complex-layout",
                        "dark-mode", "light-mode", "minimal", "editorial",
                    ]
                        .filter((t) => !entry.curation.tags.includes(t))
                        .slice(0, 4)
                        .map((tag) => (
                            <button
                                key={tag}
                                onClick={() => addTag(entry.id, tag)}
                                style={{
                                    padding: "3px 8px",
                                    borderRadius: 20,
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px dashed rgba(255,255,255,0.12)",
                                    fontSize: 11,
                                    color: "rgba(255,255,255,0.3)",
                                    cursor: "pointer",
                                    fontFamily: "Inter, sans-serif",
                                }}
                            >
                                + {tag}
                            </button>
                        ))}

                    {/* Custom tag input */}
                    {isAddingTag ? (
                        <form onSubmit={handleTagSubmit} style={{ display: "inline-flex" }}>
                            <input
                                ref={tagInputRef}
                                autoFocus
                                value={pendingTag}
                                onChange={(e) => setPendingTag(e.target.value)}
                                onBlur={() => { setIsAddingTag(false); setPendingTag(""); }}
                                onKeyDown={(e) => e.key === "Escape" && setIsAddingTag(false)}
                                placeholder="nueva etiqueta..."
                                style={{
                                    padding: "3px 8px",
                                    borderRadius: 20,
                                    border: "1px solid rgba(108,92,231,0.5)",
                                    background: "rgba(108,92,231,0.1)",
                                    color: "#a29bfe",
                                    fontSize: 11,
                                    outline: "none",
                                    fontFamily: "Inter, sans-serif",
                                    width: 130,
                                }}
                            />
                        </form>
                    ) : (
                        <button
                            onClick={() => { setIsAddingTag(true); }}
                            style={{
                                padding: "3px 10px",
                                borderRadius: 20,
                                background: "rgba(108,92,231,0.08)",
                                border: "1px solid rgba(108,92,231,0.2)",
                                fontSize: 11,
                                color: "rgba(108,92,231,0.7)",
                                cursor: "pointer",
                                fontFamily: "Inter, sans-serif",
                            }}
                        >
                            + Agregar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
