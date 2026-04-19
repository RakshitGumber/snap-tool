import type { ReactNode } from "react";

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
