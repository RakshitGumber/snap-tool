import { create } from "zustand";

import {
  DEFAULT_BOARD_TEXT_INPUT,
  normalizeBoardTextFamily,
} from "@/board/text";
import {
  DEFAULT_BACKGROUND_PRESET_ID,
  DEFAULT_CANVAS_PRESET_ID,
  createCanvasFrame,
  getCanvasBackgroundById,
  getCanvasPresetById,
  getCanvasPresetBySize,
  getCanvasPresetGroupById,
  resolveCanvasPreset,
} from "@/stores/useConfigStore";
import { useBoardSelectionStore } from "@/stores/useBoardSelectionStore";
import type {
  BoardImageItem,
  BoardTextInput,
  BoardTextItem,
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
  textOrder: string[];
  textsById: Record<string, BoardTextItem>;
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
  insertTextOnActiveCanvas: (text: BoardTextInput) => string | null;
  moveImageOnCanvas: (imageId: string, x: number, y: number) => void;
  moveTextOnCanvas: (
    textId: string,
    x: number,
    y: number,
    bounds?: { width: number; height: number },
  ) => void;
  updateTextOnCanvas: (textId: string, updates: Partial<BoardTextInput>) => void;
  removeSelectedImage: () => void;
  removeSelectedText: () => void;
  resetCanvas: (size: CanvasSize) => CanvasFrame;
  serializeCanvas: () => CanvasFrame | null;
};

const MAX_INITIAL_IMAGE_SCALE = 0.8;
const IMAGE_INSERT_OFFSET_STEP = 18;
const TEXT_INSERT_OFFSET_STEP = 24;
const MIN_TEXT_FONT_SIZE = 12;
const MAX_TEXT_FONT_SIZE = 180;
const MIN_TEXT_FONT_WEIGHT = 100;
const MAX_TEXT_FONT_WEIGHT = 900;
const MIN_TEXT_BOX_WIDTH = 120;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const EMPTY_CANVAS_IMAGES: Record<string, BoardImageItem> = {};
const EMPTY_CANVAS_TEXT: Record<string, BoardTextItem> = {};

const normalizeCanvasFrame = (canvas: CanvasFrame) => {
  const texts = canvas.texts ?? [];

  return {
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
    textOrder: texts.map((text) => text.id),
    textsById: Object.fromEntries(texts.map((text) => [text.id, text])),
  };
};

