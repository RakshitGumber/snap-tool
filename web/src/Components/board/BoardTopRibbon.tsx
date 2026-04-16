import { ThemeButton } from "@/Components/ui/ThemeButton";

import { BoardAddCanvasButton } from "./BoardAddCanvasButton";
import { BoardFileMenu } from "./BoardFileMenu";
import { BoardPresetControl } from "./BoardPresetControl";
import type { BoardTopRibbonProps } from "./types";

export const BoardTopRibbon = ({
  canvasCount,
  activeCanvas,
  activePreset,
  zoomPercentage,
  fileActions,
  presets,
  isFileMenuOpen,
  isPresetMenuOpen,
  onFileMenuOpenChange,
  onPresetMenuOpenChange,
  onAddCanvas,
  onSelectPreset,
}: BoardTopRibbonProps) => {
  return (
    <header className="relative z-40 flex items-center justify-between gap-4 border-b-2 border-accent bg-card-bg/95 px-4 py-3 backdrop-blur-3xl">
      <div className="flex min-w-0 items-center gap-3">
        <BoardFileMenu
          actions={fileActions}
          isOpen={isFileMenuOpen}
          onOpenChange={onFileMenuOpenChange}
        />

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-title-color">
            {activeCanvas?.title ?? "Canvas"}
          </p>
          <p className="text-xs text-secondary-text">
            {canvasCount} {canvasCount === 1 ? "canvas" : "canvases"} •{" "}
            {zoomPercentage}% zoom
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <BoardAddCanvasButton onClick={onAddCanvas} />
        <BoardPresetControl
          activePreset={activePreset}
          presets={presets}
          isPresetMenuOpen={isPresetMenuOpen}
          onPresetMenuOpenChange={onPresetMenuOpenChange}
          onSelectPreset={onSelectPreset}
        />
        <ThemeButton />
      </div>
    </header>
  );
};
