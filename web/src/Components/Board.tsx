import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

import {
  BoardSidebar,
  BoardTopRibbon,
  type BoardMenuAction,
  type BoardSidebarSection,
  type BoardSidebarSectionId,
} from "@/Components/board/index";
import {
  CANVAS_BACKGROUND_PRESETS,
  CANVAS_PRESETS,
  DEFAULT_CANVAS_PRESET_ID,
  FIT_PADDING,
  getCanvasBackgroundById,
  getCanvasPresetById,
  getCanvasPresetIdFromSize,
} from "@/board/config";
import { getNearestCanvasInDirection } from "@/board/navigation";
import { BoardCanvas } from "@/canvas";
import { CanvasShortcuts } from "@/canvas/canvasShorcuts";
import { useKeyboardShortcuts } from "@/canvas/useKeyBindings";
import { useRouter } from "@/pages/routerStore";
import { useBoardUiStore } from "@/stores/useBoardUiStore";
import { useBoardViewportStore } from "@/stores/useBoardViewportStore";
import { useCanvasStore } from "@/stores/useCanvasStore";
import type { CanvasNavigationDirection, CanvasPresetId } from "@/types/canvas";

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

const getCanvasCenterPosition = ({
  boardWidth,
  boardHeight,
  viewportX,
  viewportY,
  scale,
  canvasWidth,
  canvasHeight,
  canvasIndex,
}: {
  boardWidth: number;
  boardHeight: number;
  viewportX: number;
  viewportY: number;
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
  canvasIndex: number;
}) => {
  const offset = Math.min(canvasIndex, 3) * 40;

  return {
    x: (boardWidth / 2 - viewportX) / scale - canvasWidth / 2 + offset,
    y: (boardHeight / 2 - viewportY) / scale - canvasHeight / 2 + offset,
  };
};

const BOARD_SIDEBAR_SECTIONS: BoardSidebarSection[] = [
  {
    id: "background",
    label: "Background",
    description: "Canvas fill",
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
    description: "Coming soon",
    isPlaceholder: true,
  },
  {
    id: "uploads",
    label: "Uploads",
    description: "Coming soon",
    isPlaceholder: true,
  },
];

