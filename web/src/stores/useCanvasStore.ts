import { create } from "zustand";

import {
  DEFAULT_CANVAS_PRESET_ID,
  DEFAULT_BACKGROUND_PRESET_ID,
  createCanvasFrame,
  getCanvasBackgroundById,
  getCanvasPresetById,
  getCanvasPresetIdFromSize,
} from "@/board/config";
import type { CanvasFrame, CanvasSize } from "@/types/canvas";

type CanvasState = {
  canvases: CanvasFrame[];
  activeCanvasId: string | null;
  selectedCanvasId: string | null;
};

type CanvasActions = {
  initializeDefaultCanvas: () => CanvasFrame;
  addCanvas: (size: CanvasSize, position: { x: number; y: number }) => CanvasFrame;
  setActiveCanvas: (canvasId: string | null) => void;
  setSelectedCanvas: (canvasId: string | null) => void;
  moveCanvas: (canvasId: string, x: number, y: number) => void;
  resizeActiveCanvas: (size: CanvasSize) => void;
  applyBackgroundToActiveCanvas: (backgroundPresetId: string) => void;
  removeActiveCanvas: () => void;
  resetBoard: (size: CanvasSize, position?: { x: number; y: number }) => CanvasFrame;
};

const createDefaultCanvas = (position: { x: number; y: number }, index: number) => {
  const preset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
  const size = preset.size ?? { width: 500, height: 500 };

  return createCanvasFrame(size, position, index);
};

export const useCanvasStore = create<CanvasState & CanvasActions>((set, get) => ({
  canvases: [],
  activeCanvasId: null,
  selectedCanvasId: null,

  initializeDefaultCanvas: () => {
    const existingCanvas = get().canvases[0];
    if (existingCanvas) return existingCanvas;

    const canvas = createDefaultCanvas({ x: 0, y: 0 }, 0);
    set({
      canvases: [canvas],
      activeCanvasId: canvas.id,
      selectedCanvasId: canvas.id,
    });

    return canvas;
  },

  addCanvas: (size, position) => {
    const { canvases } = get();
    const canvas = createCanvasFrame(size, position, canvases.length);

    set({
      canvases: [...canvases, canvas],
      activeCanvasId: canvas.id,
      selectedCanvasId: canvas.id,
    });

    return canvas;
  },

  setActiveCanvas: (canvasId) => set({ activeCanvasId: canvasId }),

  setSelectedCanvas: (canvasId) => set({ selectedCanvasId: canvasId }),

  moveCanvas: (canvasId, x, y) =>
    set((state) => ({
      canvases: state.canvases.map((canvas) =>
        canvas.id === canvasId ? { ...canvas, x, y } : canvas,
      ),
    })),

  resizeActiveCanvas: (size) =>
    set((state) => ({
      canvases: state.canvases.map((canvas) =>
        canvas.id === state.activeCanvasId
          ? { ...canvas, width: size.width, height: size.height }
          : canvas,
      ),
    })),

  applyBackgroundToActiveCanvas: (backgroundPresetId) => {
    const backgroundPreset = getCanvasBackgroundById(backgroundPresetId);

    set((state) => ({
      canvases: state.canvases.map((canvas) =>
        canvas.id === state.activeCanvasId
          ? {
              ...canvas,
              backgroundPresetId: backgroundPreset.id,
              background: backgroundPreset.value,
            }
          : canvas,
      ),
    }));
  },

  removeActiveCanvas: () =>
    set((state) => {
      if (!state.activeCanvasId || state.canvases.length <= 1) {
        return state;
      }

      const remainingCanvases = state.canvases.filter(
        (canvas) => canvas.id !== state.activeCanvasId,
      );
      const nextActiveCanvas = remainingCanvases.at(-1) ?? null;

      return {
        canvases: remainingCanvases,
        activeCanvasId: nextActiveCanvas?.id ?? null,
        selectedCanvasId: nextActiveCanvas?.id ?? null,
      };
    }),

  resetBoard: (size, position = { x: 0, y: 0 }) => {
    const canvas = createCanvasFrame(
      size,
      position,
      0,
      DEFAULT_BACKGROUND_PRESET_ID,
    );

    set({
      canvases: [canvas],
      activeCanvasId: canvas.id,
      selectedCanvasId: canvas.id,
    });

    return canvas;
  },
}));

export const useActiveCanvas = () =>
  useCanvasStore((state) =>
    state.canvases.find((canvas) => canvas.id === state.activeCanvasId) ??
    state.canvases[0] ??
    null,
  );

export const useActiveCanvasPreset = () =>
  useCanvasStore((state) => {
    const activeCanvas =
      state.canvases.find((canvas) => canvas.id === state.activeCanvasId) ??
      state.canvases[0] ??
      null;

    if (!activeCanvas) {
      return getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
    }

    return getCanvasPresetById(
      getCanvasPresetIdFromSize({
        width: activeCanvas.width,
        height: activeCanvas.height,
      }),
    );
  });

export const useActiveCanvasBackground = () =>
  useCanvasStore((state) => {
    const activeCanvas =
      state.canvases.find((canvas) => canvas.id === state.activeCanvasId) ??
      state.canvases[0] ??
      null;

    return activeCanvas
      ? getCanvasBackgroundById(activeCanvas.backgroundPresetId)
      : null;
  });
