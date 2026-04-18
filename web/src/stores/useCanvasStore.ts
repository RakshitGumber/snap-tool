import { create } from "zustand";

import { createBoardDocument, serializeBoardDocument } from "@/board/document";
import {
  DEFAULT_BACKGROUND_PRESET_ID,
  DEFAULT_CANVAS_PRESET_ID,
  createCanvasFrame,
  getCanvasBackgroundById,
  getCanvasPresetById,
  getCanvasPresetIdFromSize,
} from "@/board/config";
import { useBoardSelectionStore } from "@/stores/useBoardSelectionStore";
import type {
  BoardDocument,
  BoardImageItem,
  CanvasFrame,
  CanvasRecord,
  CanvasSize,
} from "@/types/canvas";
import type { UploadLibraryAsset } from "@/types/uploads";

type CanvasState = {
  board: BoardDocument;
};

type CanvasActions = {
  initializeDefaultCanvas: () => CanvasFrame;
  addCanvas: (size: CanvasSize, position: { x: number; y: number }) => CanvasFrame;
  moveCanvas: (canvasId: string, x: number, y: number) => void;
  resizeActiveCanvas: (size: CanvasSize) => void;
  applyBackgroundToActiveCanvas: (backgroundPresetId: string) => void;
  insertImageOnActiveCanvas: (asset: UploadLibraryAsset) => string | null;
  insertImageOnCanvasAtPoint: (
    asset: UploadLibraryAsset,
    canvasId: string,
    point: { x: number; y: number },
  ) => string | null;
  moveImageOnCanvas: (canvasId: string, imageId: string, x: number, y: number) => void;
  removeSelectedImage: () => void;
  removeActiveCanvas: () => void;
  resetBoard: (size: CanvasSize, position?: { x: number; y: number }) => CanvasFrame;
  serializeBoard: () => CanvasFrame[];
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

const getCanvasFrames = (board: BoardDocument) => serializeBoardDocument(board);

const getFirstCanvas = (board: BoardDocument) => {
  const firstCanvasId = board.canvasOrder[0];
  return firstCanvasId ? board.canvasesById[firstCanvasId] ?? null : null;
};

const getCanvasById = (board: BoardDocument, canvasId: string | null) =>
  canvasId ? board.canvasesById[canvasId] ?? null : null;

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

const createDefaultCanvas = (position: { x: number; y: number }, index: number) => {
  const preset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
  const size = preset.size ?? { width: 500, height: 500 };

  return createCanvasFrame(size, position, index);
};

export const useCanvasStore = create<CanvasState & CanvasActions>((set, get) => ({
  board: createBoardDocument([]),

  initializeDefaultCanvas: () => {
    const existingCanvas = getFirstCanvas(get().board);
    if (existingCanvas) {
      return serializeCanvas(existingCanvas);
    }

    const canvas = createDefaultCanvas({ x: 0, y: 0 }, 0);
    set({ board: createBoardDocument([canvas]) });
    useBoardSelectionStore.getState().resetSelection(canvas.id);

    return canvas;
  },

  addCanvas: (size, position) => {
    const canvases = getCanvasFrames(get().board);
    const canvas = createCanvasFrame(size, position, canvases.length);

    set((state) => ({
      board: {
        canvasOrder: [...state.board.canvasOrder, canvas.id],
        canvasesById: {
          ...state.board.canvasesById,
          [canvas.id]: {
            ...canvas,
            imageOrder: [],
            imagesById: {},
          },
        },
      },
    }));
    useBoardSelectionStore.getState().resetSelection(canvas.id);

    return canvas;
  },

  moveCanvas: (canvasId, x, y) =>
    set((state) => {
      const canvas = state.board.canvasesById[canvasId];
      if (!canvas || (canvas.x === x && canvas.y === y)) {
        return state;
      }

      return {
        board: {
          ...state.board,
          canvasesById: {
            ...state.board.canvasesById,
            [canvasId]: {
              ...canvas,
              x,
              y,
            },
          },
        },
      };
    }),

  resizeActiveCanvas: (size) =>
    set((state) => {
      const activeCanvasId = useBoardSelectionStore.getState().activeCanvasId;
      const canvas = getCanvasById(state.board, activeCanvasId);
      if (!canvas) {
        return state;
      }

      return {
        board: {
          ...state.board,
          canvasesById: {
            ...state.board.canvasesById,
            [canvas.id]: {
              ...canvas,
              width: size.width,
              height: size.height,
            },
          },
        },
      };
    }),

  applyBackgroundToActiveCanvas: (backgroundPresetId) => {
    const backgroundPreset = getCanvasBackgroundById(backgroundPresetId);

    set((state) => {
      const activeCanvasId = useBoardSelectionStore.getState().activeCanvasId;
      const canvas = getCanvasById(state.board, activeCanvasId);
      if (!canvas) {
        return state;
      }

      return {
        board: {
          ...state.board,
          canvasesById: {
            ...state.board.canvasesById,
            [canvas.id]: {
              ...canvas,
              backgroundPresetId: backgroundPreset.id,
              background: backgroundPreset.value,
            },
          },
        },
      };
    });
  },

  insertImageOnActiveCanvas: (asset) => {
    const { board } = get();
    const activeCanvasId = useBoardSelectionStore.getState().activeCanvasId;
    const canvas = getCanvasById(board, activeCanvasId) ?? getFirstCanvas(board);
    if (!canvas) {
      return null;
    }

    const image = createBoardImageItem(asset, canvas);

    set((state) => ({
      board: {
        ...state.board,
        canvasesById: {
          ...state.board.canvasesById,
          [canvas.id]: {
            ...canvas,
            imageOrder: [...canvas.imageOrder, image.id],
            imagesById: {
              ...canvas.imagesById,
              [image.id]: image,
            },
          },
        },
      },
    }));
    useBoardSelectionStore.getState().resetSelection(canvas.id);
    useBoardSelectionStore.getState().setSelectedImage(image.id);

    return image.id;
  },

  insertImageOnCanvasAtPoint: (asset, canvasId, point) => {
    const canvas = getCanvasById(get().board, canvasId);
    if (!canvas) {
      return null;
    }

    const image = createBoardImageItem(asset, canvas, point);

    set((state) => ({
      board: {
        ...state.board,
        canvasesById: {
          ...state.board.canvasesById,
          [canvas.id]: {
            ...canvas,
            imageOrder: [...canvas.imageOrder, image.id],
            imagesById: {
              ...canvas.imagesById,
              [image.id]: image,
            },
          },
        },
      },
    }));
    useBoardSelectionStore.getState().resetSelection(canvas.id);
    useBoardSelectionStore.getState().setSelectedImage(image.id);

    return image.id;
  },

  moveImageOnCanvas: (canvasId, imageId, x, y) =>
    set((state) => {
      const canvas = state.board.canvasesById[canvasId];
      const image = canvas?.imagesById[imageId];

      if (!canvas || !image || (image.x === x && image.y === y)) {
        return state;
      }

      return {
        board: {
          ...state.board,
          canvasesById: {
            ...state.board.canvasesById,
            [canvasId]: {
              ...canvas,
              imagesById: {
                ...canvas.imagesById,
                [imageId]: {
                  ...image,
                  x,
                  y,
                },
              },
            },
          },
        },
      };
    }),

  removeSelectedImage: () =>
    set((state) => {
      const { activeCanvasId, selectedImageId } = useBoardSelectionStore.getState();
      const canvas = getCanvasById(state.board, activeCanvasId);
      if (!canvas || !selectedImageId || !canvas.imagesById[selectedImageId]) {
        return state;
      }

      const remainingImages = { ...canvas.imagesById };
      delete remainingImages[selectedImageId];
      useBoardSelectionStore.getState().setSelectedImage(null);

      return {
        board: {
          ...state.board,
          canvasesById: {
            ...state.board.canvasesById,
            [canvas.id]: {
              ...canvas,
              imageOrder: canvas.imageOrder.filter((imageId) => imageId !== selectedImageId),
              imagesById: remainingImages,
            },
          },
        },
      };
    }),

  removeActiveCanvas: () =>
    set((state) => {
      const activeCanvasId = useBoardSelectionStore.getState().activeCanvasId;
      if (!activeCanvasId || state.board.canvasOrder.length <= 1) {
        return state;
      }

      const nextCanvasOrder = state.board.canvasOrder.filter(
        (canvasId) => canvasId !== activeCanvasId,
      );
      const remainingCanvases = { ...state.board.canvasesById };
      delete remainingCanvases[activeCanvasId];
      const nextActiveCanvasId = nextCanvasOrder.at(-1) ?? null;

      useBoardSelectionStore.getState().resetSelection(nextActiveCanvasId);

      return {
        board: {
          canvasOrder: nextCanvasOrder,
          canvasesById: remainingCanvases,
        },
      };
    }),

  resetBoard: (size, position = { x: 0, y: 0 }) => {
    const canvas = createCanvasFrame(size, position, 0, DEFAULT_BACKGROUND_PRESET_ID);
    set({ board: createBoardDocument([canvas]) });
    useBoardSelectionStore.getState().resetSelection(canvas.id);

    return canvas;
  },

  serializeBoard: () => serializeBoardDocument(get().board),
}));

const serializeCanvas = (canvas: CanvasRecord): CanvasFrame => ({
  id: canvas.id,
  title: canvas.title,
  x: canvas.x,
  y: canvas.y,
  width: canvas.width,
  height: canvas.height,
  background: canvas.background,
  backgroundPresetId: canvas.backgroundPresetId,
  images: canvas.imageOrder
    .map((imageId) => canvas.imagesById[imageId])
    .filter((image): image is BoardImageItem => image !== undefined),
});

export const useCanvasIds = () =>
  useCanvasStore((state) => state.board.canvasOrder);

export const useCanvasById = (canvasId: string | null) =>
  useCanvasStore((state) =>
    canvasId ? state.board.canvasesById[canvasId] ?? null : null,
  );

export const useCanvasImageById = (canvasId: string, imageId: string) =>
  useCanvasStore((state) => state.board.canvasesById[canvasId]?.imagesById[imageId] ?? null);

export const useSelectedCanvasId = () =>
  useBoardSelectionStore((state) => state.selectedCanvasId);

export const useActiveCanvasId = () =>
  useBoardSelectionStore((state) => state.activeCanvasId);

export const useSelectedImageId = () =>
  useBoardSelectionStore((state) => state.selectedImageId);

export const useActiveCanvas = () => {
  const activeCanvasId = useActiveCanvasId();
  const canvasIds = useCanvasIds();
  const resolvedCanvasId = activeCanvasId ?? canvasIds[0] ?? null;

  return useCanvasById(resolvedCanvasId);
};

export const useActiveCanvasPreset = () => {
  const activeCanvas = useActiveCanvas();

  if (!activeCanvas) {
    return getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
  }

  return getCanvasPresetById(
    getCanvasPresetIdFromSize({
      width: activeCanvas.width,
      height: activeCanvas.height,
    }),
  );
};

export const useActiveCanvasBackground = () => {
  const activeCanvas = useActiveCanvas();

  return activeCanvas ? getCanvasBackgroundById(activeCanvas.backgroundPresetId) : null;
};
