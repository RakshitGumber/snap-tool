import { useEffect, useRef } from "react";

import { Icon } from "@iconify/react";

import {
  BoardBackgroundPanel,
  BoardOverviewPanel,
  BoardSidebar,
  BoardTopRibbon,
  BoardUploadsPanel,
  type BoardMenuAction,
  type BoardSidebarSection,
  type BoardSidebarSectionId,
} from "@/Components/board/index";
import {
  CANVAS_BACKGROUND_PRESETS,
  CANVAS_PRESET_GROUPS,
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
import { useBoardSelectionStore } from "@/stores/useBoardSelectionStore";
import { useBoardUiStore } from "@/stores/useBoardUiStore";
import { useBoardViewportStore } from "@/stores/useBoardViewportStore";
import {
  useActiveCanvas,
  useActiveCanvasId,
  useCanvasIds,
  useCanvasStore,
  useSelectedCanvasId,
  useSelectedImageId,
} from "@/stores/useCanvasStore";
import type {
  CanvasNavigationDirection,
  CanvasPresetId,
  CanvasRecord,
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

type PositionedCanvas = Pick<CanvasRecord, "x" | "y" | "width" | "height">;

const getLeftMostCanvas = (canvases: PositionedCanvas[]) =>
  canvases.reduce((leftMost, canvas) => (canvas.x < leftMost.x ? canvas : leftMost));

const getRightMostCanvas = (canvases: PositionedCanvas[]) =>
  canvases.reduce((rightMost, canvas) =>
    canvas.x + canvas.width > rightMost.x + rightMost.width ? canvas : rightMost,
  );

const getNextCanvasPosition = (canvases: PositionedCanvas[]) => {
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
  canvas: Pick<CanvasRecord, "x" | "y" | "width" | "height">;
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

export const Board = () => {
  const setRoute = useRouter((state) => state.setRoute);

  const canvasIds = useCanvasIds();
  const activeCanvasId = useActiveCanvasId();
  const selectedCanvasId = useSelectedCanvasId();
  const selectedImageId = useSelectedImageId();
  const activeCanvas = useActiveCanvas();

  const initializeDefaultCanvas = useCanvasStore(
    (state) => state.initializeDefaultCanvas,
  );
  const addCanvas = useCanvasStore((state) => state.addCanvas);
  const resizeActiveCanvas = useCanvasStore((state) => state.resizeActiveCanvas);
  const applyBackgroundToActiveCanvas = useCanvasStore(
    (state) => state.applyBackgroundToActiveCanvas,
  );
  const removeSelectedImage = useCanvasStore((state) => state.removeSelectedImage);
  const removeActiveCanvas = useCanvasStore((state) => state.removeActiveCanvas);
  const resetBoard = useCanvasStore((state) => state.resetBoard);
  const serializeBoard = useCanvasStore((state) => state.serializeBoard);

  const setActiveCanvas = useBoardSelectionStore((state) => state.setActiveCanvas);
  const setSelectedCanvas = useBoardSelectionStore((state) => state.setSelectedCanvas);

  const boardSize = useBoardViewportStore((state) => state.boardSize);
  const viewport = useBoardViewportStore((state) => state.viewport);
  const fitCanvas = useBoardViewportStore((state) => state.fitCanvas);
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
  const previousActiveCanvasSizeRef = useRef<{
    canvasId: string | null;
    width: number;
    height: number;
  } | null>(null);
  const previousBoardSizeRef = useRef(boardSize);
  const shouldShowCenterCanvasButton = activeCanvas
    ? isCanvasOutsideViewport({
        canvas: activeCanvas,
        viewport,
        boardSize,
        padding: 24,
      })
    : false;

  useEffect(() => {
    if (canvasIds.length) return;
    initializeDefaultCanvas();
  }, [canvasIds.length, initializeDefaultCanvas]);

  useEffect(() => {
    setCanPanBoard(true);
  }, [setCanPanBoard]);

  useEffect(() => {
    if (!activeCanvas || !boardSize.width || !boardSize.height) {
      return;
    }

    const previousCanvasSize = previousActiveCanvasSizeRef.current;
    const previousBoardSize = previousBoardSizeRef.current;
    const hasCanvasResized =
      previousCanvasSize?.canvasId === activeCanvas.id &&
      (previousCanvasSize.width !== activeCanvas.width ||
        previousCanvasSize.height !== activeCanvas.height);
    const hasBoardResized =
      previousBoardSize.width !== boardSize.width ||
      previousBoardSize.height !== boardSize.height;
    const shouldRefitForBoardResize =
      hasBoardResized &&
      isCanvasOutsideViewport({
        canvas: activeCanvas,
        viewport,
        boardSize,
        padding: FIT_PADDING,
      });

    previousActiveCanvasSizeRef.current = {
      canvasId: activeCanvas.id,
      width: activeCanvas.width,
      height: activeCanvas.height,
    };
    previousBoardSizeRef.current = boardSize;

    if (
      !hasFittedInitialCanvasRef.current ||
      hasCanvasResized ||
      shouldRefitForBoardResize
    ) {
      fitCanvas(activeCanvas, FIT_PADDING);
      hasFittedInitialCanvasRef.current = true;
    }
  }, [
    activeCanvas,
    boardSize,
    fitCanvas,
    viewport,
  ]);

  const focusCanvas = (canvasId: string | null) => {
    const nextCanvas = serializeBoard().find((canvas) => canvas.id === canvasId);
    if (!nextCanvas) return;

    setActiveCanvas(nextCanvas.id);
    setSelectedCanvas(nextCanvas.id);
    fitCanvas(nextCanvas, FIT_PADDING);
  };

  const handleCenterActiveCanvas = () => {
    if (!activeCanvas || !boardSize.width || !boardSize.height) return;
    fitCanvas(activeCanvas, FIT_PADDING);
  };

  const handleAddCanvas = () => {
    const preset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
    if (!preset.size) return;

    const position = getNextCanvasPosition(serializeBoard());
    addCanvas(preset.size, position);
    setPresetMenuOpen(false);
    setFileMenuOpen(false);
  };

  const handleSelectPreset = (presetId: CanvasPresetId) => {
    const preset = getCanvasPresetById(presetId);
    resizeActiveCanvas(preset.size, preset.id);
  };

  const handleFocusDirection = (direction: CanvasNavigationDirection) => {
    const nextCanvasId = getNearestCanvasInDirection(
      serializeBoard(),
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
      canvases: serializeBoard(),
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

  const sidebarSections: BoardSidebarSection[] = [
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
          onBackgroundSelect={applyBackgroundToActiveCanvas}
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

  return (
    <main className="flex h-screen flex-col bg-bg">
      <BoardTopRibbon
        fileActions={fileActions}
        presetGroups={CANVAS_PRESET_GROUPS}
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

          {shouldShowCenterCanvasButton ? (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
              <button
                type="button"
                onClick={handleCenterActiveCanvas}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-card-bg/95 px-4 py-2 text-sm font-semibold text-title-color shadow-lg outline outline-1 outline-border-color/60 backdrop-blur"
              >
                <Icon icon="solar:target-linear" className="text-base" />
                <span>Fit canvas</span>
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
};
