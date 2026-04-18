import { useEffect, useRef } from "react";

import { Icon } from "@iconify/react";

import {
  BoardSidebar,
  BoardTopRibbon,
  BoardUploadsPanel,
  type BoardMenuAction,
  type BoardSidebarSection,
  type BoardSidebarSectionId,
} from "@/Components/board/index";
import {
  CANVAS_BACKGROUND_PRESETS,
  CANVAS_PRESETS,
  DEFAULT_CANVAS_PRESET_ID,
  DEFAULT_SIDEBAR_WIDTH,
  FIT_PADDING,
  SNAP_GAP,
  getCanvasPresetById,
} from "@/board/config";
import { getNearestCanvasInDirection } from "@/board/navigation";
import { BoardCanvas } from "@/canvas";
import { CanvasShortcuts } from "@/canvas/canvasShorcuts";
import { useKeyboardShortcuts } from "@/canvas/useKeyBindings";
import { useRouter } from "@/pages/routerStore";
import { useBoardUiStore } from "@/stores/useBoardUiStore";
import { useBoardViewportStore } from "@/stores/useBoardViewportStore";
import { useActiveCanvas, useCanvasStore } from "@/stores/useCanvasStore";
import type {
  CanvasFrame,
  CanvasNavigationDirection,
  CanvasPresetId,
} from "@/types/canvas";

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

const MAX_CANVASES_PER_ROW = 4;

const getLeftMostCanvas = (canvases: CanvasFrame[]) =>
  canvases.reduce((leftMost, canvas) => (canvas.x < leftMost.x ? canvas : leftMost));

const getRightMostCanvas = (canvases: CanvasFrame[]) =>
  canvases.reduce((rightMost, canvas) =>
    canvas.x + canvas.width > rightMost.x + rightMost.width ? canvas : rightMost,
  );

const getNextCanvasPosition = (canvases: CanvasFrame[]) => {
  if (!canvases.length) {
    return { x: 0, y: 0 };
  }

  const nextCanvasIndex = canvases.length;
  const nextColumnIndex = nextCanvasIndex % MAX_CANVASES_PER_ROW;

  if (nextColumnIndex === 0) {
    const previousRow = canvases.slice(
      Math.max(0, nextCanvasIndex - MAX_CANVASES_PER_ROW),
      nextCanvasIndex,
    );
    const leftMostCanvas = getLeftMostCanvas(previousRow);

    return {
      x: leftMostCanvas.x,
      y: leftMostCanvas.y + leftMostCanvas.height + SNAP_GAP,
    };
  }

  const currentRowStartIndex =
    Math.floor(nextCanvasIndex / MAX_CANVASES_PER_ROW) * MAX_CANVASES_PER_ROW;
  const currentRow = canvases.slice(currentRowStartIndex, nextCanvasIndex);
  const rightMostCanvas = getRightMostCanvas(currentRow);

  return {
    x: rightMostCanvas.x + rightMostCanvas.width + SNAP_GAP,
    y: rightMostCanvas.y,
  };
};

const isCanvasOutsideViewport = ({
  canvas,
  viewport,
  boardSize,
  padding = 0,
}: {
  canvas: CanvasFrame;
  viewport: { x: number; y: number; scale: number };
  boardSize: { width: number; height: number };
  padding?: number;
}) => {
  if (!boardSize.width || !boardSize.height) {
    return false;
  }

  const left = canvas.x * viewport.scale + viewport.x;
  const top = canvas.y * viewport.scale + viewport.y;
  const right = left + canvas.width * viewport.scale;
  const bottom = top + canvas.height * viewport.scale;

  return (
    left < padding ||
    top < padding ||
    right > boardSize.width - padding ||
    bottom > boardSize.height - padding
  );
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
    description: "Images and links",
    content: <BoardUploadsPanel />,
  },
];

