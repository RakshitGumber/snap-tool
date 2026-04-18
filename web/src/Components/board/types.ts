import type { ReactNode } from "react";

import type { CanvasPreset, CanvasPresetGroup } from "@/types/canvas";

export type BoardMenuAction = {
  id: string;
  label: string;
  icon: string;
  tone?: "default" | "danger";
  onSelect: () => void;
};

export type BoardSidebarSectionId =
  | "overview"
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
  fileActions: BoardMenuAction[];
  presetGroups: CanvasPresetGroup[];
  isFileMenuOpen: boolean;
  isPresetMenuOpen: boolean;
  onFileMenuOpenChange: (isOpen: boolean) => void;
  onPresetMenuOpenChange: (isOpen: boolean) => void;
  onAddCanvas: () => void;
  onSelectPreset: (presetId: CanvasPreset["id"]) => void;
};

export type BoardSidebarProps = {
  isOpen: boolean;
  sections: BoardSidebarSection[];
  openSectionId: BoardSidebarSectionId;
  onSectionToggle: (sectionId: BoardSidebarSectionId) => void;
  onToggleSidebar: (isOpen: boolean) => void;
};
