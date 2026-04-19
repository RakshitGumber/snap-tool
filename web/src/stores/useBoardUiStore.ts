import { create } from "zustand";

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
