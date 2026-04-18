import { create } from "zustand";

import type { BoardSidebarSectionId } from "@/Components/board/types";

type BoardUiState = {
  openSectionId: BoardSidebarSectionId;
  isFileMenuOpen: boolean;
  isPresetMenuOpen: boolean;
  isSidebarOpen: boolean;
};

type BoardUiActions = {
  setOpenSectionId: (sectionId: BoardSidebarSectionId) => void;
  setFileMenuOpen: (isOpen: boolean) => void;
  setPresetMenuOpen: (isOpen: boolean) => void;
  setSidebarOpen: (isOpen: boolean) => void;
};

export const useBoardUiStore = create<BoardUiState & BoardUiActions>((set) => ({
  openSectionId: "overview",
  isFileMenuOpen: false,
  isPresetMenuOpen: false,
  isSidebarOpen: false,

  setOpenSectionId: (openSectionId) => set({ openSectionId }),

  setFileMenuOpen: (isFileMenuOpen) => set({ isFileMenuOpen }),

  setPresetMenuOpen: (isPresetMenuOpen) => set({ isPresetMenuOpen }),

  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
}));
