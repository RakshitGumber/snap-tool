import { create } from "zustand";

type BoardSelectionState = {
  activeCanvasId: string | null;
  selectedCanvasId: string | null;
  selectedImageId: string | null;
};

type BoardSelectionActions = {
  setActiveCanvas: (canvasId: string | null) => void;
  setSelectedCanvas: (canvasId: string | null) => void;
  setSelectedImage: (imageId: string | null) => void;
  resetSelection: (canvasId: string | null) => void;
};

export const useBoardSelectionStore = create<
  BoardSelectionState & BoardSelectionActions
>((set) => ({
  activeCanvasId: null,
  selectedCanvasId: null,
  selectedImageId: null,

  setActiveCanvas: (activeCanvasId) => set({ activeCanvasId, selectedImageId: null }),

  setSelectedCanvas: (selectedCanvasId) =>
    set({ selectedCanvasId, selectedImageId: null }),

  setSelectedImage: (selectedImageId) => set({ selectedImageId }),

  resetSelection: (canvasId) =>
    set({
      activeCanvasId: canvasId,
      selectedCanvasId: canvasId,
      selectedImageId: null,
    }),
}));
