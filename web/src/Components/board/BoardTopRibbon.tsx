import { ThemeButton } from "@/Components/ui/ThemeButton";
import { useActiveCanvasPreset } from "@/stores/useCanvasStore";

import { BoardAddCanvasButton } from "./BoardAddCanvasButton";
import { BoardFileMenu } from "./BoardFileMenu";
import { BoardPresetControl } from "./BoardPresetControl";
import type { BoardTopRibbonProps } from "./types";

export const BoardTopRibbon = ({
  fileActions,
  presets,
  isFileMenuOpen,
  isPresetMenuOpen,
  onFileMenuOpenChange,
  onPresetMenuOpenChange,
  onAddCanvas,
  onSelectPreset,
}: BoardTopRibbonProps) => {
  const activePreset = useActiveCanvasPreset();

  return (
    <header className="relative z-40 flex items-center justify-between gap-4 border-b-2 border-accent bg-card-bg/95 px-4 py-3 backdrop-blur-3xl">
      <div className="flex min-w-0 items-center gap-1">
        <BoardFileMenu
          actions={fileActions}
          isOpen={isFileMenuOpen}
          onOpenChange={onFileMenuOpenChange}
        />
        <BoardAddCanvasButton onClick={onAddCanvas} />
        <BoardPresetControl
          activePreset={activePreset}
          presets={presets}
          isPresetMenuOpen={isPresetMenuOpen}
          onPresetMenuOpenChange={onPresetMenuOpenChange}
          onSelectPreset={onSelectPreset}
        />
      </div>

      <div className="flex items-center gap-1">
        <ThemeButton />
      </div>
    </header>
  );
};
