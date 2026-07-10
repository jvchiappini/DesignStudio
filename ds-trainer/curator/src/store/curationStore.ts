import { create } from "zustand";
import type { DesignEntry, CurationStatus, CurationFilter, SessionStats } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// JSONL helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseJsonl(text: string): DesignEntry[] {
    return text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
            try {
                return JSON.parse(l) as DesignEntry;
            } catch {
                return null;
            }
        })
        .filter(Boolean) as DesignEntry[];
}

function entriesToJsonl(entries: DesignEntry[]): string {
    return entries.map((e) => JSON.stringify(e)).join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

interface CurationStore {
    // Data
    entries: DesignEntry[];
    currentIndex: number;
    fileName: string;

    // UI state
    filter: CurationFilter;
    viewMode: "single" | "grid";
    showJsx: boolean;
    showRewardDetails: boolean;
    rightPanelMode: "curation" | "calidad";
    isAddingTag: boolean;
    pendingTag: string;
    sessionStart: string;

    // Computed
    filteredIndices: number[];

    // Actions
    loadJsonl: (text: string, fileName: string) => void;
    setCurrentIndex: (idx: number) => void;
    navigateNext: () => void;
    navigatePrev: () => void;
    setStatus: (id: string, status: CurationStatus, notes?: string) => void;
    addTag: (id: string, tag: string) => void;
    removeTag: (id: string, tag: string) => void;
    setFilter: (filter: Partial<CurationFilter>) => void;
    setViewMode: (mode: "single" | "grid") => void;
    toggleJsx: () => void;
    toggleRewardDetails: () => void;
    setRightPanelMode: (mode: "curation" | "calidad") => void;
    toggleRightPanelMode: () => void;
    setIsAddingTag: (v: boolean) => void;
    setPendingTag: (v: string) => void;
    exportJsonl: (statusFilter: CurationStatus | "all") => void;
    exportTraining: () => void;
    getStats: () => SessionStats;
    clearAll: () => void;
}

const defaultFilter: CurationFilter = {
    status: "pending",
    minReward: 0,
    archetype: "all",
    searchQuery: "",
};

function computeFiltered(entries: DesignEntry[], filter: CurationFilter): number[] {
    return entries
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => {
            if (filter.status !== "all" && e.curation.status !== filter.status) return false;
            if (e.metadata.reward.total < filter.minReward) return false;
            if (filter.archetype !== "all" && e.metadata.archetype !== filter.archetype) return false;
            if (filter.searchQuery) {
                const q = filter.searchQuery.toLowerCase();
                if (!e.prompt.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false;
            }
            return true;
        })
        .map(({ i }) => i);
}

export const useCurationStore = create<CurationStore>((set, get) => ({
    entries: [],
    currentIndex: 0,
    fileName: "",
    filter: defaultFilter,
    viewMode: "single",
    showJsx: false,
    showRewardDetails: true,
    rightPanelMode: "curation",
    isAddingTag: false,
    pendingTag: "",
    sessionStart: new Date().toISOString(),
    filteredIndices: [],

    loadJsonl: (text, fileName) => {
        const entries = parseJsonl(text);
        const filter = get().filter;
        set({
            entries,
            fileName,
            currentIndex: 0,
            filteredIndices: computeFiltered(entries, filter),
            sessionStart: new Date().toISOString(),
        });
    },

    setCurrentIndex: (idx) => set({ currentIndex: idx }),

    navigateNext: () => {
        const { filteredIndices, currentIndex, entries } = get();
        const pos = filteredIndices.indexOf(currentIndex);
        if (pos < filteredIndices.length - 1) {
            set({ currentIndex: filteredIndices[pos + 1] });
        }
    },

    navigatePrev: () => {
        const { filteredIndices, currentIndex } = get();
        const pos = filteredIndices.indexOf(currentIndex);
        if (pos > 0) {
            set({ currentIndex: filteredIndices[pos - 1] });
        }
    },

    setStatus: (id, status, notes) => {
        const entries = get().entries.map((e) =>
            e.id === id
                ? {
                    ...e,
                    curation: {
                        ...e.curation,
                        status,
                        notes: notes ?? e.curation.notes,
                        reviewed_at: new Date().toISOString(),
                    },
                }
                : e
        );
        const filter = get().filter;
        const filteredIndices = computeFiltered(entries, filter);

        // Auto-advance after decision
        const currentIndex = get().currentIndex;
        const pos = filteredIndices.indexOf(currentIndex);
        const nextIndex = pos < filteredIndices.length - 1
            ? filteredIndices[pos + 1]
            : filteredIndices[pos - 1] ?? currentIndex;

        set({ entries, filteredIndices, currentIndex: nextIndex ?? currentIndex });
    },

    addTag: (id, tag) => {
        const trimmed = tag.trim().toLowerCase();
        if (!trimmed) return;
        const entries = get().entries.map((e) =>
            e.id === id && !e.curation.tags.includes(trimmed)
                ? { ...e, curation: { ...e.curation, tags: [...e.curation.tags, trimmed] } }
                : e
        );
        set({ entries });
    },

    removeTag: (id, tag) => {
        const entries = get().entries.map((e) =>
            e.id === id
                ? { ...e, curation: { ...e.curation, tags: e.curation.tags.filter((t) => t !== tag) } }
                : e
        );
        set({ entries });
    },

    setFilter: (partial) => {
        const filter = { ...get().filter, ...partial };
        const filteredIndices = computeFiltered(get().entries, filter);
        set({ filter, filteredIndices, currentIndex: filteredIndices[0] ?? 0 });
    },

    setViewMode: (viewMode) => set({ viewMode }),
    toggleJsx: () => set((s) => ({ showJsx: !s.showJsx })),
    toggleRewardDetails: () => set((s) => ({ showRewardDetails: !s.showRewardDetails })),
    setRightPanelMode: (mode) => set({ rightPanelMode: mode }),
    toggleRightPanelMode: () => set((s) => ({ rightPanelMode: s.rightPanelMode === "curation" ? "calidad" : "curation" })),
    setIsAddingTag: (v) => set({ isAddingTag: v }),
    setPendingTag: (v) => set({ pendingTag: v }),

    exportJsonl: (statusFilter) => {
        const { entries, fileName } = get();
        const filtered = statusFilter === "all"
            ? entries
            : entries.filter((e) => e.curation.status === statusFilter);
        const blob = new Blob([entriesToJsonl(filtered)], { type: "application/jsonl" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const suffix = statusFilter === "all" ? "all" : statusFilter;
        a.download = `${fileName.replace(".jsonl", "")}_${suffix}_${Date.now()}.jsonl`;
        a.click();
        URL.revokeObjectURL(url);
    },

    exportTraining: () => {
        const { entries, fileName } = get();
        const approved = entries.filter((e) => e.curation.status === "approved" && e.curation.tags.length > 0);
        const training = approved.map((e) => ({
            prompt: e.prompt,
            jsx: e.jsx,
            attributes: [...e.curation.tags],
            metadata: {
                archetype: e.metadata.archetype,
                n_pages: e.metadata.n_pages,
                n_cols: e.metadata.n_cols,
            },
        }));
        const blob = new Blob([JSON.stringify(training, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName.replace(".jsonl", "")}_training_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    getStats: () => {
        const { entries, sessionStart } = get();
        const approved = entries.filter((e) => e.curation.status === "approved");
        const avgRewardApproved = approved.length
            ? approved.reduce((s, e) => s + e.metadata.reward.total, 0) / approved.length
            : 0;
        return {
            total: entries.length,
            approved: approved.length,
            rejected: entries.filter((e) => e.curation.status === "rejected").length,
            skipped: entries.filter((e) => e.curation.status === "skip").length,
            pending: entries.filter((e) => e.curation.status === "pending").length,
            avgRewardApproved: Math.round(avgRewardApproved * 100) / 100,
            startedAt: sessionStart,
        };
    },

    clearAll: () =>
        set({ entries: [], currentIndex: 0, filteredIndices: [], fileName: "" }),
}));