export const Board = () => {
  const setRoute = useRouter((state) => state.setRoute);

  const canvases = useCanvasStore((state) => state.canvases);
  const activeCanvasId = useCanvasStore((state) => state.activeCanvasId);
  const selectedCanvasId = useCanvasStore((state) => state.selectedCanvasId);
  const initializeDefaultCanvas = useCanvasStore(
    (state) => state.initializeDefaultCanvas,
  );
  const addCanvas = useCanvasStore((state) => state.addCanvas);
  const setActiveCanvas = useCanvasStore((state) => state.setActiveCanvas);
  const setSelectedCanvas = useCanvasStore((state) => state.setSelectedCanvas);
  const resizeActiveCanvas = useCanvasStore((state) => state.resizeActiveCanvas);
  const applyBackgroundToActiveCanvas = useCanvasStore(
    (state) => state.applyBackgroundToActiveCanvas,
  );
  const removeActiveCanvas = useCanvasStore((state) => state.removeActiveCanvas);
  const resetBoard = useCanvasStore((state) => state.resetBoard);

  const boardSize = useBoardViewportStore((state) => state.boardSize);
  const viewport = useBoardViewportStore((state) => state.viewport);
  const fitCanvas = useBoardViewportStore((state) => state.fitCanvas);
  const setCanPanBoard = useBoardViewportStore((state) => state.setCanPanBoard);

  const sidebarWidth = useBoardUiStore((state) => state.sidebarWidth);
  const openSectionId = useBoardUiStore((state) => state.openSectionId);
  const isFileMenuOpen = useBoardUiStore((state) => state.isFileMenuOpen);
  const isPresetMenuOpen = useBoardUiStore((state) => state.isPresetMenuOpen);
  const setSidebarWidth = useBoardUiStore((state) => state.setSidebarWidth);
  const resetSidebarWidth = useBoardUiStore((state) => state.resetSidebarWidth);
  const setOpenSectionId = useBoardUiStore((state) => state.setOpenSectionId);
  const setFileMenuOpen = useBoardUiStore((state) => state.setFileMenuOpen);
  const setPresetMenuOpen = useBoardUiStore((state) => state.setPresetMenuOpen);

  const hasFittedInitialCanvasRef = useRef(false);

  const activeCanvas =
    canvases.find((canvas) => canvas.id === activeCanvasId) ?? canvases[0] ?? null;
  const activeCanvasPreset = activeCanvas
    ? getCanvasPresetById(
        getCanvasPresetIdFromSize({
          width: activeCanvas.width,
          height: activeCanvas.height,
        }),
      )
    : getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
  const activeBackground = activeCanvas
    ? getCanvasBackgroundById(activeCanvas.backgroundPresetId)
    : CANVAS_BACKGROUND_PRESETS[0];

  useEffect(() => {
    if (canvases.length) return;
    initializeDefaultCanvas();
  }, [canvases.length, initializeDefaultCanvas]);

  useEffect(() => {
    setCanPanBoard(canvases.length > 1);
  }, [canvases.length, setCanPanBoard]);

  useEffect(() => {
    if (!activeCanvas || !boardSize.width || hasFittedInitialCanvasRef.current) {
      return;
    }

    fitCanvas(activeCanvas, FIT_PADDING);
    hasFittedInitialCanvasRef.current = true;
  }, [activeCanvas, boardSize.width, fitCanvas]);

  const focusCanvas = (canvasId: string | null) => {
    const nextCanvas = canvases.find((canvas) => canvas.id === canvasId);
    if (!nextCanvas) return;

    setActiveCanvas(nextCanvas.id);
    setSelectedCanvas(nextCanvas.id);
    fitCanvas(nextCanvas, FIT_PADDING);
  };

  const handleAddCanvas = () => {
    const preset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
    if (!preset.size || !boardSize.width || !boardSize.height) return;

    const position = getCanvasCenterPosition({
      boardWidth: boardSize.width,
      boardHeight: boardSize.height,
      viewportX: viewport.x,
      viewportY: viewport.y,
      scale: viewport.scale,
      canvasWidth: preset.size.width,
      canvasHeight: preset.size.height,
      canvasIndex: canvases.length,
    });

    const nextCanvas = addCanvas(preset.size, position);
    setPresetMenuOpen(false);
    setFileMenuOpen(false);
    setActiveCanvas(nextCanvas.id);
    setSelectedCanvas(nextCanvas.id);
  };

  const handleSelectPreset = (presetId: CanvasPresetId) => {
    const preset = getCanvasPresetById(presetId);
    if (!preset.size) return;

    resizeActiveCanvas(preset.size);
  };

  const handleFocusDirection = (direction: CanvasNavigationDirection) => {
    const nextCanvasId = getNearestCanvasInDirection(
      canvases,
      activeCanvasId,
      direction,
    );
    focusCanvas(nextCanvasId);
  };

  const handleSaveBoard = () => {
    const boardSession = {
      version: 1,
      savedAt: new Date().toISOString(),
      viewport,
      sidebarWidth,
      activeCanvasId,
      selectedCanvasId,
      canvases,
    };

    const timestamp = new Date().toISOString().replaceAll(":", "-");
    downloadTextFile(
      `snap-board-${timestamp}.json`,
      JSON.stringify(boardSession, null, 2),
    );
  };

  const handleClearBoard = () => {
    const shouldClear = window.confirm("Clear the board and start over?");
    if (!shouldClear) return;

    const preset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
    if (!preset.size) return;

    const nextCanvas = resetBoard(preset.size);
    fitCanvas(nextCanvas, FIT_PADDING);
    setFileMenuOpen(false);
    setPresetMenuOpen(false);
  };

  const shortcuts = CanvasShortcuts({
    delete: removeActiveCanvas,
    save: handleSaveBoard,
    clear: handleClearBoard,
    focus: {
      this: () => focusCanvas(activeCanvasId),
      next: () => handleFocusDirection("next"),
      prev: () => handleFocusDirection("prev"),
      down: () => handleFocusDirection("down"),
      up: () => handleFocusDirection("up"),
    },
  });

  useKeyboardShortcuts(shortcuts);

  const fileActions: BoardMenuAction[] = [
    {
      id: "home",
      label: "Home",
      icon: "solar:home-linear",
      onSelect: () => setRoute("/"),
    },
    {
      id: "save",
      label: "Save board",
      icon: "solar:diskette-linear",
      onSelect: handleSaveBoard,
    },
    {
      id: "clear",
      label: "Clear board",
      icon: "solar:trash-bin-trash-linear",
      tone: "danger",
      onSelect: handleClearBoard,
    },
  ];

  const handleSidebarResizeStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const startingWidth = sidebarWidth;
    const startingX = event.clientX;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startingX;
      setSidebarWidth(startingWidth + delta);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <main className="flex h-screen flex-col bg-bg">
      <BoardTopRibbon
        canvasCount={canvases.length}
        activeCanvas={activeCanvas}
        activePreset={activeCanvasPreset}
        zoomPercentage={Math.round(viewport.scale * 100)}
        fileActions={fileActions}
        presets={CANVAS_PRESETS}
        isFileMenuOpen={isFileMenuOpen}
        isPresetMenuOpen={isPresetMenuOpen}
        onFileMenuOpenChange={setFileMenuOpen}
        onPresetMenuOpenChange={setPresetMenuOpen}
        onAddCanvas={handleAddCanvas}
        onSelectPreset={handleSelectPreset}
      />

      <div className="flex min-h-0 flex-1">
        <BoardSidebar
          width={sidebarWidth}
          activeCanvas={activeCanvas}
          activeBackground={activeBackground}
          backgroundPresets={CANVAS_BACKGROUND_PRESETS}
          sections={BOARD_SIDEBAR_SECTIONS}
          openSectionId={openSectionId}
          onSectionToggle={(sectionId: BoardSidebarSectionId) =>
            setOpenSectionId(sectionId)
          }
          onBackgroundSelect={applyBackgroundToActiveCanvas}
          onResizeStart={handleSidebarResizeStart}
          onResizeReset={resetSidebarWidth}
        />

        <section className="min-w-0 flex-1 bg-bg">
          <BoardCanvas />
        </section>
      </div>
    </main>
  );
};
