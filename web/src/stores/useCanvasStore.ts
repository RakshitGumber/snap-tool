import { create } from "zustand";

import {
  DEFAULT_BACKGROUND_PRESET_ID,
  DEFAULT_CANVAS_PRESET_ID,
  createCanvasFrame,
  getCanvasBackgroundById,
  getCanvasPresetById,
  getCanvasPresetGroupById,
  resolveCanvasPreset,
} from "@/board/config";
import { useBoardSelectionStore } from "@/stores/useBoardSelectionStore";
import type {
  BoardImageItem,
  CanvasFrame,
  CanvasPresetId,
  CanvasRecord,
  CanvasSize,
} from "@/types/canvas";
import type { UploadLibraryAsset } from "@/types/uploads";

type CanvasState = {
  canvas: CanvasRecord | null;
};

type CanvasActions = {
  initializeDefaultCanvas: () => CanvasFrame;
  resizeCanvas: (size: CanvasSize, presetId?: CanvasPresetId | null) => void;
  applyBackgroundToCanvas: (backgroundPresetId: string) => void;
  insertImageOnActiveCanvas: (asset: UploadLibraryAsset) => string | null;
  insertImageOnCanvasAtPoint: (
    asset: UploadLibraryAsset,
    point: { x: number; y: number },
  ) => string | null;
  moveImageOnCanvas: (imageId: string, x: number, y: number) => void;
  removeSelectedImage: () => void;
  resetCanvas: (size: CanvasSize) => CanvasFrame;
  serializeCanvas: () => CanvasFrame | null;
};

const MAX_INITIAL_IMAGE_SCALE = 0.8;
const IMAGE_INSERT_OFFSET_STEP = 18;
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const normalizeCanvasFrame = (canvas: CanvasFrame): CanvasRecord => ({
  id: canvas.id,
  title: canvas.title,
  width: canvas.width,
  height: canvas.height,
  presetId: canvas.presetId ?? null,
  background: canvas.background,
  backgroundPresetId: canvas.backgroundPresetId,
  imageOrder: canvas.images.map((image) => image.id),
  imagesById: Object.fromEntries(canvas.images.map((image) => [image.id, image])),
});

const serializeCanvasRecord = (canvas: CanvasRecord): CanvasFrame => ({
  id: canvas.id,
  title: canvas.title,
  width: canvas.width,
  height: canvas.height,
  presetId: canvas.presetId,
  background: canvas.background,
  backgroundPresetId: canvas.backgroundPresetId,
  images: canvas.imageOrder
    .map((imageId) => canvas.imagesById[imageId])
    .filter((image): image is BoardImageItem => image !== undefined),
});

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
  canvas: CanvasRecord,
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
  const offset = Math.min(canvas.imageOrder.length * IMAGE_INSERT_OFFSET_STEP, 72);
  const defaultX = Math.min(Math.max((canvas.width - width) / 2 + offset, 0), maxX);
  const defaultY = Math.min(Math.max((canvas.height - height) / 2 + offset, 0), maxY);

  return {
    id: crypto.randomUUID(),
    assetId: asset.id,
    x: point ? clamp(point.x - width / 2, 0, maxX) : defaultX,
    y: point ? clamp(point.y - height / 2, 0, maxY) : defaultY,
    width,
    height,
    alt: asset.name,
  };
};

const createDefaultCanvas = () => {
  const preset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
  return createCanvasFrame(sizeFromPreset(preset.id), DEFAULT_BACKGROUND_PRESET_ID, preset.id);
};

const sizeFromPreset = (presetId: CanvasPresetId) => getCanvasPresetById(presetId).size;

