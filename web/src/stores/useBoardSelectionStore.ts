import { create } from "zustand";

type BoardSelectionState = {
  selectedImageId: string | null;
  selectedTextId: string | null;
};

type BoardSelectionActions = {
  setSelectedImage: (imageId: string | null) => void;
  setSelectedText: (textId: string | null) => void;
  clearSelection: () => void;
};

export const useBoardSelectionStore = create<
  BoardSelectionState & BoardSelectionActions
>((set) => ({
  selectedImageId: null,
  selectedTextId: null,

  setSelectedImage: (selectedImageId) => set({ selectedImageId, selectedTextId: null }),

  setSelectedText: (selectedTextId) => set({ selectedImageId: null, selectedTextId }),

  clearSelection: () => set({ selectedImageId: null, selectedTextId: null }),
}));
