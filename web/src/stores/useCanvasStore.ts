import { useMemo } from "react";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  getOrderedCanvasObjects,
  type OrderedCanvasObject,
  createObjectRef,
  getObjectBounds,
  isSameObjectRef,
  measureTextItemBounds,
} from "@/canvas/objects";
import {
  areCanvasBackgroundEffectsEqual,
  DEFAULT_CANVAS_BACKGROUND_EFFECTS,
  normalizeCanvasBackgroundEffects,
} from "@/canvas/backgroundEffects";
import {
  createCanvasAssetImageBackground,
  createCanvasBackgroundFromPreset,
  normalizeCanvasBackgroundValue,
} from "@/canvas/backgrounds";
import {
  createCanvasFrame,
  findCanvasBackgroundById,
  getCanvasPresetById,
  getCanvasPresetBySize,
  getCanvasPresetGroupById,
  normalizeBoardTextFamily,
  resolveCanvasPreset,
  useConfigStore,
} from "@/stores/useConfigStore";
import { useEditorUiStore } from "@/stores/useEditorUiStore";
import type {
  BoardImageItem,
  BoardImagePositionPreset,
  BoardObjectRef,
  BoardTextInput,
  BoardTextItem,
  CanvasBackgroundEffects,
  CanvasBackgroundValue,
  CanvasFrame,
  CanvasLayoutAxisMode,
  CanvasPresetId,
  CanvasShell,
  CanvasSize,
} from "@/types/canvas";
import type { UploadLibraryAssetMeta } from "@/types/uploads";

type CanvasState = {
  canvasMeta: CanvasShell | null;
  imagesById: Record<string, BoardImageItem>;
  textsById: Record<string, BoardTextItem>;
};

type CanvasHistoryState = {
  historyPast: CanvasFrame[];
  historyFuture: CanvasFrame[];
  historyTransactionStart: CanvasFrame | null;
};

type ObjectMoveInput = {
  ref: BoardObjectRef;
  x: number;
  y: number;
};

type CanvasActions = {
  initializeDefaultCanvas: () => CanvasFrame;
  updateCanvasTitle: (title: string) => void;
  resizeCanvas: (size: CanvasSize, presetId?: CanvasPresetId | null) => void;
  applyBackgroundToCanvas: (backgroundPresetId: string) => void;
  applySolidColorBackground: (color: string) => void;
  applyAssetBackgroundToCanvas: (assetId: string) => void;
  updateCanvasBackgroundImage: (
    updates: Partial<
      Pick<
        Extract<CanvasBackgroundValue, { kind: "image" }>,
        "fit" | "offsetX" | "offsetY"
      >
    >,
  ) => void;
  updateCanvasBackgroundEffects: (
    updates: Partial<CanvasBackgroundEffects>,
  ) => void;
  resetCanvasBackgroundEffects: () => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
  beginHistoryTransaction: () => void;
  endHistoryTransaction: () => void;
  insertImageOnActiveCanvas: (asset: UploadLibraryAssetMeta) => string | null;
  insertImageOnCanvasAtPoint: (
    asset: UploadLibraryAssetMeta,
    point: { x: number; y: number },
  ) => string | null;
  insertTextOnActiveCanvas: (text: BoardTextInput) => string | null;
  moveObjectsOnCanvas: (
    moves: ObjectMoveInput[],
    options?: { releaseFromAxis?: boolean },
  ) => void;
  resizeImageOnCanvas: (imageId: string, width: number, height: number) => void;
  positionImageOnCanvas: (
    imageId: string,
    preset: BoardImagePositionPreset,
  ) => void;
  toggleObjectMovementLock: (ref: BoardObjectRef) => void;
  updateTextOnCanvas: (
    textId: string,
    updates: Partial<BoardTextInput>,
  ) => void;
  updateLayoutAxisMode: (mode: CanvasLayoutAxisMode) => void;
  moveObjectUp: (ref: BoardObjectRef) => void;
  moveObjectDown: (ref: BoardObjectRef) => void;
  setSelectedObjectDistance: (distance: number) => void;
  removeSelectedObjects: () => void;
  resetCanvas: (size: CanvasSize) => CanvasFrame;
  serializeCanvas: () => CanvasFrame | null;
};

const MAX_INITIAL_IMAGE_SCALE = 0.8;
const IMAGE_POSITION_INSET = 24;
const MIN_IMAGE_SIZE = 48;
const TEXT_INSERT_OFFSET_STEP = 24;
const MIN_TEXT_FONT_SIZE = 12;
const MAX_TEXT_FONT_SIZE = 180;
const MIN_TEXT_FONT_WEIGHT = 100;
const MAX_TEXT_FONT_WEIGHT = 900;
const MIN_TEXT_BOX_WIDTH = 120;
const DEFAULT_LAYOUT_GAP = 24;

const generateId = () => {
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.randomUUID
  ) {
    return window.crypto.randomUUID();
  }

  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const roundPosition = (value: number) => Math.round(value * 100) / 100;

const EMPTY_CANVAS_IMAGES: Record<string, BoardImageItem> = {};
const EMPTY_CANVAS_TEXT: Record<string, BoardTextItem> = {};

const getDefaultTextInput = () => useConfigStore.getState().text.defaultInput;
const disableBackgroundMoveMode = () =>
  useEditorUiStore.getState().setBackgroundMoveMode(false);

