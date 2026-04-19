import { create } from "zustand";

import type { BoardSidebarSectionId } from "@/types/board";
import { getDefaultBoardTextInput } from "@/stores/useConfigStore";
import type {
  BoardTextInput,
  BoardTextItem,
  CanvasPresetGroupId,
} from "@/types/canvas";

type EditorUiState = {
  openSectionId: BoardSidebarSectionId;
  isSidebarOpen: boolean;
  isFileMenuOpen: boolean;
  isPresetMenuOpen: boolean;
  activePresetGroupId: CanvasPresetGroupId | null;
  selectedImageId: string | null;
  selectedTextId: string | null;
  textDraft: BoardTextInput;
};

type EditorUiActions = {
  setOpenSectionId: (sectionId: BoardSidebarSectionId) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSection: (sectionId: BoardSidebarSectionId) => void;
  setFileMenuOpen: (isOpen: boolean) => void;
  setPresetMenuOpen: (isOpen: boolean) => void;
  setActivePresetGroupId: (groupId: CanvasPresetGroupId | null) => void;
  selectImage: (imageId: string | null) => void;
  selectText: (text: BoardTextItem | null) => void;
  clearSelection: () => void;
  updateTextDraft: (updates: Partial<BoardTextInput>) => void;
  resetTextDraft: () => void;
};

const mapTextToDraft = (text: BoardTextItem | null): BoardTextInput =>
  text
    ? {
        text: text.text,
        fontFamily: text.fontFamily,
        fontSize: text.fontSize,
        fontWeight: text.fontWeight,
        color: text.color,
        align: text.align,
        maxWidth: text.maxWidth,
      }
    : getDefaultBoardTextInput();

export const useEditorUiStore = create<EditorUiState & EditorUiActions>((set) => ({
  openSectionId: "overview",
  isSidebarOpen: true,
  isFileMenuOpen: false,
  isPresetMenuOpen: false,
  activePresetGroupId: null,
  selectedImageId: null,
  selectedTextId: null,
  textDraft: getDefaultBoardTextInput(),

  setOpenSectionId: (openSectionId) => set({ openSectionId }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  toggleSection: (sectionId) =>
    set((state) => ({
      openSectionId: sectionId,
      isSidebarOpen:
        state.openSectionId === sectionId ? !state.isSidebarOpen : true,
    })),
  setFileMenuOpen: (isFileMenuOpen) => set({ isFileMenuOpen }),
  setPresetMenuOpen: (isPresetMenuOpen) => set({ isPresetMenuOpen }),
  setActivePresetGroupId: (activePresetGroupId) => set({ activePresetGroupId }),
  selectImage: (selectedImageId) =>
    set({
      selectedImageId,
      selectedTextId: null,
    }),
  selectText: (text) =>
    set({
      selectedImageId: null,
      selectedTextId: text?.id ?? null,
      textDraft: mapTextToDraft(text),
    }),
  clearSelection: () =>
    set({
      selectedImageId: null,
      selectedTextId: null,
    }),
  updateTextDraft: (updates) =>
    set((state) => ({
      textDraft: {
        ...state.textDraft,
        ...updates,
      },
    })),
  resetTextDraft: () => set({ textDraft: getDefaultBoardTextInput() }),
}));

export const useSelectedTextId = () =>
  useEditorUiStore((state) => state.selectedTextId);

export const useTextDraft = () => useEditorUiStore((state) => state.textDraft);
