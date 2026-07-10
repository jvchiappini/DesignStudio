import { useCurationStore } from "../store/curationStore";

export function StatsBar() {
    const { getStats, exportJsonl, exportTraining, clearAll, fileName } = useCurationStore();
    const s = getStats();

    const pct = (n: number) => (s.total > 0 ? ((n / s.total) * 100).toFixed(1) : "0.0");

    return (
        <div
            style={{
                height: 48,
                borderTop: "1px solid rgba(255,255,255,0.06)",
                background: "#0a0a14",
                display: "flex",
                alignItems: "center",
                padding: "0 20px",
                gap: 24,
                flexShrink: 0,
            }}
        >
            {/* Stats */}
            <Stat label="Total" value={s.total} color="rgba(255,255,255,0.5)" />
            <Stat label="Aprobados" value={`${s.approved} (${pct(s.approved)}%)`} color="#00d2ff" />
            <Stat label="Rechazados" value={`${s.rejected} (${pct(s.rejected)}%)`} color="#ff6b6b" />
            <Stat label="Saltados" value={s.skipped} color="#f9ca24" />
            <Stat label="Pendientes" value={s.pending} color="rgba(255,255,255,0.3)" />
            {s.approved > 0 && (
                <Stat label="Reward Ø aprobados" value={`${(s.avgRewardApproved * 100).toFixed(1)}`} color="#a29bfe" />
            )}

            <div style={{ flex: 1 }} />

            {/* Progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 160 }}>
                <div
                    style={{
                        flex: 1,
                        height: 4,
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: `${s.total > 0 ? ((s.approved + s.rejected + s.skipped) / s.total) * 100 : 0}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #6c5ce7, #00d2ff)",
                            borderRadius: 2,
                            transition: "width 0.3s",
                        }}
                    />
                </div>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "JetBrains Mono, monospace", minWidth: 30 }}>
                    {s.total > 0 ? Math.round(((s.approved + s.rejected + s.skipped) / s.total) * 100) : 0}%
                </span>
            </div>

            {/* Export buttons */}
            {fileName && (
                <div style={{ display: "flex", gap: 6 }}>
                    <ExportBtn label="↓ Training" onClick={() => exportTraining()} color="#00d2ff" />
                    <ExportBtn label="↓ Aprobados" onClick={() => exportJsonl("approved")} color="rgba(255,255,255,0.35)" />
                    <ExportBtn label="↓ Todo" onClick={() => exportJsonl("all")} color="rgba(255,255,255,0.25)" />
                </div>
            )}

            {/* Clear */}
            {fileName && (
                <button
                    onClick={() => { if (confirm("¿Limpiar todo? Se perderán las decisiones no exportadas.")) clearAll(); }}
                    style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: "1px solid rgba(255,100,100,0.2)",
                        background: "rgba(255,100,100,0.06)",
                        color: "rgba(255,100,100,0.5)",
                        fontSize: 10,
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                    }}
                >
                    Limpiar
                </button>
            )}
        </div>
    );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "Inter, sans-serif" }}>
                {label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: "JetBrains Mono, monospace" }}>
                {value}
            </span>
        </div>
    );
}

function ExportBtn({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "5px 11px",
                borderRadius: 7,
                border: `1px solid ${color}44`,
                background: `${color}11`,
                color,
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                whiteSpace: "nowrap",
            }}
        >
            {label}
        </button>
    );
}
