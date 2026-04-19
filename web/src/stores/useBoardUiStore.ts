import { create } from "zustand";

import type { BoardSidebarSectionId } from "@/components/board/types";

type BoardUiState = {
  openSectionId: BoardSidebarSectionId;
  isFileMenuOpen: boolean;
  isPresetMenuOpen: boolean;
  isSidebarOpen: boolean;
};

type BoardUiActions = {
  setOpenSectionId: (openSectionId: BoardSidebarSectionId) => void;
  setFileMenuOpen: (isFileMenuOpen: boolean) => void;
  setPresetMenuOpen: (isPresetMenuOpen: boolean) => void;
  setSidebarOpen: (isSidebarOpen: boolean) => void;
  toggleSection: (sectionId: BoardSidebarSectionId) => void;
};

export const useBoardUiStore = create<BoardUiState & BoardUiActions>((set) => ({
  openSectionId: "overview",
  isFileMenuOpen: false,
  isPresetMenuOpen: false,
  isSidebarOpen: true,

  setOpenSectionId: (openSectionId) => set({ openSectionId }),

  setFileMenuOpen: (isFileMenuOpen) => set({ isFileMenuOpen }),

  setPresetMenuOpen: (isPresetMenuOpen) => set({ isPresetMenuOpen }),

  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

  toggleSection: (sectionId) =>
    set((state) => ({
      openSectionId: sectionId,
      isSidebarOpen:
        state.openSectionId === sectionId ? !state.isSidebarOpen : true,
    })),
}));
