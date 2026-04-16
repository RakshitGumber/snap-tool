import type { ReactNode } from "react";

import type {
  CanvasBackgroundPreset,
  CanvasFrame,
  CanvasPreset,
} from "@/types/canvas";

export type BoardMenuAction = {
  id: string;
  label: string;
  icon: string;
  tone?: "default" | "danger";
  onSelect: () => void;
};

export type BoardSidebarSectionId =
  | "background"
  | "elements"
  | "text"
  | "uploads";

export type BoardSidebarSection = {
  id: BoardSidebarSectionId;
  label: string;
  description: string;
  content?: ReactNode;
  isPlaceholder?: boolean;
};

export type BoardTopRibbonProps = {
  canvasCount: number;
  activeCanvas: CanvasFrame | null;
  activePreset: CanvasPreset;
  zoomPercentage: number;
  fileActions: BoardMenuAction[];
  presets: CanvasPreset[];
  isFileMenuOpen: boolean;
  isPresetMenuOpen: boolean;
  onFileMenuOpenChange: (isOpen: boolean) => void;
  onPresetMenuOpenChange: (isOpen: boolean) => void;
  onAddCanvas: () => void;
  onSelectPreset: (presetId: CanvasPreset["id"]) => void;
};

export type BoardSidebarProps = {
  activeCanvas: CanvasFrame | null;
  activeBackground: CanvasBackgroundPreset | null;
  backgroundPresets: CanvasBackgroundPreset[];
  sections: BoardSidebarSection[];
  openSectionId: BoardSidebarSectionId;
  onSectionToggle: (sectionId: BoardSidebarSectionId) => void;
  onBackgroundSelect: (backgroundPresetId: string) => void;
  onToggleSidebar: () => void;
};
