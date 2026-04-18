import { useActiveCanvasPreset } from "@/stores/useCanvasStore";

import { BoardFileMenu } from "./BoardFileMenu";
import { BoardPresetControl } from "./BoardPresetControl";
import type { BoardTopRibbonProps } from "./types";

export const BoardTopRibbon = ({
  fileActions,
  presetGroups,
  isFileMenuOpen,
  isPresetMenuOpen,
  onFileMenuOpenChange,
  onPresetMenuOpenChange,
  onSelectPreset,
}: BoardTopRibbonProps) => {
  const activePreset = useActiveCanvasPreset();

  return (
    <header className="relative z-40 flex items-center gap-4 border-b-2 border-accent bg-card-bg/95 px-4 py-3 backdrop-blur-3xl">
      <div className="flex min-w-0 items-center gap-1">
        <BoardFileMenu
          actions={fileActions}
          isOpen={isFileMenuOpen}
          onOpenChange={onFileMenuOpenChange}
        />
        <BoardPresetControl
          activePreset={activePreset}
          presetGroups={presetGroups}
          isPresetMenuOpen={isPresetMenuOpen}
          onPresetMenuOpenChange={onPresetMenuOpenChange}
          onSelectPreset={onSelectPreset}
        />
      </div>
    </header>
  );
};
