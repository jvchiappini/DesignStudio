import { useCallback, useEffect } from "react";
import { TopBar } from "./editor/components/panels/TopBar";
import { LeftSidebar } from "./editor/components/panels/LeftSidebar";
import { EditorCanvas } from "./editor/components/canvas/EditorCanvas";
import { RightPanel } from "./editor/components/panels/RightPanel";
import { ChatPanel } from "./editor/components/panels/ChatPanel";
import { BottomBar } from "./editor/components/panels/BottomBar";
import { useExport } from "./hooks/useExport";
import { useEditorStore } from "./editor/store/editorStore";
import type { ExportFormat } from "./editor/utils/types";

function LoadingOverlay({ visible, progress }: { visible: boolean; progress: number }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[#1a1a2e] shadow-2xl">
        <div className="w-10 h-10 border-4 border-[#6c5ce7] border-t-transparent rounded-full animate-spin" />
        <p className="text-white text-sm font-medium">Exportando... {progress}%</p>
      </div>
    </div>
  );
}

export default function App() {
  const { exportFrame, exporting, progress } = useExport();
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const selectAll = useEditorStore((s) => s.selectAll);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const moveElements = useEditorStore((s) => s.moveElements);

  const handleExport = useCallback(
    (format: ExportFormat, pages?: number | number[], scale?: number) => {
      const el = document.querySelector<HTMLElement>('[data-canvas-root="true"]');
      if (el) exportFrame(el, format, pages, scale);
    },
    [exportFrame],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const isInput = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey && !isInput) {
        e.preventDefault(); undo(); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault(); redo(); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault(); redo(); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "a" && !isInput) {
        e.preventDefault(); selectAll(); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && !isInput) {
        const state = useEditorStore.getState();
        const copied = state.elements
          .filter((el) => state.selectedIds.includes(el.id))
          .map((el) => JSON.parse(JSON.stringify(el)));
        useEditorStore.setState({ clipboard: copied });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && !isInput) {
        e.preventDefault();
        const state = useEditorStore.getState();
        if (state.clipboard.length === 0) return;
        state.saveSnapshot();
        const maxZ = Math.max(...state.elements.map((el) => el.zIndex), 0);
        const newEls = state.clipboard.map((el, i) => ({
          ...JSON.parse(JSON.stringify(el)),
          id: `el_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
          x: el.x + 30,
          y: el.y + 30,
          zIndex: maxZ + i + 1,
        }));
        useEditorStore.setState((s) => ({
          elements: [...s.elements, ...newEls],
          selectedId: newEls[newEls.length - 1].id,
          selectedIds: newEls.map((e) => e.id),
        }));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && !isInput) {
        e.preventDefault(); duplicateSelected(); return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !isInput) {
        e.preventDefault(); deleteSelected(); return;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && !isInput) {
        const state = useEditorStore.getState();
        if (state.selectedIds.length === 0) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        state.saveSnapshot();
        moveElements(state.selectedIds, dx, dy);
        return;
      }
      if (e.key === "Escape" && !isInput) {
        clearSelection();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, selectAll, deleteSelected, duplicateSelected, moveElements, clearSelection]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopBar onExport={handleExport} exporting={exporting} progress={progress} />

      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        <LeftSidebar />
        <EditorCanvas />
        <RightPanel />
        <ChatPanel />
      </div>

      <BottomBar />
      <LoadingOverlay visible={exporting} progress={progress} />
    </div>
  );
}
