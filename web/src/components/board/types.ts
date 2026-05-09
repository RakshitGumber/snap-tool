import type { ReactNode } from "react";

export type BoardSidebarSection = {
  id: string;
  label: string;
  content?: ReactNode;
  isPlaceholder?: boolean;
};
