import type { RewardBreakdown } from "../types";

interface Props {
    reward: RewardBreakdown;
    expanded: boolean;
    onToggle: () => void;
}

const DIMENSIONS: { key: keyof RewardBreakdown; label: string; icon: string; desc: string }[] = [
    { key: "grid", label: "Grid Alignment", icon: "⊞", desc: "Elements anchored to guides" },
    { key: "contrast", label: "Color Contrast", icon: "◑", desc: "WCAG text/bg contrast ratio" },
    { key: "hierarchy", label: "Visual Hierarchy", icon: "▤", desc: "Font size progression" },
    { key: "typographic", label: "Type Scale", icon: "Aa", desc: "Modular scale adherence" },
    { key: "spacing", label: "Vertical Rhythm", icon: "↕", desc: "Consistent vertical spacing" },
    { key: "validity", label: "Validity", icon: "✓", desc: "JSX parses without errors" },
];

function scoreColor(v: number): string {
    if (v >= 0.85) return "#00d2ff";
    if (v >= 0.70) return "#a8ff78";
    if (v >= 0.50) return "#f9ca24";
    return "#ff6b6b";
}

function ScoreBar({ value }: { value: number }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div
                style={{
                    flex: 1,
                    height: 4,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 2,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: `${Math.min(value * 100, 100)}%`,
                        height: "100%",
                        background: scoreColor(value),
                        borderRadius: 2,
                        transition: "width 0.3s ease",
                    }}
                />
            </div>
            <span
                style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: scoreColor(value),
                    minWidth: 32,
                    textAlign: "right",
                    fontFamily: "JetBrains Mono, monospace",
                }}
            >
                {(value * 100).toFixed(0)}
            </span>
        </div>
    );
}

export function RewardPanel({ reward, expanded, onToggle }: Props) {
    const total = reward.total;
    const color = scoreColor(total);

    return (
        <div
            style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                overflow: "hidden",
            }}
        >
            {/* Header — always visible */}
            <button
                onClick={onToggle}
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#fff",
                }}
            >
                {/* Circular score */}
                <div
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        border: `3px solid ${color}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: `0 0 12px ${color}44`,
                    }}
                >
                    <span
                        style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color,
                            fontFamily: "JetBrains Mono, monospace",
                        }}
                    >
                        {(total * 100).toFixed(0)}
                    </span>
                </div>

                <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>
                        Reward Score
                    </div>
                    <div
                        style={{
                            height: 6,
                            background: "rgba(255,255,255,0.08)",
                            borderRadius: 3,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: `${total * 100}%`,
                                height: "100%",
                                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                                borderRadius: 3,
                            }}
                        />
                    </div>
                </div>

                <span
                    style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                        transform: expanded ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                    }}
                >
                    ▾
                </span>
            </button>

            {/* Expanded breakdown */}
            {expanded && (
                <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div
                        style={{
                            height: 1,
                            background: "rgba(255,255,255,0.06)",
                            margin: "0 0 4px",
                        }}
                    />
                    {DIMENSIONS.map(({ key, label, icon, desc }) => {
                        const val = reward[key] ?? 0;
                        return (
                            <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span
                                    title={desc}
                                    style={{
                                        fontSize: 13,
                                        width: 20,
                                        textAlign: "center",
                                        flexShrink: 0,
                                        cursor: "default",
                                    }}
                                >
                                    {icon}
                                </span>
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: "rgba(255,255,255,0.55)",
                                        width: 110,
                                        flexShrink: 0,
                                    }}
                                >
                                    {label}
                                </span>
                                <ScoreBar value={val} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
