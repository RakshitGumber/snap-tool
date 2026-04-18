import { create } from "zustand";

type BoardSectionId = "background" | "elements" | "text" | "uploads";

type BoardUiState = {
  openSectionId: BoardSectionId;
  isFileMenuOpen: boolean;
  isPresetMenuOpen: boolean;
  isSidebarOpen: boolean;
};

type BoardUiActions = {
  setOpenSectionId: (sectionId: BoardSectionId) => void;
  setFileMenuOpen: (isOpen: boolean) => void;
  setPresetMenuOpen: (isOpen: boolean) => void;
  setSidebarOpen: (isOpen: boolean) => void;
};

export const useBoardUiStore = create<BoardUiState & BoardUiActions>((set) => ({
  openSectionId: "background",
  isFileMenuOpen: false,
  isPresetMenuOpen: false,
  isSidebarOpen: false,

  setOpenSectionId: (openSectionId) => set({ openSectionId }),

  setFileMenuOpen: (isFileMenuOpen) => set({ isFileMenuOpen }),

  setPresetMenuOpen: (isPresetMenuOpen) => set({ isPresetMenuOpen }),

  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
}));