export const useCanvasStore = create<CanvasState & CanvasActions>((set, get) => ({
  canvas: null,

  initializeDefaultCanvas: () => {
    const existingCanvas = get().canvas;
    if (existingCanvas) {
      return serializeCanvasRecord(existingCanvas);
    }

    const canvas = createDefaultCanvas();
    set({ canvas: normalizeCanvasFrame(canvas) });
    useBoardSelectionStore.getState().clearSelection();

    return canvas;
  },

  resizeCanvas: (size, presetId = null) =>
    set((state) => {
      const canvas = state.canvas;
      if (!canvas) {
        return state;
      }

      return {
        canvas: {
          ...canvas,
          width: size.width,
          height: size.height,
          presetId,
        },
      };
    }),

  applyBackgroundToCanvas: (backgroundPresetId) => {
    const backgroundPreset = getCanvasBackgroundById(backgroundPresetId);

    set((state) => {
      const canvas = state.canvas;
      if (!canvas) {
        return state;
      }

      return {
        canvas: {
          ...canvas,
          backgroundPresetId: backgroundPreset.id,
          background: backgroundPreset.value,
        },
      };
    });
  },

  insertImageOnActiveCanvas: (asset) => {
    const canvas = get().canvas;
    if (!canvas) {
      return null;
    }

    const image = createBoardImageItem(asset, canvas);

    set((state) => {
      const currentCanvas = state.canvas;
      if (!currentCanvas) {
        return state;
      }

      return {
        canvas: {
          ...currentCanvas,
          imageOrder: [...currentCanvas.imageOrder, image.id],
          imagesById: {
            ...currentCanvas.imagesById,
            [image.id]: image,
          },
        },
      };
    });
    useBoardSelectionStore.getState().setSelectedImage(image.id);

    return image.id;
  },

  insertImageOnCanvasAtPoint: (asset, point) => {
    const canvas = get().canvas;
    if (!canvas) {
      return null;
    }

    const image = createBoardImageItem(asset, canvas, point);

    set((state) => {
      const currentCanvas = state.canvas;
      if (!currentCanvas) {
        return state;
      }

      return {
        canvas: {
          ...currentCanvas,
          imageOrder: [...currentCanvas.imageOrder, image.id],
          imagesById: {
            ...currentCanvas.imagesById,
            [image.id]: image,
          },
        },
      };
    });
    useBoardSelectionStore.getState().setSelectedImage(image.id);

    return image.id;
  },

  moveImageOnCanvas: (imageId, x, y) =>
    set((state) => {
      const canvas = state.canvas;
      const image = canvas?.imagesById[imageId];

      if (!canvas || !image || (image.x === x && image.y === y)) {
        return state;
      }

      const maxX = Math.max(canvas.width - image.width, 0);
      const maxY = Math.max(canvas.height - image.height, 0);

      return {
        canvas: {
          ...canvas,
          imagesById: {
            ...canvas.imagesById,
            [imageId]: {
              ...image,
              x: clamp(x, 0, maxX),
              y: clamp(y, 0, maxY),
            },
          },
        },
      };
    }),

  removeSelectedImage: () =>
    set((state) => {
      const selectedImageId = useBoardSelectionStore.getState().selectedImageId;
      const canvas = state.canvas;
      if (!canvas || !selectedImageId || !canvas.imagesById[selectedImageId]) {
        return state;
      }

      const remainingImages = { ...canvas.imagesById };
      delete remainingImages[selectedImageId];
      useBoardSelectionStore.getState().clearSelection();

      return {
        canvas: {
          ...canvas,
          imageOrder: canvas.imageOrder.filter((imageId) => imageId !== selectedImageId),
          imagesById: remainingImages,
        },
      };
    }),

  resetCanvas: (size) => {
    const canvas = createCanvasFrame(
      size,
      DEFAULT_BACKGROUND_PRESET_ID,
      DEFAULT_CANVAS_PRESET_ID,
    );
    set({ canvas: normalizeCanvasFrame(canvas) });
    useBoardSelectionStore.getState().clearSelection();

    return canvas;
  },

  serializeCanvas: () => {
    const canvas = get().canvas;
    return canvas ? serializeCanvasRecord(canvas) : null;
  },
}));

export const useCanvas = () => useCanvasStore((state) => state.canvas);

export const useCanvasImageById = (imageId: string) =>
  useCanvasStore((state) => state.canvas?.imagesById[imageId] ?? null);

export const useSelectedImageId = () =>
  useBoardSelectionStore((state) => state.selectedImageId);

export const useActiveCanvas = () => useCanvas();

export const useActiveCanvasPreset = () => {
  const activeCanvas = useActiveCanvas();

  if (!activeCanvas) {
    const preset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);

    return {
      kind: "preset" as const,
      preset,
      group: getCanvasPresetGroupById(preset.groupId),
    };
  }

  return resolveCanvasPreset({
    width: activeCanvas.width,
    height: activeCanvas.height,
    presetId: activeCanvas.presetId,
  });
};

export const useActiveCanvasBackground = () => {
  const activeCanvas = useActiveCanvas();

  return activeCanvas ? getCanvasBackgroundById(activeCanvas.backgroundPresetId) : null;
};
