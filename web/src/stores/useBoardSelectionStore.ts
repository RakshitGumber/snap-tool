import { create } from "zustand";

type BoardSelectionState = {
  selectedImageId: string | null;
};

type BoardSelectionActions = {
  setSelectedImage: (imageId: string | null) => void;
  clearSelection: () => void;
};

export const useBoardSelectionStore = create<
  BoardSelectionState & BoardSelectionActions
>((set) => ({
  selectedImageId: null,

  setSelectedImage: (selectedImageId) => set({ selectedImageId }),

  clearSelection: () => set({ selectedImageId: null }),
}));