const areCanvasFramesEqual = (left: CanvasFrame, right: CanvasFrame) =>
  JSON.stringify(left) === JSON.stringify(right);

type LegacyImageItem = Omit<BoardImageItem, "layoutMode" | "layoutGap" | "isMovementLocked"> &
  Partial<Pick<BoardImageItem, "layoutMode" | "layoutGap" | "isMovementLocked">>;
type LegacyTextItem = Omit<BoardTextItem, "layoutMode" | "layoutGap" | "isMovementLocked"> &
  Partial<Pick<BoardTextItem, "layoutMode" | "layoutGap" | "isMovementLocked">>;
type LegacyCanvasFrame = Omit<
  CanvasFrame,
  "background" | "backgroundPresetId" | "layoutAxisMode" | "objectOrder" | "images" | "texts"
> & {
  background: CanvasBackgroundValue | string;
  backgroundPresetId?: string | null;
  layoutAxisMode?: CanvasLayoutAxisMode;
  objectOrder?: BoardObjectRef[];
  images: LegacyImageItem[];
  texts?: LegacyTextItem[];
};
type PersistedCanvasState = Partial<
  CanvasState & {
    version?: number;
  }
> & {
  imageOrder?: string[];
  textOrder?: string[];
};

const normalizeImageItem = (image: LegacyImageItem): BoardImageItem => ({
  ...image,
  layoutMode: image.layoutMode ?? "free",
  isMovementLocked: image.isMovementLocked ?? false,
  layoutGap:
    typeof image.layoutGap === "number" && Number.isFinite(image.layoutGap)
      ? Math.round(image.layoutGap)
      : DEFAULT_LAYOUT_GAP,
});

const normalizeTextItem = (text: LegacyTextItem): BoardTextItem => ({
  ...text,
  layoutMode: text.layoutMode ?? "free",
  isMovementLocked: text.isMovementLocked ?? false,
  layoutGap:
    typeof text.layoutGap === "number" && Number.isFinite(text.layoutGap)
      ? Math.round(text.layoutGap)
    : DEFAULT_LAYOUT_GAP,
});

const getLegacyObjectOrder = ({
  images,
  texts,
  objectOrder,
}: Pick<LegacyCanvasFrame, "images" | "texts" | "objectOrder">) => {
  const safeTexts = texts ?? [];

  if (objectOrder?.length) {
    return objectOrder;
  }

  return [
    ...images.map((image) => createObjectRef("image", image.id)),
    ...safeTexts.map((text) => createObjectRef("text", text.id)),
  ];
};

const normalizeCanvasFrame = (canvas: LegacyCanvasFrame) => {
  const texts = (canvas.texts ?? []).map(normalizeTextItem);
  const images = canvas.images.map(normalizeImageItem);
  const backgroundPreset = findCanvasBackgroundById(
    canvas.backgroundPresetId ?? null,
  );
  const background = normalizeCanvasBackgroundValue({
    background: canvas.background,
    preset: backgroundPreset,
  });
  const objectOrder = getLegacyObjectOrder({
    images,
    texts,
    objectOrder: canvas.objectOrder,
  }).filter((ref) =>
    ref.kind === "image"
      ? images.some((image) => image.id === ref.id)
      : texts.some((text) => text.id === ref.id),
  );

  return {
    canvasMeta: {
      id: canvas.id,
      title: canvas.title,
      width: canvas.width,
      height: canvas.height,
      presetId: canvas.presetId ?? null,
      layoutAxisMode: canvas.layoutAxisMode ?? "none",
      background,
      backgroundPresetId: backgroundPreset?.id ?? canvas.backgroundPresetId ?? null,
      backgroundEffects: normalizeCanvasBackgroundEffects(
        canvas.backgroundEffects,
      ),
      objectOrder,
    } satisfies CanvasShell,
    imagesById: Object.fromEntries(images.map((image) => [image.id, image])),
    textsById: Object.fromEntries(texts.map((text) => [text.id, text])),
  };
};

