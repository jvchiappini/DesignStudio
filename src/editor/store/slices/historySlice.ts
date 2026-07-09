import type { DesignElement } from "../../utils/types";
import type { SliceCreator } from "../storeTypes";

export interface HistorySlice {
  history: HistoryEntry[];
  historyIndex: number;
  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

interface HistoryEntry {
  elements: DesignElement[];
  selectedId: string | null;
}

export const createHistorySlice: SliceCreator<HistorySlice> = (set, get) => ({
  history: [],
  historyIndex: -1,

  saveSnapshot: () => {
    const { elements, selectedId, history, historyIndex } = get();
    const entry = { elements: JSON.parse(JSON.stringify(elements)), selectedId };
    const trimmed = history.slice(0, historyIndex + 1);
    trimmed.push(entry);
    if (trimmed.length > 50) trimmed.shift();
    set({ history: trimmed, historyIndex: trimmed.length - 1 });
  },

  undo: () => {
    const { history, historyIndex, elements } = get();
    if (historyIndex < 0) return;
    const currentSnapshot = { elements: JSON.parse(JSON.stringify(elements)), selectedId: get().selectedId };
    const entry = history[historyIndex];
    const newHistory = [...history];
    newHistory[historyIndex] = currentSnapshot;
    set({
      elements: entry.elements, selectedId: entry.selectedId,
      selectedIds: entry.selectedId ? [entry.selectedId] : [],
      history: newHistory, historyIndex: historyIndex - 1,
      rightTab: entry.selectedId ? "properties" : null,
    });
    get().persist?.();
  },

  redo: () => {
    const { history, historyIndex, elements } = get();
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const entry = history[nextIndex];
    const currentSnapshot = { elements: JSON.parse(JSON.stringify(elements)), selectedId: get().selectedId };
    const newHistory = [...history];
    newHistory[nextIndex] = currentSnapshot;
    set({
      elements: entry.elements, selectedId: entry.selectedId,
      selectedIds: entry.selectedId ? [entry.selectedId] : [],
      history: newHistory, historyIndex: nextIndex,
      rightTab: entry.selectedId ? "properties" : null,
    });
    get().persist?.();
  },
}
);
