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
  CanvasShell,
  CanvasSize,
} from "@/types/canvas";
import type { UploadLibraryAssetMeta } from "@/types/uploads";

type CanvasState = {
  canvasMeta: CanvasShell | null;
  imageOrder: string[];
  imagesById: Record<string, BoardImageItem>;
};

type CanvasActions = {
  initializeDefaultCanvas: () => CanvasFrame;
  resizeCanvas: (size: CanvasSize, presetId?: CanvasPresetId | null) => void;
  applyBackgroundToCanvas: (backgroundPresetId: string) => void;
  insertImageOnActiveCanvas: (asset: UploadLibraryAssetMeta) => string | null;
  insertImageOnCanvasAtPoint: (
    asset: UploadLibraryAssetMeta,
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

const EMPTY_CANVAS_IMAGES: Record<string, BoardImageItem> = {};

const normalizeCanvasFrame = (canvas: CanvasFrame) => ({
  canvasMeta: {
    id: canvas.id,
    title: canvas.title,
    width: canvas.width,
    height: canvas.height,
    presetId: canvas.presetId ?? null,
    background: canvas.background,
    backgroundPresetId: canvas.backgroundPresetId,
  } satisfies CanvasShell,
  imageOrder: canvas.images.map((image) => image.id),
  imagesById: Object.fromEntries(canvas.images.map((image) => [image.id, image])),
});

const serializeCanvasState = ({
  canvasMeta,
  imageOrder,
  imagesById,
}: CanvasState): CanvasFrame | null => {
  if (!canvasMeta) {
    return null;
  }

  return {
    ...canvasMeta,
    images: imageOrder
      .map((imageId) => imagesById[imageId])
      .filter((image): image is BoardImageItem => image !== undefined),
  };
};

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

const createCanvasImageItem = (
  asset: UploadLibraryAssetMeta,
  state: Pick<CanvasState, "canvasMeta" | "imageOrder">,
  point?: { x: number; y: number },
): BoardImageItem | null => {
  if (!state.canvasMeta) {
    return null;
  }

  const { width, height } = getContainedImageSize({
    sourceWidth: asset.width,
    sourceHeight: asset.height,
    maxWidth: state.canvasMeta.width * MAX_INITIAL_IMAGE_SCALE,
    maxHeight: state.canvasMeta.height * MAX_INITIAL_IMAGE_SCALE,
  });
  const maxX = Math.max(state.canvasMeta.width - width, 0);
  const maxY = Math.max(state.canvasMeta.height - height, 0);
  const offset = Math.min(state.imageOrder.length * IMAGE_INSERT_OFFSET_STEP, 72);
  const defaultX = Math.min(
    Math.max((state.canvasMeta.width - width) / 2 + offset, 0),
    maxX,
  );
  const defaultY = Math.min(
    Math.max((state.canvasMeta.height - height) / 2 + offset, 0),
    maxY,
  );

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
  return createCanvasFrame(preset.size, DEFAULT_BACKGROUND_PRESET_ID, preset.id);
};

export const useCanvasStore = create<CanvasState & CanvasActions>((set, get) => ({
  canvasMeta: null,
  imageOrder: [],
  imagesById: EMPTY_CANVAS_IMAGES,

  initializeDefaultCanvas: () => {
    const existingCanvas = serializeCanvasState(get());
    if (existingCanvas) {
      return existingCanvas;
    }

    const canvas = createDefaultCanvas();
    set(normalizeCanvasFrame(canvas));
    useBoardSelectionStore.getState().clearSelection();

    return canvas;
  },

  resizeCanvas: (size, presetId = null) =>
    set((state) => {
      if (!state.canvasMeta) {
        return state;
      }

      return {
        canvasMeta: {
          ...state.canvasMeta,
          width: size.width,
          height: size.height,
          presetId,
        },
      };
    }),

  applyBackgroundToCanvas: (backgroundPresetId) => {
    const backgroundPreset = getCanvasBackgroundById(backgroundPresetId);

    set((state) => {
      if (!state.canvasMeta) {
        return state;
      }

      return {
        canvasMeta: {
          ...state.canvasMeta,
          backgroundPresetId: backgroundPreset.id,
          background: backgroundPreset.value,
        },
      };
    });
  },

  insertImageOnActiveCanvas: (asset) => {
    const image = createCanvasImageItem(asset, get());
    if (!image) {
      return null;
    }

    set((state) => ({
      imageOrder: [...state.imageOrder, image.id],
      imagesById: {
        ...state.imagesById,
        [image.id]: image,
      },
    }));
    useBoardSelectionStore.getState().setSelectedImage(image.id);

    return image.id;
  },

  insertImageOnCanvasAtPoint: (asset, point) => {
    const image = createCanvasImageItem(asset, get(), point);
    if (!image) {
      return null;
    }

    set((state) => ({
      imageOrder: [...state.imageOrder, image.id],
      imagesById: {
        ...state.imagesById,
        [image.id]: image,
      },
    }));
    useBoardSelectionStore.getState().setSelectedImage(image.id);

    return image.id;
  },

  moveImageOnCanvas: (imageId, x, y) =>
    set((state) => {
      const canvasMeta = state.canvasMeta;
      const image = state.imagesById[imageId];

      if (!canvasMeta || !image || (image.x === x && image.y === y)) {
        return state;
      }

      const maxX = Math.max(canvasMeta.width - image.width, 0);
      const maxY = Math.max(canvasMeta.height - image.height, 0);

      return {
        imagesById: {
          ...state.imagesById,
          [imageId]: {
            ...image,
            x: clamp(x, 0, maxX),
            y: clamp(y, 0, maxY),
          },
        },
      };
    }),

  removeSelectedImage: () =>
    set((state) => {
      const selectedImageId = useBoardSelectionStore.getState().selectedImageId;
      if (!selectedImageId || !state.imagesById[selectedImageId]) {
        return state;
      }

      const nextImagesById = { ...state.imagesById };
      delete nextImagesById[selectedImageId];
      useBoardSelectionStore.getState().clearSelection();

      return {
        imageOrder: state.imageOrder.filter((imageId) => imageId !== selectedImageId),
        imagesById: nextImagesById,
      };
    }),

  resetCanvas: (size) => {
    const canvas = createCanvasFrame(
      size,
      DEFAULT_BACKGROUND_PRESET_ID,
      DEFAULT_CANVAS_PRESET_ID,
    );
    set(normalizeCanvasFrame(canvas));
    useBoardSelectionStore.getState().clearSelection();

    return canvas;
  },

  serializeCanvas: () => serializeCanvasState(get()),
}));

export const useCanvasShell = () => useCanvasStore((state) => state.canvasMeta);

export const useCanvasImageIds = () => useCanvasStore((state) => state.imageOrder);

export const useCanvasImage = (imageId: string) =>
  useCanvasStore((state) => state.imagesById[imageId] ?? null);

export const useSelectedImageId = () =>
  useBoardSelectionStore((state) => state.selectedImageId);

export const useActiveCanvas = (): CanvasRecord | null => {
  const canvasMeta = useCanvasShell();
  const imageOrder = useCanvasImageIds();
  const imagesById = useCanvasStore((state) => state.imagesById);

  return canvasMeta
    ? {
        ...canvasMeta,
        imageOrder,
        imagesById,
      }
    : null;
};

export const useActiveCanvasPreset = () => {
  const canvasMeta = useCanvasShell();

  if (!canvasMeta) {
    const preset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);

    return {
      kind: "preset" as const,
      preset,
      group: getCanvasPresetGroupById(preset.groupId),
    };
  }

  return resolveCanvasPreset({
    width: canvasMeta.width,
    height: canvasMeta.height,
    presetId: canvasMeta.presetId,
  });
};

export const useActiveCanvasBackground = () => {
  const canvasMeta = useCanvasShell();

  return canvasMeta ? getCanvasBackgroundById(canvasMeta.backgroundPresetId) : null;
};
