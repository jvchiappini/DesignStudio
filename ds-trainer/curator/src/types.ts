// ─────────────────────────────────────────────────────────────────────────────
// types.ts — Shared types for ds-curator
// ─────────────────────────────────────────────────────────────────────────────

export type CurationStatus = "pending" | "approved" | "rejected" | "skip";

export interface RewardBreakdown {
    total: number;
    grid: number;
    typographic: number;
    contrast: number;
    hierarchy: number;
    spacing: number;
    validity: number;
    diversity?: number;
}

export interface DesignEntry {
    id: string;
    prompt: string;
    jsx: string;
    metadata: {
        archetype: string;
        n_pages: number;
        color_scheme: string;
        font_pairing: string;
        n_cols: number;
        reward: RewardBreakdown;
        generation?: number;
        source?: string;
        tags?: string[];
    };
    curation: {
        status: CurationStatus;
        approved_by: string | null;
        notes: string;
        tags: string[];
        reviewed_at?: string;
    };
}

export interface SessionStats {
    total: number;
    approved: number;
    rejected: number;
    skipped: number;
    pending: number;
    avgRewardApproved: number;
    startedAt: string;
}

export interface CurationFilter {
    status: CurationStatus | "all";
    minReward: number;
    archetype: string | "all";
    searchQuery: string;
}