const serializeCanvasState = ({
  canvasMeta,
  imageOrder,
  imagesById,
  textOrder,
  textsById,
}: CanvasState): CanvasFrame | null => {
  if (!canvasMeta) {
    return null;
  }

  return {
    ...canvasMeta,
    images: imageOrder
      .map((imageId) => imagesById[imageId])
      .filter((image): image is BoardImageItem => image !== undefined),
    texts: textOrder
      .map((textId) => textsById[textId])
      .filter((text): text is BoardTextItem => text !== undefined),
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

const normalizeTextInput = (textInput: Partial<BoardTextInput>, canvasMeta: CanvasShell) => {
  const fontFamily = normalizeBoardTextFamily(
    textInput.fontFamily ?? DEFAULT_BOARD_TEXT_INPUT.fontFamily,
  );

  return {
    text: textInput.text ?? DEFAULT_BOARD_TEXT_INPUT.text,
    fontFamily: fontFamily || DEFAULT_BOARD_TEXT_INPUT.fontFamily,
    fontSize: clamp(
      Math.round(textInput.fontSize ?? DEFAULT_BOARD_TEXT_INPUT.fontSize),
      MIN_TEXT_FONT_SIZE,
      MAX_TEXT_FONT_SIZE,
    ),
    fontWeight: clamp(
      Math.round(textInput.fontWeight ?? DEFAULT_BOARD_TEXT_INPUT.fontWeight),
      MIN_TEXT_FONT_WEIGHT,
      MAX_TEXT_FONT_WEIGHT,
    ),
    color: textInput.color ?? DEFAULT_BOARD_TEXT_INPUT.color,
    align: textInput.align ?? DEFAULT_BOARD_TEXT_INPUT.align,
    maxWidth: clamp(
      Math.round(textInput.maxWidth ?? DEFAULT_BOARD_TEXT_INPUT.maxWidth),
      MIN_TEXT_BOX_WIDTH,
      canvasMeta.width,
    ),
  } satisfies Omit<BoardTextItem, "id" | "x" | "y">;
};

const createCanvasTextItem = (
  textInput: BoardTextInput,
  state: Pick<CanvasState, "canvasMeta" | "textOrder">,
): BoardTextItem | null => {
  if (!state.canvasMeta) {
    return null;
  }

  const normalizedText = normalizeTextInput(textInput, state.canvasMeta);
  const offset = Math.min(state.textOrder.length * TEXT_INSERT_OFFSET_STEP, 96);
  const estimatedHeight = normalizedText.fontSize * 1.4;
  const maxX = Math.max(state.canvasMeta.width - normalizedText.maxWidth, 0);
  const maxY = Math.max(state.canvasMeta.height - estimatedHeight, 0);

  return {
    id: crypto.randomUUID(),
    text: normalizedText.text,
    x: clamp(
      textInput.x ?? (state.canvasMeta.width - normalizedText.maxWidth) / 2 + offset,
      0,
      maxX,
    ),
    y: clamp(
      textInput.y ?? state.canvasMeta.height / 2 - estimatedHeight / 2 + offset,
      0,
      maxY,
    ),
    fontFamily: normalizedText.fontFamily,
    fontSize: normalizedText.fontSize,
    fontWeight: normalizedText.fontWeight,
    color: normalizedText.color,
    align: normalizedText.align,
    maxWidth: normalizedText.maxWidth,
  };
};

const applyTextItemUpdates = ({
  text,
  updates,
  canvasMeta,
}: {
  text: BoardTextItem;
  updates: Partial<BoardTextInput>;
  canvasMeta: CanvasShell;
}) => {
  const normalized = normalizeTextInput(updates, canvasMeta);
  const nextMaxWidth =
    updates.maxWidth === undefined ? text.maxWidth : normalized.maxWidth;
  const nextX = clamp(text.x, 0, Math.max(canvasMeta.width - nextMaxWidth, 0));
  const nextFontSize =
    updates.fontSize === undefined ? text.fontSize : normalized.fontSize;
  const nextY = clamp(text.y, 0, Math.max(canvasMeta.height - nextFontSize * 1.4, 0));

  return {
    ...text,
    text: updates.text ?? text.text,
    fontFamily:
      updates.fontFamily === undefined ? text.fontFamily : normalized.fontFamily,
    fontSize: nextFontSize,
    fontWeight:
      updates.fontWeight === undefined ? text.fontWeight : normalized.fontWeight,
    color: updates.color === undefined ? text.color : normalized.color,
    align: updates.align === undefined ? text.align : normalized.align,
    maxWidth: nextMaxWidth,
    x: nextX,
    y: nextY,
  } satisfies BoardTextItem;
};

const createDefaultCanvas = () => {
  const preset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
  return createCanvasFrame(preset.size, DEFAULT_BACKGROUND_PRESET_ID, preset.id);
};

export const useCanvasStore = create<CanvasState & CanvasActions>((set, get) => ({
  canvasMeta: null,
  imageOrder: [],
  imagesById: EMPTY_CANVAS_IMAGES,
  textOrder: [],
  textsById: EMPTY_CANVAS_TEXT,

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

  insertTextOnActiveCanvas: (textInput) => {
    const text = createCanvasTextItem(textInput, get());
    if (!text) {
      return null;
    }

    set((state) => ({
      textOrder: [...state.textOrder, text.id],
      textsById: {
        ...state.textsById,
        [text.id]: text,
      },
    }));
    useBoardSelectionStore.getState().setSelectedText(text.id);

    return text.id;
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

  moveTextOnCanvas: (textId, x, y, bounds) =>
    set((state) => {
      const canvasMeta = state.canvasMeta;
      const text = state.textsById[textId];
      if (!canvasMeta || !text) {
        return state;
      }

      const width = bounds?.width ?? text.maxWidth;
      const height = bounds?.height ?? text.fontSize * 1.4;
      const nextX = clamp(x, 0, Math.max(canvasMeta.width - width, 0));
      const nextY = clamp(y, 0, Math.max(canvasMeta.height - height, 0));

      if (text.x === nextX && text.y === nextY) {
        return state;
      }

      return {
        textsById: {
          ...state.textsById,
          [textId]: {
            ...text,
            x: nextX,
            y: nextY,
          },
        },
      };
    }),

  updateTextOnCanvas: (textId, updates) =>
    set((state) => {
      const canvasMeta = state.canvasMeta;
      const text = state.textsById[textId];
      if (!canvasMeta || !text) {
        return state;
      }

      return {
        textsById: {
          ...state.textsById,
          [textId]: applyTextItemUpdates({
            text,
            updates,
            canvasMeta,
          }),
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

  removeSelectedText: () =>
    set((state) => {
      const selectedTextId = useBoardSelectionStore.getState().selectedTextId;
      if (!selectedTextId || !state.textsById[selectedTextId]) {
        return state;
      }

      const nextTextsById = { ...state.textsById };
      delete nextTextsById[selectedTextId];
      useBoardSelectionStore.getState().clearSelection();

      return {
        textOrder: state.textOrder.filter((textId) => textId !== selectedTextId),
        textsById: nextTextsById,
      };
    }),

  resetCanvas: (size) => {
    const preset = getCanvasPresetBySize(size);
    const canvas = createCanvasFrame(
      size,
      DEFAULT_BACKGROUND_PRESET_ID,
      preset?.id ?? null,
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

export const useCanvasTextIds = () => useCanvasStore((state) => state.textOrder);

export const useCanvasText = (textId: string) =>
  useCanvasStore((state) => state.textsById[textId] ?? null);

export const useSelectedTextId = () =>
  useBoardSelectionStore((state) => state.selectedTextId);

export const useActiveCanvas = (): CanvasRecord | null => {
  const canvasMeta = useCanvasShell();
  const imageOrder = useCanvasImageIds();
  const imagesById = useCanvasStore((state) => state.imagesById);
  const textOrder = useCanvasTextIds();
  const textsById = useCanvasStore((state) => state.textsById);

  return canvasMeta
    ? {
        ...canvasMeta,
        imageOrder,
        imagesById,
        textOrder,
        textsById,
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
