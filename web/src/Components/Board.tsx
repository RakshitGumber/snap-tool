import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BoardBackgroundPanel,
  BoardOverviewPanel,
  BoardSidebar,
  BoardTextPanel,
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
  getCanvasPresetById,
} from "@/board/config";
import { BoardCanvas } from "@/canvas";
import { CanvasShortcuts } from "@/canvas/canvasShorcuts";
import { exportBoardImage, type BoardImageExportFormat } from "@/canvas/exportImage";
import { useKeyboardShortcuts } from "@/canvas/useKeyBindings";
import { useRouter } from "@/pages/routerStore";
import { useBoardUiStore } from "@/stores/useBoardUiStore";
import {
  useCanvasShell,
  useCanvasStore,
  useSelectedImageId,
  useSelectedTextId,
} from "@/stores/useCanvasStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import type { CanvasPresetId } from "@/types/canvas";

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

const downloadBlobFile = (filename: string, blob: Blob) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

export const Board = () => {
  const setRoute = useRouter((state) => state.setRoute);
  const [exportFormat, setExportFormat] = useState<BoardImageExportFormat | null>(null);

  const selectedImageId = useSelectedImageId();
  const selectedTextId = useSelectedTextId();
  const canvasShell = useCanvasShell();
  const initializeDefaultCanvas = useCanvasStore(
    (state) => state.initializeDefaultCanvas,
  );
  const resizeCanvas = useCanvasStore((state) => state.resizeCanvas);
  const applyBackgroundToCanvas = useCanvasStore(
    (state) => state.applyBackgroundToCanvas,
  );
  const removeSelectedImage = useCanvasStore((state) => state.removeSelectedImage);
  const removeSelectedText = useCanvasStore((state) => state.removeSelectedText);
  const resetCanvas = useCanvasStore((state) => state.resetCanvas);
  const serializeCanvas = useCanvasStore((state) => state.serializeCanvas);
  const resolveAssetMedia = useUploadLibraryStore((state) => state.resolveAssetMedia);

  const openSectionId = useBoardUiStore((state) => state.openSectionId);
  const isFileMenuOpen = useBoardUiStore((state) => state.isFileMenuOpen);
  const isPresetMenuOpen = useBoardUiStore((state) => state.isPresetMenuOpen);
  const isSidebarOpen = useBoardUiStore((state) => state.isSidebarOpen);
  const setOpenSectionId = useBoardUiStore((state) => state.setOpenSectionId);
  const setFileMenuOpen = useBoardUiStore((state) => state.setFileMenuOpen);
  const setPresetMenuOpen = useBoardUiStore((state) => state.setPresetMenuOpen);
  const setSidebarOpen = useBoardUiStore((state) => state.setSidebarOpen);

  useEffect(() => {
    if (canvasShell) return;
    initializeDefaultCanvas();
  }, [canvasShell, initializeDefaultCanvas]);

  const handleSelectPreset = useCallback((presetId: CanvasPresetId) => {
    const preset = getCanvasPresetById(presetId);
    resizeCanvas(preset.size, preset.id);
  }, [resizeCanvas]);

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

  const handleDownloadImage = useCallback(
    async (format: BoardImageExportFormat) => {
      if (exportFormat) {
        return;
      }

      const nextCanvas = serializeCanvas();
      if (!nextCanvas) {
        return;
      }

      const timestamp = new Date().toISOString().replaceAll(":", "-");
      setExportFormat(format);

      try {
        const blob = await exportBoardImage({
          canvas: nextCanvas,
          format,
          resolveImageSrc: async (assetId) => {
            const media = await resolveAssetMedia(assetId, "full");
            if (!media?.src) {
              throw new Error("One of the board images is missing its full-size source.");
            }

            return media.src;
          },
        });

        downloadBlobFile(`snap-canvas-${timestamp}.${format === "png" ? "png" : "jpg"}`, blob);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to export the board image.";
        window.alert(message);
      } finally {
        setExportFormat(null);
      }
    },
    [exportFormat, resolveAssetMedia, serializeCanvas],
  );

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

  const fileActions = useMemo<BoardMenuAction[]>(
    () => [
      {
        id: "home",
        label: "Home",
        icon: "solar:home-linear",
        onSelect: () => setRoute("/"),
      },
      {
        id: "save",
        label: "Save canvas",
        icon: "solar:diskette-linear",
        onSelect: handleSaveCanvas,
      },
      {
        id: "download-png",
        label: exportFormat === "png" ? "Exporting PNG..." : "Download PNG",
        icon: "solar:gallery-export-linear",
        onSelect: () => {
          void handleDownloadImage("png");
        },
      },
      {
        id: "download-jpg",
        label: exportFormat === "jpeg" ? "Exporting JPG..." : "Download JPG",
        icon: "solar:gallery-send-linear",
        onSelect: () => {
          void handleDownloadImage("jpeg");
        },
      },
      {
        id: "clear",
        label: "Clear canvas",
        icon: "solar:trash-bin-trash-linear",
        tone: "danger",
        onSelect: handleClearCanvas,
      },
    ],
    [exportFormat, handleClearCanvas, handleDownloadImage, handleSaveCanvas, setRoute],
  );

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
    <main className="flex h-screen flex-col bg-bg">
      <BoardTopRibbon
        fileActions={fileActions}
        presetGroups={CANVAS_PRESET_GROUPS}
        isFileMenuOpen={isFileMenuOpen}
        isPresetMenuOpen={isPresetMenuOpen}
        onFileMenuOpenChange={setFileMenuOpen}
        onPresetMenuOpenChange={setPresetMenuOpen}
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
        </section>
      </div>
    </main>
  );
};
