import { create } from "zustand";

import {
  createObjectRef,
  getObjectRefKey,
  isSameObjectRef,
} from "@/canvas/objects";
import { getDefaultBoardTextInput } from "@/stores/useConfigStore";
import type {
  BoardObjectRef,
  BoardTextInput,
  BoardTextItem,
} from "@/types/canvas";

type SelectObjectOptions = {
  additive?: boolean;
  toggle?: boolean;
};

type EditorUiState = {
  openSectionId: string;
  isSidebarOpen: boolean;
  isFileMenuOpen: boolean;
  isPresetMenuOpen: boolean;
  selectedObjects: BoardObjectRef[];
  editingTextId: string | null;
  isBackgroundMoveMode: boolean;
  textDraft: BoardTextInput;
};

type EditorUiActions = {
  setOpenSectionId: (sectionId: string) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSection: (sectionId: string) => void;
  setFileMenuOpen: (isOpen: boolean) => void;
  setPresetMenuOpen: (isOpen: boolean) => void;
  setBackgroundMoveMode: (isActive: boolean) => void;
  setEditingTextId: (textId: string | null) => void;
  setSelectedObjects: (selectedObjects: BoardObjectRef[]) => void;
  selectImage: (imageId: string | null, options?: SelectObjectOptions) => void;
  selectText: (
    text: BoardTextItem | null,
    options?: SelectObjectOptions,
  ) => void;
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

const normalizeSelection = (selectedObjects: BoardObjectRef[]) => {
  const seen = new Set<string>();

  return selectedObjects.filter((ref) => {
    const key = getObjectRefKey(ref);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const updateSelection = (
  current: BoardObjectRef[],
  ref: BoardObjectRef | null,
  options?: SelectObjectOptions,
) => {
  if (!ref) {
    return [];
  }

  if (!options?.additive) {
    return [ref];
  }

  const exists = current.some((item) => isSameObjectRef(item, ref));
  if (exists) {
    return options.toggle
      ? current.filter((item) => !isSameObjectRef(item, ref))
      : current;
  }

  return [...current, ref];
};

export const useEditorUiStore = create<EditorUiState & EditorUiActions>(
  (set) => ({
    openSectionId: "overview",
    isSidebarOpen: true,
    isFileMenuOpen: false,
    isPresetMenuOpen: false,
    selectedObjects: [],
    editingTextId: null,
    isBackgroundMoveMode: false,
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
    setBackgroundMoveMode: (isBackgroundMoveMode) =>
      set({ isBackgroundMoveMode }),
    setEditingTextId: (editingTextId) => set({ editingTextId }),
    setSelectedObjects: (selectedObjects) =>
      set({
        selectedObjects: normalizeSelection(selectedObjects),
        editingTextId: null,
        isBackgroundMoveMode: false,
      }),
    selectImage: (imageId, options) =>
      set((state) => ({
        selectedObjects: normalizeSelection(
          updateSelection(
            state.selectedObjects,
            imageId ? createObjectRef("image", imageId) : null,
            options,
          ),
        ),
        editingTextId: null,
        isBackgroundMoveMode: false,
        textDraft: getDefaultBoardTextInput(),
      })),
    selectText: (text, options) =>
      set((state) => {
        const nextSelectedObjects = normalizeSelection(
          updateSelection(
            state.selectedObjects,
            text ? createObjectRef("text", text.id) : null,
            options,
          ),
        );
        const isSingleSelectedText =
          nextSelectedObjects.length === 1 &&
          nextSelectedObjects[0].kind === "text" &&
          text &&
          nextSelectedObjects[0].id === text.id;

        return {
          selectedObjects: nextSelectedObjects,
          editingTextId: null,
          isBackgroundMoveMode: false,
          textDraft: isSingleSelectedText
            ? mapTextToDraft(text)
            : getDefaultBoardTextInput(),
        };
      }),
    clearSelection: () =>
      set({
        selectedObjects: [],
        editingTextId: null,
        isBackgroundMoveMode: false,
        textDraft: getDefaultBoardTextInput(),
      }),
    updateTextDraft: (updates) =>
      set((state) => ({
        textDraft: {
          ...state.textDraft,
          ...updates,
        },
      })),
    resetTextDraft: () => set({ textDraft: getDefaultBoardTextInput() }),
  }),
);

export const useSelectedTextId = () =>
  useEditorUiStore((state) =>
    state.selectedObjects.length === 1 &&
    state.selectedObjects[0].kind === "text"
      ? state.selectedObjects[0].id
      : null,
  );

export const useSelectedObjectIds = () =>
  useEditorUiStore((state) => state.selectedObjects);

export const useTextDraft = () => useEditorUiStore((state) => state.textDraft);