export const Board = () => {
  const setRoute = useRouter((state) => state.setRoute);

  const canvases = useCanvasStore((state) => state.canvases);
  const activeCanvasId = useCanvasStore((state) => state.activeCanvasId);
  const selectedCanvasId = useCanvasStore((state) => state.selectedCanvasId);
  const selectedImageId = useCanvasStore((state) => state.selectedImageId);
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
  const removeSelectedImage = useCanvasStore((state) => state.removeSelectedImage);
  const removeActiveCanvas = useCanvasStore((state) => state.removeActiveCanvas);
  const resetBoard = useCanvasStore((state) => state.resetBoard);

  const boardSize = useBoardViewportStore((state) => state.boardSize);
  const viewport = useBoardViewportStore((state) => state.viewport);
  const fitCanvas = useBoardViewportStore((state) => state.fitCanvas);
  const setViewport = useBoardViewportStore((state) => state.setViewport);
  const setCanPanBoard = useBoardViewportStore((state) => state.setCanPanBoard);

  const openSectionId = useBoardUiStore((state) => state.openSectionId);
  const isFileMenuOpen = useBoardUiStore((state) => state.isFileMenuOpen);
  const isPresetMenuOpen = useBoardUiStore((state) => state.isPresetMenuOpen);
  const isSidebarOpen = useBoardUiStore((state) => state.isSidebarOpen);
  const setOpenSectionId = useBoardUiStore((state) => state.setOpenSectionId);
  const setFileMenuOpen = useBoardUiStore((state) => state.setFileMenuOpen);
  const setPresetMenuOpen = useBoardUiStore((state) => state.setPresetMenuOpen);
  const setSidebarOpen = useBoardUiStore((state) => state.setSidebarOpen);

  const hasFittedInitialCanvasRef = useRef(false);

  const activeCanvas = useActiveCanvas();
  const shouldShowCenterCanvasButton = activeCanvas
    ? isCanvasOutsideViewport({
        canvas: activeCanvas,
        viewport,
        boardSize,
        padding: 24,
      })
    : false;

  useEffect(() => {
    if (canvases.length) return;
    initializeDefaultCanvas();
  }, [canvases.length, initializeDefaultCanvas]);

  useEffect(() => {
    setCanPanBoard(true);
  }, [setCanPanBoard]);

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

  const handleCenterActiveCanvas = () => {
    if (!activeCanvas || !boardSize.width || !boardSize.height) return;

    const scale = viewport.scale;
    const centerX = activeCanvas.x + activeCanvas.width / 2;
    const centerY = activeCanvas.y + activeCanvas.height / 2;

    setViewport({
      scale,
      x: boardSize.width / 2 - centerX * scale,
      y: boardSize.height / 2 - centerY * scale,
    });
  };

  const handleAddCanvas = () => {
    const preset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
    if (!preset.size) return;

    const position = getNextCanvasPosition(canvases);

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
      sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
      isSidebarOpen,
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
    delete: () => {
      if (selectedImageId) {
        removeSelectedImage();
        return;
      }

      removeActiveCanvas();
    },
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

  return (
    <main className="flex h-screen flex-col bg-bg">
      <BoardTopRibbon
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
          isOpen={isSidebarOpen}
          backgroundPresets={CANVAS_BACKGROUND_PRESETS}
          sections={BOARD_SIDEBAR_SECTIONS}
          openSectionId={openSectionId}
          onSectionToggle={(sectionId: BoardSidebarSectionId) => {
            setOpenSectionId(sectionId);
            setSidebarOpen(true);
          }}
          onBackgroundSelect={applyBackgroundToActiveCanvas}
          onToggleSidebar={setSidebarOpen}
        />

        <section className="relative min-w-0 flex-1 bg-bg">
          <BoardCanvas />

          {shouldShowCenterCanvasButton ? (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
              <button
                type="button"
                onClick={handleCenterActiveCanvas}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-card-bg/95 px-4 py-2 text-sm font-semibold text-title-color shadow-lg outline outline-1 outline-border-color/60 backdrop-blur"
              >
                <Icon icon="solar:target-linear" className="text-base" />
                <span>Center canvas</span>
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
};
