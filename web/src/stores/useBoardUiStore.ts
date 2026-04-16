import { create } from "zustand";

import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
} from "@/board/config";

type BoardSectionId = "background" | "elements" | "text" | "uploads";

type BoardUiState = {
  sidebarWidth: number;
  openSectionId: BoardSectionId;
  isFileMenuOpen: boolean;
  isPresetMenuOpen: boolean;
};

type BoardUiActions = {
  setSidebarWidth: (width: number) => void;
  resetSidebarWidth: () => void;
  setOpenSectionId: (sectionId: BoardSectionId) => void;
  setFileMenuOpen: (isOpen: boolean) => void;
  setPresetMenuOpen: (isOpen: boolean) => void;
};

const SIDEBAR_STORAGE_KEY = "snap-tool.board.sidebar-width";

const readSidebarWidth = () => {
  const savedWidth = Number.parseInt(
    window.localStorage.getItem(SIDEBAR_STORAGE_KEY) ?? "",
    10,
  );

  if (Number.isNaN(savedWidth)) {
    return DEFAULT_SIDEBAR_WIDTH;
  }

  return Math.min(Math.max(savedWidth, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
};

const persistSidebarWidth = (width: number) => {
  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(width));
};

export const useBoardUiStore = create<BoardUiState & BoardUiActions>((set) => ({
  sidebarWidth: readSidebarWidth(),
  openSectionId: "background",
  isFileMenuOpen: false,
  isPresetMenuOpen: false,

  setSidebarWidth: (width) => {
    const nextWidth = Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
    persistSidebarWidth(nextWidth);
    set({ sidebarWidth: nextWidth });
  },

  resetSidebarWidth: () => {
    persistSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    set({ sidebarWidth: DEFAULT_SIDEBAR_WIDTH });
  },

  setOpenSectionId: (openSectionId) => set({ openSectionId }),

  setFileMenuOpen: (isFileMenuOpen) => set({ isFileMenuOpen }),

  setPresetMenuOpen: (isPresetMenuOpen) => set({ isPresetMenuOpen }),
}));
