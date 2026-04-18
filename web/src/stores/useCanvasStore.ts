import { create } from "zustand";

import {
  DEFAULT_CANVAS_PRESET_ID,
  DEFAULT_BACKGROUND_PRESET_ID,
  createCanvasFrame,
  getCanvasBackgroundById,
  getCanvasPresetById,
  getCanvasPresetIdFromSize,
} from "@/board/config";
import type { BoardImageItem, CanvasFrame, CanvasSize } from "@/types/canvas";
import type { UploadLibraryAsset } from "@/types/uploads";

type CanvasState = {
  canvases: CanvasFrame[];
  activeCanvasId: string | null;
  selectedCanvasId: string | null;
  selectedImageId: string | null;
};

type CanvasActions = {
  initializeDefaultCanvas: () => CanvasFrame;
  addCanvas: (size: CanvasSize, position: { x: number; y: number }) => CanvasFrame;
  setActiveCanvas: (canvasId: string | null) => void;
  setSelectedCanvas: (canvasId: string | null) => void;
  moveCanvas: (canvasId: string, x: number, y: number) => void;
  resizeActiveCanvas: (size: CanvasSize) => void;
  applyBackgroundToActiveCanvas: (backgroundPresetId: string) => void;
  insertImageOnActiveCanvas: (asset: UploadLibraryAsset) => string | null;
  insertImageOnCanvasAtPoint: (
    asset: UploadLibraryAsset,
    canvasId: string,
    point: { x: number; y: number },
  ) => string | null;
  setSelectedImage: (imageId: string | null) => void;
  moveImageOnCanvas: (canvasId: string, imageId: string, x: number, y: number) => void;
  removeSelectedImage: () => void;
  removeActiveCanvas: () => void;
  resetBoard: (size: CanvasSize, position?: { x: number; y: number }) => CanvasFrame;
};

const MAX_INITIAL_IMAGE_SCALE = 0.8;
const IMAGE_INSERT_OFFSET_STEP = 18;
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getContainedImageSize = ({
  sourceWidth,
  sourceHeight,
  maxWidth,
  maxHeight,
}: {
  sourceWidth: number;
  sourceHeight: number;
  maxWidth: number;
  maxHeight: number;
}) => {
  const safeSourceWidth = Math.max(sourceWidth, 1);
  const safeSourceHeight = Math.max(sourceHeight, 1);
  const scale = Math.min(maxWidth / safeSourceWidth, maxHeight / safeSourceHeight, 1);

  return {
    width: Math.max(1, Math.round(safeSourceWidth * scale)),
    height: Math.max(1, Math.round(safeSourceHeight * scale)),
  };
};

const createBoardImageItem = (
  asset: UploadLibraryAsset,
  canvas: CanvasFrame,
  point?: { x: number; y: number },
): BoardImageItem => {
  const { width, height } = getContainedImageSize({
    sourceWidth: asset.width,
    sourceHeight: asset.height,
    maxWidth: canvas.width * MAX_INITIAL_IMAGE_SCALE,
    maxHeight: canvas.height * MAX_INITIAL_IMAGE_SCALE,
  });
  const maxX = Math.max(canvas.width - width, 0);
  const maxY = Math.max(canvas.height - height, 0);
  const offset = Math.min(canvas.images.length * IMAGE_INSERT_OFFSET_STEP, 72);
  const defaultX = Math.min(Math.max((canvas.width - width) / 2 + offset, 0), maxX);
  const defaultY = Math.min(Math.max((canvas.height - height) / 2 + offset, 0), maxY);
  const nextX =
    point ? clamp(point.x - width / 2, 0, maxX) : defaultX;
  const nextY =
    point ? clamp(point.y - height / 2, 0, maxY) : defaultY;

  return {
    id: crypto.randomUUID(),
    assetId: asset.id,
    x: nextX,
    y: nextY,
    width,
    height,
    alt: asset.name,
  };
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
  selectedImageId: null,

  initializeDefaultCanvas: () => {
    const existingCanvas = get().canvases[0];
    if (existingCanvas) return existingCanvas;

    const canvas = createDefaultCanvas({ x: 0, y: 0 }, 0);
    set({
      canvases: [canvas],
      activeCanvasId: canvas.id,
      selectedCanvasId: canvas.id,
      selectedImageId: null,
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
      selectedImageId: null,
    });

    return canvas;
  },

  setActiveCanvas: (canvasId) => set({ activeCanvasId: canvasId, selectedImageId: null }),

  setSelectedCanvas: (canvasId) => set({ selectedCanvasId: canvasId, selectedImageId: null }),

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

  insertImageOnActiveCanvas: (asset) => {
    const activeCanvas =
      get().canvases.find((canvas) => canvas.id === get().activeCanvasId) ??
      get().canvases[0];
    if (!activeCanvas) {
      return null;
    }

    const image = createBoardImageItem(asset, activeCanvas);

    set((state) => ({
      canvases: state.canvases.map((canvas) =>
        canvas.id === activeCanvas.id
          ? { ...canvas, images: [...canvas.images, image] }
          : canvas,
      ),
      activeCanvasId: activeCanvas.id,
      selectedCanvasId: activeCanvas.id,
      selectedImageId: image.id,
    }));

    return image.id;
  },

  insertImageOnCanvasAtPoint: (asset, canvasId, point) => {
    const canvas = get().canvases.find((currentCanvas) => currentCanvas.id === canvasId);
    if (!canvas) {
      return null;
    }

    const image = createBoardImageItem(asset, canvas, point);

    set((state) => ({
      canvases: state.canvases.map((currentCanvas) =>
        currentCanvas.id === canvas.id
          ? { ...currentCanvas, images: [...currentCanvas.images, image] }
          : currentCanvas,
      ),
      activeCanvasId: canvas.id,
      selectedCanvasId: canvas.id,
      selectedImageId: image.id,
    }));

    return image.id;
  },

  setSelectedImage: (imageId) => set({ selectedImageId: imageId }),

  moveImageOnCanvas: (canvasId, imageId, x, y) =>
    set((state) => ({
      canvases: state.canvases.map((canvas) =>
        canvas.id === canvasId
          ? {
              ...canvas,
              images: canvas.images.map((image) =>
                image.id === imageId ? { ...image, x, y } : image,
              ),
            }
          : canvas,
      ),
    })),

  removeSelectedImage: () =>
    set((state) => {
      if (!state.activeCanvasId || !state.selectedImageId) {
        return state;
      }

      return {
        canvases: state.canvases.map((canvas) =>
          canvas.id === state.activeCanvasId
            ? {
                ...canvas,
                images: canvas.images.filter((image) => image.id !== state.selectedImageId),
              }
            : canvas,
        ),
        selectedImageId: null,
      };
    }),

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
        selectedImageId: null,
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
      selectedImageId: null,
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
