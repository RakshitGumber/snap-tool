import type { ReactNode } from "react";
import type { BoardSidebarSectionId } from "@/types/board";

export type BoardSidebarSection = {
  id: BoardSidebarSectionId;
  label: string;
  description: string;
  content?: ReactNode;
  isPlaceholder?: boolean;
};
