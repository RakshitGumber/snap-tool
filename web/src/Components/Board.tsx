import { useCallback, useEffect, useMemo } from "react";

import {
  BoardBackgroundPanel,
  BoardOverviewPanel,
  BoardSidebar,
  BoardTextPanel,
  TopRibbon,
  BoardUploadsPanel,
  type BoardSidebarSection,
  type BoardSidebarSectionId,
} from "@/Components/board/index";
import {
  CANVAS_BACKGROUND_PRESETS,
  DEFAULT_CANVAS_PRESET_ID,
  getCanvasPresetById,
} from "@/board/config";
import { BoardCanvas } from "@/canvas";
import { CanvasShortcuts } from "@/canvas/canvasShorcuts";
import { useKeyboardShortcuts } from "@/canvas/useKeyBindings";
import { useBoardUiStore } from "@/stores/useBoardUiStore";
import {
  useCanvasShell,
  useCanvasStore,
  useSelectedImageId,
  useSelectedTextId,
} from "@/stores/useCanvasStore";

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

export const Board = () => {
  const selectedImageId = useSelectedImageId();
  const selectedTextId = useSelectedTextId();
  const canvasShell = useCanvasShell();
  const initializeDefaultCanvas = useCanvasStore(
    (state) => state.initializeDefaultCanvas,
  );
  const applyBackgroundToCanvas = useCanvasStore(
    (state) => state.applyBackgroundToCanvas,
  );
  const removeSelectedImage = useCanvasStore(
    (state) => state.removeSelectedImage,
  );
  const removeSelectedText = useCanvasStore(
    (state) => state.removeSelectedText,
  );
  const resetCanvas = useCanvasStore((state) => state.resetCanvas);
  const serializeCanvas = useCanvasStore((state) => state.serializeCanvas);

  const openSectionId = useBoardUiStore((state) => state.openSectionId);
  const isSidebarOpen = useBoardUiStore((state) => state.isSidebarOpen);
  const setOpenSectionId = useBoardUiStore((state) => state.setOpenSectionId);
  const setFileMenuOpen = useBoardUiStore((state) => state.setFileMenuOpen);
  const setPresetMenuOpen = useBoardUiStore((state) => state.setPresetMenuOpen);
  const setSidebarOpen = useBoardUiStore((state) => state.setSidebarOpen);

  useEffect(() => {
    if (canvasShell) return;
    initializeDefaultCanvas();
  }, [canvasShell, initializeDefaultCanvas]);

  const handleSaveCanvas = useCallback(() => {
    const nextCanvas = serializeCanvas();
    if (!nextCanvas) return;

    const canvasSession = {
      version: 1,
      savedAt: new Date().toISOString(),
      canvas: nextCanvas,
    };

    const timestamp = new Date().toISOString().replaceAll(":", "-");
    downloadTextFile(
      `snap-canvas-${timestamp}.json`,
      JSON.stringify(canvasSession, null, 2),
    );
  }, [serializeCanvas]);

  const handleClearCanvas = useCallback(() => {
    const shouldClear = window.confirm("Clear the canvas and start over?");
    if (!shouldClear) return;

    const preset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
    resetCanvas(preset.size);
    setFileMenuOpen(false);
    setPresetMenuOpen(false);
  }, [resetCanvas, setFileMenuOpen, setPresetMenuOpen]);

  const shortcuts = useMemo(
    () =>
      CanvasShortcuts({
        delete: () => {
          if (selectedImageId) {
            removeSelectedImage();
            return;
          }

          if (!selectedTextId) {
            return;
          }

          removeSelectedText();
        },
        save: handleSaveCanvas,
        clear: handleClearCanvas,
      }),
    [
      handleClearCanvas,
      handleSaveCanvas,
      removeSelectedImage,
      removeSelectedText,
      selectedImageId,
      selectedTextId,
    ],
  );

  useKeyboardShortcuts(shortcuts);

  const sidebarSections = useMemo<BoardSidebarSection[]>(
    () => [
      {
        id: "overview",
        label: "Overview",
        description: "Canvas contents and details",
        content: <BoardOverviewPanel />,
      },
      {
        id: "background",
        label: "Background",
        description: "Canvas fill",
        content: (
          <BoardBackgroundPanel
            backgroundPresets={CANVAS_BACKGROUND_PRESETS}
            onBackgroundSelect={applyBackgroundToCanvas}
          />
        ),
      },
      {
        id: "elements",
        label: "Elements",
        description: "Coming soon",
        isPlaceholder: true,
      },
      {
        id: "text",
        label: "Text",
        description: "Headlines, captions, and styled copy",
        content: <BoardTextPanel />,
      },
      {
        id: "uploads",
        label: "Uploads",
        description: "Images and links",
        content: <BoardUploadsPanel />,
      },
    ],
    [applyBackgroundToCanvas],
  );

  return (
    <main className="flex h-screen flex-col">
      <TopRibbon />

      <div className="flex min-h-0 flex-1">
        <BoardSidebar
          isOpen={isSidebarOpen}
          sections={sidebarSections}
          openSectionId={openSectionId}
          onSectionToggle={(sectionId: BoardSidebarSectionId) => {
            setOpenSectionId(sectionId);
            setSidebarOpen(true);
          }}
          onToggleSidebar={setSidebarOpen}
        />

        <section className="relative min-w-0 flex-1 bg-bg">
          <BoardCanvas />
        </section>
      </div>
    </main>
  );
};
