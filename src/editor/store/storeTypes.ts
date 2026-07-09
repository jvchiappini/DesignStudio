import type { ElementSlice } from "./slices/elementSlice";
import type { PageSlice } from "./slices/pageSlice";
import type { GuideSlice } from "./slices/guideSlice";
import type { UiSlice } from "./slices/uiSlice";
import type { HistorySlice } from "./slices/historySlice";

export type EditorStore = ElementSlice & PageSlice & GuideSlice & UiSlice & HistorySlice & {
  persist: () => void;
  forcePersist: () => void;
  newProject: () => void;
  loadProject: (data: string) => boolean;
};

export type SliceCreator<T> = (
  set: (partial: Partial<EditorStore> | ((state: EditorStore) => Partial<EditorStore>)) => void,
  get: () => EditorStore,
) => T;