const serializeCanvasState = ({
  canvasMeta,
  imagesById,
  textsById,
}: CanvasState): CanvasFrame | null => {
  if (!canvasMeta) {
    return null;
  }

  const orderedObjects = getOrderedCanvasObjects({
    objectOrder: canvasMeta.objectOrder,
    imagesById,
    textsById,
  });

  return {
    ...canvasMeta,
    images: orderedObjects
      .filter((object): object is Extract<OrderedCanvasObject, { kind: "image" }> => object.kind === "image")
      .map((object) => object.item),
    texts: orderedObjects
      .filter((object): object is Extract<OrderedCanvasObject, { kind: "text" }> => object.kind === "text")
      .map((object) => object.item),
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
  const scale = Math.min(
    maxWidth / safeSourceWidth,
    maxHeight / safeSourceHeight,
    1,
  );

  return {
    width: Math.max(1, Math.round(safeSourceWidth * scale)),
    height: Math.max(1, Math.round(safeSourceHeight * scale)),
  };
};

const createCanvasImageItem = (
  asset: UploadLibraryAssetMeta,
  state: Pick<CanvasState, "canvasMeta">,
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
  const offset = DEFAULT_LAYOUT_GAP;
  const defaultX = (state.canvasMeta.width - width) / 2 + offset;
  const defaultY = (state.canvasMeta.height - height) / 2 + offset;

  return {
    id: generateId(),
    assetId: asset.id,
    x: point ? point.x - width / 2 : defaultX,
    y: point ? point.y - height / 2 : defaultY,
    width,
    height,
    alt: asset.name,
    layoutMode:
      state.canvasMeta.layoutAxisMode === "none" ? "free" : "axis-bound",
    layoutGap: DEFAULT_LAYOUT_GAP,
    isMovementLocked: false,
  };
};

const normalizeTextInput = (
  textInput: Partial<BoardTextInput>,
  canvasMeta: CanvasShell,
) => {
  const defaultTextInput = getDefaultTextInput();
  const fontFamily = normalizeBoardTextFamily(
    textInput.fontFamily ?? defaultTextInput.fontFamily,
  );

  return {
    text: textInput.text ?? defaultTextInput.text,
    fontFamily: fontFamily || defaultTextInput.fontFamily,
    fontSize: clamp(
      Math.round(textInput.fontSize ?? defaultTextInput.fontSize),
      MIN_TEXT_FONT_SIZE,
      MAX_TEXT_FONT_SIZE,
    ),
    fontWeight: clamp(
      Math.round(textInput.fontWeight ?? defaultTextInput.fontWeight),
      MIN_TEXT_FONT_WEIGHT,
      MAX_TEXT_FONT_WEIGHT,
    ),
    color: textInput.color ?? defaultTextInput.color,
    align: textInput.align ?? defaultTextInput.align,
    maxWidth: clamp(
      Math.round(textInput.maxWidth ?? defaultTextInput.maxWidth),
      MIN_TEXT_BOX_WIDTH,
      Math.max(canvasMeta.width * 2, MIN_TEXT_BOX_WIDTH),
    ),
  } satisfies Omit<
    BoardTextItem,
    "id" | "x" | "y" | "layoutMode" | "layoutGap" | "isMovementLocked"
  >;
};

const createCanvasTextItem = (
  textInput: BoardTextInput,
  state: Pick<CanvasState, "canvasMeta">,
): BoardTextItem | null => {
  if (!state.canvasMeta) {
    return null;
  }

  const normalizedText = normalizeTextInput(textInput, state.canvasMeta);
  const draftItem: BoardTextItem = {
    id: generateId(),
    text: normalizedText.text,
    x: 0,
    y: 0,
    fontFamily: normalizedText.fontFamily,
    fontSize: normalizedText.fontSize,
    fontWeight: normalizedText.fontWeight,
    color: normalizedText.color,
    align: normalizedText.align,
    maxWidth: normalizedText.maxWidth,
    layoutMode:
      state.canvasMeta.layoutAxisMode === "none" ? "free" : "axis-bound",
    layoutGap: DEFAULT_LAYOUT_GAP,
    isMovementLocked: false,
  };
  const textBounds = measureTextItemBounds(draftItem);
  const offset = TEXT_INSERT_OFFSET_STEP;

  return {
    ...draftItem,
    x: textInput.x ?? (state.canvasMeta.width - normalizedText.maxWidth) / 2 + offset,
    y:
      textInput.y ??
      state.canvasMeta.height / 2 -
        textBounds.height / 2 +
        offset,
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
  const normalized = normalizeTextInput(
    {
      ...text,
      ...updates,
    },
    canvasMeta,
  );

  return {
    ...text,
    ...normalized,
  } satisfies BoardTextItem;
};

const getImagePositionForPreset = ({
  canvasMeta,
  image,
  preset,
}: {
  canvasMeta: CanvasShell;
  image: BoardImageItem;
  preset: BoardImagePositionPreset;
}) => {
  const centerX = (canvasMeta.width - image.width) / 2;
  const centerY = (canvasMeta.height - image.height) / 2;

  switch (preset) {
    case "top":
      return {
        x: centerX,
        y: IMAGE_POSITION_INSET,
      };
    case "bottom":
      return {
        x: centerX,
        y: canvasMeta.height - image.height - IMAGE_POSITION_INSET,
      };
    case "left":
      return {
        x: IMAGE_POSITION_INSET,
        y: centerY,
      };
    case "right":
      return {
        x: canvasMeta.width - image.width - IMAGE_POSITION_INSET,
        y: centerY,
      };
    case "center":
    default:
      return {
        x: centerX,
        y: centerY,
      };
  }
};

const getCanvasObjects = (state: CanvasState) =>
  state.canvasMeta
    ? getOrderedCanvasObjects({
        objectOrder: state.canvasMeta.objectOrder,
        imagesById: state.imagesById,
        textsById: state.textsById,
      })
    : [];

const realignAxisBoundObjects = <T extends CanvasState>(state: T): T => {
  const canvasMeta = state.canvasMeta;
  if (!canvasMeta || canvasMeta.layoutAxisMode === "none") {
    return state;
  }

  const axis = canvasMeta.layoutAxisMode;
  const boundObjects = getCanvasObjects(state).filter(
    (object) => object.item.layoutMode === "axis-bound",
  );

  if (!boundObjects.length) {
    return state;
  }

  const nextImagesById = { ...state.imagesById };
  const nextTextsById = { ...state.textsById };
  const boundsById = new Map(
    boundObjects.map((object) => [
      object.ref.id,
      object.kind === "image"
        ? getObjectBounds(object)
        : getObjectBounds(object, measureTextItemBounds(object.item)),
    ]),
  );
  const axisSize = axis === "horizontal" ? canvasMeta.width : canvasMeta.height;
  const totalSpan = boundObjects.reduce((sum, object, index) => {
    const bounds = boundsById.get(object.ref.id);
    if (!bounds) {
      return sum;
    }

    const size = axis === "horizontal" ? bounds.width : bounds.height;
    const gap = index === 0 ? 0 : object.item.layoutGap;
    return sum + gap + size;
  }, 0);

  let cursor = (axisSize - totalSpan) / 2;

  boundObjects.forEach((object, index) => {
    const bounds = boundsById.get(object.ref.id);
    if (!bounds) {
      return;
    }

    if (index > 0) {
      cursor += object.item.layoutGap;
    }

    const nextAxisPosition = cursor;
    const nextCrossPosition =
      axis === "horizontal"
        ? (canvasMeta.height - bounds.height) / 2
        : (canvasMeta.width - bounds.width) / 2;

    if (object.kind === "image") {
      nextImagesById[object.item.id] = {
        ...object.item,
        x: axis === "horizontal" ? roundPosition(nextAxisPosition) : roundPosition(nextCrossPosition),
        y: axis === "horizontal" ? roundPosition(nextCrossPosition) : roundPosition(nextAxisPosition),
      };
    } else {
      nextTextsById[object.item.id] = {
        ...object.item,
        x: axis === "horizontal" ? roundPosition(nextAxisPosition) : roundPosition(nextCrossPosition),
        y: axis === "horizontal" ? roundPosition(nextCrossPosition) : roundPosition(nextAxisPosition),
      };
    }

    cursor += axis === "horizontal" ? bounds.width : bounds.height;
  });

  return {
    ...state,
    imagesById: nextImagesById,
    textsById: nextTextsById,
  } as T;
};

const createDefaultCanvas = () => {
  const { defaultCanvasPresetId, defaultBackgroundPresetId } =
    useConfigStore.getState();
  const preset = getCanvasPresetById(defaultCanvasPresetId);

  return createCanvasFrame(preset.size, defaultBackgroundPresetId, preset.id);
};

const syncEditorUiWithCanvasFrame = (frame: CanvasFrame | null) => {
  const editorUiState = useEditorUiStore.getState();

  if (
    !frame ||
    frame.background.kind !== "image" ||
    frame.background.fit === "fill"
  ) {
    editorUiState.setBackgroundMoveMode(false);
  }

  if (!frame) {
    editorUiState.clearSelection();
    editorUiState.resetTextDraft();
    return;
  }

  const nextSelectedObjects = editorUiState.selectedObjects.filter((ref) =>
    frame.objectOrder.some((candidate) => isSameObjectRef(candidate, ref)),
  );
  const singleSelectedText =
    nextSelectedObjects.length === 1 && nextSelectedObjects[0].kind === "text"
      ? frame.texts.find((text) => text.id === nextSelectedObjects[0].id) ?? null
      : null;
  const editingTextStillExists = editorUiState.editingTextId
    ? frame.texts.some((text) => text.id === editorUiState.editingTextId)
    : false;

  useEditorUiStore.setState({
    selectedObjects: nextSelectedObjects,
    editingTextId: editingTextStillExists ? editorUiState.editingTextId : null,
    textDraft: singleSelectedText
      ? {
          text: singleSelectedText.text,
          fontFamily: singleSelectedText.fontFamily,
          fontSize: singleSelectedText.fontSize,
          fontWeight: singleSelectedText.fontWeight,
          color: singleSelectedText.color,
          align: singleSelectedText.align,
          maxWidth: singleSelectedText.maxWidth,
        }
      : getDefaultTextInput(),
  });
};

type CanvasStore = CanvasState & CanvasHistoryState & CanvasActions;

type CanvasStoreSet = (
  partial:
    | CanvasStore
    | Partial<CanvasStore>
    | ((state: CanvasStore) => CanvasStore | Partial<CanvasStore>),
) => void;

const applyCanvasStateChange = (
  set: CanvasStoreSet,
  updater: (state: CanvasStore) => CanvasStore,
) => {
  set((state) => {
    const nextState = updater(state);

    if (nextState === state) {
      return state;
    }

    const currentFrame = serializeCanvasState(state);

    return {
      ...nextState,
      historyPast:
        currentFrame && !state.historyTransactionStart
          ? [...state.historyPast, currentFrame]
          : state.historyPast,
      historyFuture: currentFrame ? [] : state.historyFuture,
    };
  });
};

const migratePersistedState = (persistedState: unknown) => {
  const state = (persistedState ?? {}) as PersistedCanvasState;
  const legacyCanvasMeta = state.canvasMeta;

  if (!legacyCanvasMeta) {
    return {
      canvasMeta: null,
      imagesById: EMPTY_CANVAS_IMAGES,
      textsById: EMPTY_CANVAS_TEXT,
    } satisfies Partial<CanvasStore>;
  }

  const legacyFrame: LegacyCanvasFrame = {
    id: legacyCanvasMeta.id,
    title: legacyCanvasMeta.title,
    width: legacyCanvasMeta.width,
    height: legacyCanvasMeta.height,
    presetId: legacyCanvasMeta.presetId ?? null,
    layoutAxisMode: legacyCanvasMeta.layoutAxisMode ?? "none",
    background: legacyCanvasMeta.background,
    backgroundPresetId: legacyCanvasMeta.backgroundPresetId ?? null,
    backgroundEffects:
      legacyCanvasMeta.backgroundEffects ?? DEFAULT_CANVAS_BACKGROUND_EFFECTS,
    objectOrder:
      legacyCanvasMeta.objectOrder ??
      [
        ...(state.imageOrder ?? Object.keys(state.imagesById ?? {})).map((id) =>
          createObjectRef("image", id),
        ),
        ...(state.textOrder ?? Object.keys(state.textsById ?? {})).map((id) =>
          createObjectRef("text", id),
        ),
      ],
    images: Object.values(state.imagesById ?? {}),
    texts: Object.values(state.textsById ?? {}),
  };

  return normalizeCanvasFrame(legacyFrame);
};

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => ({
      canvasMeta: null,
      imagesById: EMPTY_CANVAS_IMAGES,
      textsById: EMPTY_CANVAS_TEXT,
      historyPast: [],
      historyFuture: [],
      historyTransactionStart: null,

      initializeDefaultCanvas: () => {
        const existingCanvas = serializeCanvasState(get());
        if (existingCanvas) {
          return existingCanvas;
        }

        const canvas = createDefaultCanvas();
        set({
          ...normalizeCanvasFrame(canvas),
          historyPast: [],
          historyFuture: [],
          historyTransactionStart: null,
        });
        useEditorUiStore.getState().clearSelection();
        useEditorUiStore.getState().resetTextDraft();

        return canvas;
      },

      updateCanvasTitle: (title) =>
        applyCanvasStateChange(set, (state) => {
          const canvasMeta = state.canvasMeta;
          if (!canvasMeta) {
            return state;
          }

          const nextTitle = title.trim() || "untitled";
          if (canvasMeta.title === nextTitle) {
            return state;
          }

          return {
            ...state,
            canvasMeta: {
              ...canvasMeta,
              title: nextTitle,
            },
          };
        }),

      resizeCanvas: (size, presetId = null) =>
        applyCanvasStateChange(set, (state) => {
          if (!state.canvasMeta) {
            return state;
          }

          return realignAxisBoundObjects({
            ...state,
            canvasMeta: {
              ...state.canvasMeta,
              width: size.width,
              height: size.height,
              presetId,
            },
          });
        }),

      applyBackgroundToCanvas: (backgroundPresetId) => {
        const backgroundPreset = findCanvasBackgroundById(backgroundPresetId);
        if (!backgroundPreset) {
          return;
        }

        applyCanvasStateChange(set, (state) => {
          if (!state.canvasMeta) {
            return state;
          }

          disableBackgroundMoveMode();

          return {
            ...state,
            canvasMeta: {
              ...state.canvasMeta,
              backgroundPresetId: backgroundPreset.id,
              background: createCanvasBackgroundFromPreset(backgroundPreset),
            },
          };
        });
      },

      applySolidColorBackground: (color) =>
        applyCanvasStateChange(set, (state) => {
          if (!state.canvasMeta) {
            return state;
          }

          disableBackgroundMoveMode();

          return {
            ...state,
            canvasMeta: {
              ...state.canvasMeta,
              backgroundPresetId: null,
              background: {
                kind: "solid",
                color,
              },
            },
          };
        }),

      applyAssetBackgroundToCanvas: (assetId) =>
        applyCanvasStateChange(set, (state) => {
          if (!state.canvasMeta) {
            return state;
          }

          disableBackgroundMoveMode();

          return {
            ...state,
            canvasMeta: {
              ...state.canvasMeta,
              backgroundPresetId: null,
              background: createCanvasAssetImageBackground(assetId),
            },
          };
        }),

      updateCanvasBackgroundImage: (updates) =>
        applyCanvasStateChange(set, (state) => {
          const canvasMeta = state.canvasMeta;
          if (!canvasMeta) {
            return state;
          }

          const background = canvasMeta.background;
          if (background.kind !== "image") {
            return state;
          }

          const nextFit = updates.fit ?? background.fit;
          const nextBackground = {
            ...background,
            fit: nextFit,
            offsetX:
              nextFit === "fill"
                ? 0
                : Math.round(updates.offsetX ?? background.offsetX),
            offsetY:
              nextFit === "fill"
                ? 0
                : Math.round(updates.offsetY ?? background.offsetY),
          } satisfies Extract<CanvasBackgroundValue, { kind: "image" }>;

          if (
            background.fit === nextBackground.fit &&
            background.offsetX === nextBackground.offsetX &&
            background.offsetY === nextBackground.offsetY
          ) {
            return state;
          }

          if (nextBackground.fit === "fill") {
            disableBackgroundMoveMode();
          }

          return {
            ...state,
            canvasMeta: {
              ...canvasMeta,
              background: nextBackground,
            },
          };
        }),

      updateCanvasBackgroundEffects: (updates) =>
        applyCanvasStateChange(set, (state) => {
          if (!state.canvasMeta) {
            return state;
          }

          const nextEffects = normalizeCanvasBackgroundEffects({
            ...state.canvasMeta.backgroundEffects,
            ...updates,
          });

          if (
            areCanvasBackgroundEffectsEqual(
              state.canvasMeta.backgroundEffects,
              nextEffects,
            )
          ) {
            return state;
          }

          return {
            ...state,
            canvasMeta: {
              ...state.canvasMeta,
              backgroundEffects: nextEffects,
            },
          };
        }),

      resetCanvasBackgroundEffects: () =>
        applyCanvasStateChange(set, (state) => {
          if (!state.canvasMeta) {
            return state;
          }

          if (
            areCanvasBackgroundEffectsEqual(
              state.canvasMeta.backgroundEffects,
              DEFAULT_CANVAS_BACKGROUND_EFFECTS,
            )
          ) {
            return state;
          }

          return {
            ...state,
            canvasMeta: {
              ...state.canvasMeta,
              backgroundEffects: {
                ...DEFAULT_CANVAS_BACKGROUND_EFFECTS,
              },
            },
          };
        }),

      clearCanvas: () =>
        applyCanvasStateChange(set, (state) => {
          const canvasMeta = state.canvasMeta;
          if (!canvasMeta) {
            return state;
          }

          useEditorUiStore.getState().clearSelection();
          useEditorUiStore.getState().resetTextDraft();

          return {
            ...state,
            canvasMeta: {
              ...canvasMeta,
              backgroundPresetId: null,
              background: {
                kind: "solid",
                color: "#ffffff",
              },
              backgroundEffects: {
                ...DEFAULT_CANVAS_BACKGROUND_EFFECTS,
              },
              objectOrder: [],
            },
            imagesById: EMPTY_CANVAS_IMAGES,
            textsById: EMPTY_CANVAS_TEXT,
          };
        }),

      undo: () => {
        const previousFrame =
          get().historyPast[get().historyPast.length - 1] ?? null;

        if (!previousFrame) {
          return;
        }

        set((state) => {
          const currentFrame = serializeCanvasState(state);

          return {
            ...normalizeCanvasFrame(previousFrame),
            historyPast: state.historyPast.slice(0, -1),
            historyFuture: currentFrame
              ? [currentFrame, ...state.historyFuture]
              : state.historyFuture,
            historyTransactionStart: null,
          };
        });

        syncEditorUiWithCanvasFrame(previousFrame);
      },

      redo: () => {
        const nextFrame = get().historyFuture[0] ?? null;

        if (!nextFrame) {
          return;
        }

        set((state) => {
          const currentFrame = serializeCanvasState(state);

          return {
            ...normalizeCanvasFrame(nextFrame),
            historyPast: currentFrame
              ? [...state.historyPast, currentFrame]
              : state.historyPast,
            historyFuture: state.historyFuture.slice(1),
            historyTransactionStart: null,
          };
        });

        syncEditorUiWithCanvasFrame(nextFrame);
      },

      beginHistoryTransaction: () => {
        if (get().historyTransactionStart) {
          return;
        }

        set((state) => ({
          historyTransactionStart: serializeCanvasState(state),
        }));
      },

      endHistoryTransaction: () =>
        set((state) => {
          const transactionStart = state.historyTransactionStart;
          const currentFrame = serializeCanvasState(state);

          if (!transactionStart) {
            return state;
          }

          if (
            !currentFrame ||
            areCanvasFramesEqual(transactionStart, currentFrame)
          ) {
            return {
              historyTransactionStart: null,
            };
          }

          return {
            historyPast: [...state.historyPast, transactionStart],
            historyTransactionStart: null,
          };
        }),

      insertImageOnActiveCanvas: (asset) => {
        const image = createCanvasImageItem(asset, get());
        if (!image) {
          return null;
        }

        applyCanvasStateChange(set, (state) =>
          realignAxisBoundObjects({
            ...state,
            canvasMeta: state.canvasMeta
              ? {
                  ...state.canvasMeta,
                  objectOrder: [
                    ...state.canvasMeta.objectOrder,
                    createObjectRef("image", image.id),
                  ],
                }
              : null,
            imagesById: {
              ...state.imagesById,
              [image.id]: image,
            },
          }),
        );
        useEditorUiStore.getState().selectImage(image.id);

        return image.id;
      },

      insertImageOnCanvasAtPoint: (asset, point) => {
        const image = createCanvasImageItem(asset, get(), point);
        if (!image) {
          return null;
        }

        applyCanvasStateChange(set, (state) =>
          realignAxisBoundObjects({
            ...state,
            canvasMeta: state.canvasMeta
              ? {
                  ...state.canvasMeta,
                  objectOrder: [
                    ...state.canvasMeta.objectOrder,
                    createObjectRef("image", image.id),
                  ],
                }
              : null,
            imagesById: {
              ...state.imagesById,
              [image.id]: image,
            },
          }),
        );
        useEditorUiStore.getState().selectImage(image.id);

        return image.id;
      },

      insertTextOnActiveCanvas: (textInput) => {
        const text = createCanvasTextItem(textInput, get());
        if (!text) {
          return null;
        }

        applyCanvasStateChange(set, (state) =>
          realignAxisBoundObjects({
            ...state,
            canvasMeta: state.canvasMeta
              ? {
                  ...state.canvasMeta,
                  objectOrder: [
                    ...state.canvasMeta.objectOrder,
                    createObjectRef("text", text.id),
                  ],
                }
              : null,
            textsById: {
              ...state.textsById,
              [text.id]: text,
            },
          }),
        );
        useEditorUiStore.getState().selectText(text);

        return text.id;
      },

      moveObjectsOnCanvas: (moves, options) =>
        applyCanvasStateChange(set, (state) => {
          if (!state.canvasMeta || !moves.length) {
            return state;
          }

          const nextImagesById = { ...state.imagesById };
          const nextTextsById = { ...state.textsById };
          let changed = false;

          for (const move of moves) {
            if (move.ref.kind === "image") {
              const image = nextImagesById[move.ref.id];
              if (!image || image.isMovementLocked) {
                continue;
              }

              const nextImage = {
                ...image,
                x: roundPosition(move.x),
                y: roundPosition(move.y),
                layoutMode:
                  options?.releaseFromAxis || image.layoutMode === "free"
                    ? "free"
                    : image.layoutMode,
              } satisfies BoardImageItem;

              if (
                nextImage.x !== image.x ||
                nextImage.y !== image.y ||
                nextImage.layoutMode !== image.layoutMode
              ) {
                nextImagesById[move.ref.id] = nextImage;
                changed = true;
              }
              continue;
            }

            const text = nextTextsById[move.ref.id];
            if (!text || text.isMovementLocked) {
              continue;
            }

            const nextText = {
              ...text,
              x: roundPosition(move.x),
              y: roundPosition(move.y),
              layoutMode:
                options?.releaseFromAxis || text.layoutMode === "free"
                  ? "free"
                  : text.layoutMode,
            } satisfies BoardTextItem;

            if (
              nextText.x !== text.x ||
              nextText.y !== text.y ||
              nextText.layoutMode !== text.layoutMode
            ) {
              nextTextsById[move.ref.id] = nextText;
              changed = true;
            }
          }

          if (!changed) {
            return state;
          }

          const nextState = {
            ...state,
            imagesById: nextImagesById,
            textsById: nextTextsById,
          };

          return options?.releaseFromAxis &&
            state.canvasMeta.layoutAxisMode !== "none"
            ? realignAxisBoundObjects(nextState)
            : nextState;
        }),

      resizeImageOnCanvas: (imageId, width, height) =>
        applyCanvasStateChange(set, (state) => {
          const image = state.imagesById[imageId];
          if (!image) {
            return state;
          }

          const nextSize = {
            width: Math.max(Math.round(width), MIN_IMAGE_SIZE),
            height: Math.max(Math.round(height), MIN_IMAGE_SIZE),
          };

          if (
            image.width === nextSize.width &&
            image.height === nextSize.height
          ) {
            return state;
          }

          return realignAxisBoundObjects({
            ...state,
            imagesById: {
              ...state.imagesById,
              [imageId]: {
                ...image,
                ...nextSize,
              },
            },
          });
        }),

      positionImageOnCanvas: (imageId, preset) =>
        applyCanvasStateChange(set, (state) => {
          const canvasMeta = state.canvasMeta;
          const image = state.imagesById[imageId];
          if (!canvasMeta || !image || image.isMovementLocked) {
            return state;
          }

          const nextPosition = getImagePositionForPreset({
            canvasMeta,
            image,
            preset,
          });

          if (image.x === nextPosition.x && image.y === nextPosition.y) {
            return state;
          }

          return {
            ...state,
            imagesById: {
              ...state.imagesById,
              [imageId]: {
                ...image,
                ...nextPosition,
                layoutMode: "free",
              },
            },
          };
        }),

      toggleObjectMovementLock: (ref) =>
        applyCanvasStateChange(set, (state) => {
          if (ref.kind === "image") {
            const image = state.imagesById[ref.id];
            if (!image) {
              return state;
            }

            return {
              ...state,
              imagesById: {
                ...state.imagesById,
                [ref.id]: {
                  ...image,
                  isMovementLocked: !image.isMovementLocked,
                },
              },
            };
          }

          const text = state.textsById[ref.id];
          if (!text) {
            return state;
          }

          return {
            ...state,
            textsById: {
              ...state.textsById,
              [ref.id]: {
                ...text,
                isMovementLocked: !text.isMovementLocked,
              },
            },
          };
        }),

      updateTextOnCanvas: (textId, updates) =>
        applyCanvasStateChange(set, (state) => {
          const canvasMeta = state.canvasMeta;
          const text = state.textsById[textId];
          if (!canvasMeta || !text) {
            return state;
          }

          const nextText = applyTextItemUpdates({
            text,
            updates,
            canvasMeta,
          });

          return realignAxisBoundObjects({
            ...state,
            textsById: {
              ...state.textsById,
              [textId]: nextText,
            },
          });
        }),

      updateLayoutAxisMode: (mode) =>
        applyCanvasStateChange(set, (state) => {
          if (!state.canvasMeta || state.canvasMeta.layoutAxisMode === mode) {
            return state;
          }

          const nextState = {
            ...state,
            canvasMeta: {
              ...state.canvasMeta,
              layoutAxisMode: mode,
            },
          };

          return mode === "none" ? nextState : realignAxisBoundObjects(nextState);
        }),

      moveObjectUp: (ref) =>
        applyCanvasStateChange(set, (state) => {
          const canvasMeta = state.canvasMeta;
          if (!canvasMeta) {
            return state;
          }

          const index = canvasMeta.objectOrder.findIndex((item) =>
            isSameObjectRef(item, ref),
          );
          if (index < 0 || index === canvasMeta.objectOrder.length - 1) {
            return state;
          }

          const nextOrder = [...canvasMeta.objectOrder];
          [nextOrder[index], nextOrder[index + 1]] = [
            nextOrder[index + 1],
            nextOrder[index],
          ];

          return realignAxisBoundObjects({
            ...state,
            canvasMeta: {
              ...canvasMeta,
              objectOrder: nextOrder,
            },
          });
        }),

      moveObjectDown: (ref) =>
        applyCanvasStateChange(set, (state) => {
          const canvasMeta = state.canvasMeta;
          if (!canvasMeta) {
            return state;
          }

          const index = canvasMeta.objectOrder.findIndex((item) =>
            isSameObjectRef(item, ref),
          );
          if (index <= 0) {
            return state;
          }

          const nextOrder = [...canvasMeta.objectOrder];
          [nextOrder[index - 1], nextOrder[index]] = [
            nextOrder[index],
            nextOrder[index - 1],
          ];

          return realignAxisBoundObjects({
            ...state,
            canvasMeta: {
              ...canvasMeta,
              objectOrder: nextOrder,
            },
          });
        }),

      setSelectedObjectDistance: (distance) =>
        applyCanvasStateChange(set, (state) => {
          const canvasMeta = state.canvasMeta;
          const selectedObjects = useEditorUiStore.getState().selectedObjects;
          if (
            !canvasMeta ||
            canvasMeta.layoutAxisMode === "none" ||
            selectedObjects.length !== 2
          ) {
            return state;
          }

          const orderedSelected = canvasMeta.objectOrder.filter((ref) =>
            selectedObjects.some((selected) => isSameObjectRef(selected, ref)),
          );
          if (orderedSelected.length !== 2) {
            return state;
          }

          const [higherRef, lowerRef] = orderedSelected;
          const nextImagesById = { ...state.imagesById };
          const nextTextsById = { ...state.textsById };
          const normalizedDistance = Math.round(distance);

          for (const ref of [higherRef, lowerRef]) {
            if (ref.kind === "image" && nextImagesById[ref.id]) {
              nextImagesById[ref.id] = {
                ...nextImagesById[ref.id],
                layoutMode: "axis-bound",
                layoutGap:
                  ref.id === lowerRef.id
                    ? normalizedDistance
                    : nextImagesById[ref.id].layoutGap,
              };
            }

            if (ref.kind === "text" && nextTextsById[ref.id]) {
              nextTextsById[ref.id] = {
                ...nextTextsById[ref.id],
                layoutMode: "axis-bound",
                layoutGap:
                  ref.id === lowerRef.id
                    ? normalizedDistance
                    : nextTextsById[ref.id].layoutGap,
              };
            }
          }

          return realignAxisBoundObjects({
            ...state,
            imagesById: nextImagesById,
            textsById: nextTextsById,
          });
        }),

      removeSelectedObjects: () =>
        applyCanvasStateChange(set, (state) => {
          const canvasMeta = state.canvasMeta;
          const selectedObjects = useEditorUiStore.getState().selectedObjects;
          if (!canvasMeta || !selectedObjects.length) {
            return state;
          }

          const selectedKeys = new Set(
            selectedObjects.map((ref) => `${ref.kind}:${ref.id}`),
          );
          const nextImagesById = { ...state.imagesById };
          const nextTextsById = { ...state.textsById };

          selectedObjects.forEach((ref) => {
            if (ref.kind === "image") {
              delete nextImagesById[ref.id];
            } else {
              delete nextTextsById[ref.id];
            }
          });

          useEditorUiStore.getState().clearSelection();
          useEditorUiStore.getState().resetTextDraft();

          return {
            ...state,
            canvasMeta: {
              ...canvasMeta,
              objectOrder: canvasMeta.objectOrder.filter(
                (ref) => !selectedKeys.has(`${ref.kind}:${ref.id}`),
              ),
            },
            imagesById: nextImagesById,
            textsById: nextTextsById,
          };
        }),

      resetCanvas: (size) => {
        const preset = getCanvasPresetBySize(size);
        const { defaultBackgroundPresetId } = useConfigStore.getState();
        const canvas = createCanvasFrame(
          size,
          defaultBackgroundPresetId,
          preset?.id ?? null,
        );
        set((state) => {
          const currentFrame = serializeCanvasState(state);

          return {
            ...normalizeCanvasFrame(canvas),
            historyPast: currentFrame
              ? [...state.historyPast, currentFrame]
              : state.historyPast,
            historyFuture: [],
            historyTransactionStart: null,
          };
        });
        useEditorUiStore.getState().clearSelection();
        useEditorUiStore.getState().resetTextDraft();

        return canvas;
      },

      serializeCanvas: () => serializeCanvasState(get()),
    }),
    {
      name: "board-canvas-storage",
      version: 2,
      migrate: migratePersistedState,
      partialize: (state) => ({
        canvasMeta: state.canvasMeta,
        imagesById: state.imagesById,
        textsById: state.textsById,
      }),
    },
  ),
);

export const useCanvasShell = () => useCanvasStore((state) => state.canvasMeta);

export const useCanvasText = (textId: string) =>
  useCanvasStore((state) => state.textsById[textId] ?? null);

export const useOrderedCanvasObjects = () => {
  const objectOrder = useCanvasStore(
    (state) => state.canvasMeta?.objectOrder ?? null,
  );
  const imagesById = useCanvasStore((state) => state.imagesById);
  const textsById = useCanvasStore((state) => state.textsById);

  return useMemo(
    () =>
      objectOrder
        ? getOrderedCanvasObjects({
            objectOrder,
            imagesById,
            textsById,
          })
        : [],
    [imagesById, objectOrder, textsById],
  );
};

export const useActiveCanvasPreset = () => {
  const canvasMeta = useCanvasShell();
  const defaultCanvasPresetId = useConfigStore(
    (state) => state.defaultCanvasPresetId,
  );

  if (!canvasMeta) {
    const preset = getCanvasPresetById(defaultCanvasPresetId);

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

  return findCanvasBackgroundById(canvasMeta?.backgroundPresetId);
};
