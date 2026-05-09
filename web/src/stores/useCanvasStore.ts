// Review note: Persistent canvas state store with history, object mutation, layout, and serialization logic.
// The comments in this file are intentionally dense to support the requested review pass.

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

/**
 * Documents the canvas state contract used by the surrounding feature.
 */
type CanvasState = {
  canvasMeta: CanvasShell | null;
  imagesById: Record<string, BoardImageItem>;
  textsById: Record<string, BoardTextItem>;
};

/**
 * Documents the canvas history state contract used by the surrounding feature.
 */
type CanvasHistoryState = {
  historyPast: CanvasFrame[];
  historyFuture: CanvasFrame[];
  historyTransactionStart: CanvasFrame | null;
};

/**
 * Documents the object move input contract used by the surrounding feature.
 */
type ObjectMoveInput = {
  ref: BoardObjectRef;
  x: number;
  y: number;
};

/**
 * Documents the canvas actions contract used by the surrounding feature.
 */
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

/**
 * Keeps max_initial_image_scale in one named constant so related calculations stay consistent.
 */
const MAX_INITIAL_IMAGE_SCALE = 0.8;
/**
 * Keeps image_position_inset in one named constant so related calculations stay consistent.
 */
const IMAGE_POSITION_INSET = 24;
/**
 * Keeps min_image_size in one named constant so related calculations stay consistent.
 */
const MIN_IMAGE_SIZE = 48;
/**
 * Keeps text_insert_offset_step in one named constant so related calculations stay consistent.
 */
const TEXT_INSERT_OFFSET_STEP = 24;
/**
 * Keeps min_text_font_size in one named constant so related calculations stay consistent.
 */
const MIN_TEXT_FONT_SIZE = 12;
/**
 * Keeps max_text_font_size in one named constant so related calculations stay consistent.
 */
const MAX_TEXT_FONT_SIZE = 180;
/**
 * Keeps min_text_font_weight in one named constant so related calculations stay consistent.
 */
const MIN_TEXT_FONT_WEIGHT = 100;
/**
 * Keeps max_text_font_weight in one named constant so related calculations stay consistent.
 */
const MAX_TEXT_FONT_WEIGHT = 900;
/**
 * Keeps min_text_box_width in one named constant so related calculations stay consistent.
 */
const MIN_TEXT_BOX_WIDTH = 120;
/**
 * Keeps default_layout_gap in one named constant so related calculations stay consistent.
 */
const DEFAULT_LAYOUT_GAP = 24;

/**
 * Handles the generate id behavior for this module.
 */
const generateId = () => {
  // Keep this conditional branch explicit because it changes the user-visible editor behavior.
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.randomUUID
  ) {
    // Return the resolved value to the caller after all guards and transformations.
    return window.crypto.randomUUID();
  }

  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

/**
 * Handles the clamp behavior for this module.
 */
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Handles the round position behavior for this module.
 */
const roundPosition = (value: number) => Math.round(value * 100) / 100;

/**
 * Keeps empty_canvas_images in one named constant so related calculations stay consistent.
 */
const EMPTY_CANVAS_IMAGES: Record<string, BoardImageItem> = {};
/**
 * Keeps empty_canvas_text in one named constant so related calculations stay consistent.
 */
const EMPTY_CANVAS_TEXT: Record<string, BoardTextItem> = {};

/**
 * Resolves get default text input from the available editor state.
 */
const getDefaultTextInput = () => useConfigStore.getState().text.defaultInput;
/**
 * Handles the disable background move mode behavior for this module.
 */
const disableBackgroundMoveMode = () =>
  useEditorUiStore.getState().setBackgroundMoveMode(false);

/**
 * Answers the are canvas frames equal predicate used to choose the next branch.
 */
const areCanvasFramesEqual = (left: CanvasFrame, right: CanvasFrame) =>
  JSON.stringify(left) === JSON.stringify(right);

/**
 * Documents the legacy image item contract used by the surrounding feature.
 */
type LegacyImageItem = Omit<BoardImageItem, "layoutMode" | "layoutGap" | "isMovementLocked"> &
  Partial<Pick<BoardImageItem, "layoutMode" | "layoutGap" | "isMovementLocked">>;
/**
 * Documents the legacy text item contract used by the surrounding feature.
 */
type LegacyTextItem = Omit<BoardTextItem, "layoutMode" | "layoutGap" | "isMovementLocked"> &
  Partial<Pick<BoardTextItem, "layoutMode" | "layoutGap" | "isMovementLocked">>;
/**
 * Documents the legacy canvas frame contract used by the surrounding feature.
 */
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
/**
 * Documents the persisted canvas state contract used by the surrounding feature.
 */
type PersistedCanvasState = Partial<
  CanvasState & {
    version?: number;
  }
> & {
  imageOrder?: string[];
  textOrder?: string[];
};

/**
 * Normalizes normalize image item before the value is stored or rendered.
 */
const normalizeImageItem = (image: LegacyImageItem): BoardImageItem => ({
  ...image,
  layoutMode: image.layoutMode ?? "free",
  isMovementLocked: image.isMovementLocked ?? false,
  layoutGap:
    typeof image.layoutGap === "number" && Number.isFinite(image.layoutGap)
      ? Math.round(image.layoutGap)
      : DEFAULT_LAYOUT_GAP,
});

/**
 * Normalizes normalize text item before the value is stored or rendered.
 */
const normalizeTextItem = (text: LegacyTextItem): BoardTextItem => ({
  ...text,
  layoutMode: text.layoutMode ?? "free",
  isMovementLocked: text.isMovementLocked ?? false,
  layoutGap:
    typeof text.layoutGap === "number" && Number.isFinite(text.layoutGap)
      ? Math.round(text.layoutGap)
    : DEFAULT_LAYOUT_GAP,
});

/**
 * Resolves get legacy object order from the available editor state.
 */
const getLegacyObjectOrder = ({
  images,
  texts,
  objectOrder,
}: Pick<LegacyCanvasFrame, "images" | "texts" | "objectOrder">) => {
  const safeTexts = texts ?? [];

  if (objectOrder?.length) {
    // Return the resolved value to the caller after all guards and transformations.
    return objectOrder;
  }

  return [
    ...images.map((image) => createObjectRef("image", image.id)),
    ...safeTexts.map((text) => createObjectRef("text", text.id)),
  ];
};

/**
 * Normalizes normalize canvas frame before the value is stored or rendered.
 */
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

/**
 * Handles the serialize canvas state behavior for this module.
 */
const serializeCanvasState = ({
  canvasMeta,
  imagesById,
  textsById,
}: CanvasState): CanvasFrame | null => {
  // Guard this branch so missing or invalid state does not flow into the main path.
  if (!canvasMeta) {
    // Return null when this helper cannot produce a usable value.
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

/**
 * Resolves get contained image size from the available editor state.
 */
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

/**
 * Builds create canvas image item from normalized inputs.
 */
const createCanvasImageItem = (
  asset: UploadLibraryAssetMeta,
  state: Pick<CanvasState, "canvasMeta">,
  point?: { x: number; y: number },
): BoardImageItem | null => {
  // Guard this branch so missing or invalid state does not flow into the main path.
  if (!state.canvasMeta) {
    // Return null when this helper cannot produce a usable value.
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

/**
 * Normalizes normalize text input before the value is stored or rendered.
 */
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

/**
 * Builds create canvas text item from normalized inputs.
 */
const createCanvasTextItem = (
  textInput: BoardTextInput,
  state: Pick<CanvasState, "canvasMeta">,
): BoardTextItem | null => {
  // Guard this branch so missing or invalid state does not flow into the main path.
  if (!state.canvasMeta) {
    // Return null when this helper cannot produce a usable value.
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

/**
 * Handles the apply text item updates behavior for this module.
 */
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

/**
 * Resolves get image position for preset from the available editor state.
 */
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
      // Return the resolved value to the caller after all guards and transformations.
      return {
        x: centerX,
        y: IMAGE_POSITION_INSET,
      };
    case "bottom":
      // Return the resolved value to the caller after all guards and transformations.
      return {
        x: centerX,
        y: canvasMeta.height - image.height - IMAGE_POSITION_INSET,
      };
    case "left":
      // Return the resolved value to the caller after all guards and transformations.
      return {
        x: IMAGE_POSITION_INSET,
        y: centerY,
      };
    case "right":
      // Return the resolved value to the caller after all guards and transformations.
      return {
        x: canvasMeta.width - image.width - IMAGE_POSITION_INSET,
        y: centerY,
      };
    case "center":
    default:
      // Return the resolved value to the caller after all guards and transformations.
      return {
        x: centerX,
        y: centerY,
      };
  }
};

/**
 * Resolves get canvas objects from the available editor state.
 */
const getCanvasObjects = (state: CanvasState) =>
  state.canvasMeta
    ? getOrderedCanvasObjects({
        objectOrder: state.canvasMeta.objectOrder,
        imagesById: state.imagesById,
        textsById: state.textsById,
      })
    : [];

/**
 * Handles the realign axis bound objects behavior for this module.
 */
const realignAxisBoundObjects = <T extends CanvasState>(state: T): T => {
  const canvasMeta = state.canvasMeta;
  // Guard this branch so missing or invalid state does not flow into the main path.
  if (!canvasMeta || canvasMeta.layoutAxisMode === "none") {
    // Return the resolved value to the caller after all guards and transformations.
    return state;
  }

  const axis = canvasMeta.layoutAxisMode;
  const boundObjects = getCanvasObjects(state).filter(
    (object) => object.item.layoutMode === "axis-bound",
  );

  if (!boundObjects.length) {
    // Return the resolved value to the caller after all guards and transformations.
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
    // Guard this branch so missing or invalid state does not flow into the main path.
    if (!bounds) {
      // Return the resolved value to the caller after all guards and transformations.
      return sum;
    }

    const size = axis === "horizontal" ? bounds.width : bounds.height;
    const gap = index === 0 ? 0 : object.item.layoutGap;
    // Return the resolved value to the caller after all guards and transformations.
    return sum + gap + size;
  }, 0);

  let cursor = (axisSize - totalSpan) / 2;

  boundObjects.forEach((object, index) => {
    const bounds = boundsById.get(object.ref.id);
    // Guard this branch so missing or invalid state does not flow into the main path.
    if (!bounds) {
      // Return the resolved value to the caller after all guards and transformations.
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

/**
 * Builds create default canvas from normalized inputs.
 */
const createDefaultCanvas = () => {
  const { defaultCanvasPresetId, defaultBackgroundPresetId } =
    useConfigStore.getState();
  const preset = getCanvasPresetById(defaultCanvasPresetId);

  return createCanvasFrame(preset.size, defaultBackgroundPresetId, preset.id);
};

/**
 * Handles the sync editor ui with canvas frame behavior for this module.
 */
const syncEditorUiWithCanvasFrame = (frame: CanvasFrame | null) => {
  // Select this store or hook value close to where the component uses it.
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
    // Return the resolved value to the caller after all guards and transformations.
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

/**
 * Documents the canvas store contract used by the surrounding feature.
 */
type CanvasStore = CanvasState & CanvasHistoryState & CanvasActions;

/**
 * Documents the canvas store set contract used by the surrounding feature.
 */
type CanvasStoreSet = (
  partial:
    | CanvasStore
    | Partial<CanvasStore>
    | ((state: CanvasStore) => CanvasStore | Partial<CanvasStore>),
) => void;

/**
 * Handles the apply canvas state change behavior for this module.
 */
const applyCanvasStateChange = (
  set: CanvasStoreSet,
  updater: (state: CanvasStore) => CanvasStore,
) => {
  set((state) => {
    const nextState = updater(state);

    if (nextState === state) {
      // Return the resolved value to the caller after all guards and transformations.
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

/**
 * Handles the migrate persisted state behavior for this module.
 */
const migratePersistedState = (persistedState: unknown) => {
  const state = (persistedState ?? {}) as PersistedCanvasState;
  const legacyCanvasMeta = state.canvasMeta;

  if (!legacyCanvasMeta) {
    // Return the resolved value to the caller after all guards and transformations.
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

/**
 * Owns persisted canvas data, history stacks, and every mutation that changes the board.
 */
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
        // Keep this conditional branch explicit because it changes the user-visible editor behavior.
        if (existingCanvas) {
          // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!canvasMeta) {
            // Return the resolved value to the caller after all guards and transformations.
            return state;
          }

          const nextTitle = title.trim() || "untitled";
          // Keep this conditional branch explicit because it changes the user-visible editor behavior.
          if (canvasMeta.title === nextTitle) {
            // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!state.canvasMeta) {
            // Return the resolved value to the caller after all guards and transformations.
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
        // Guard this branch so missing or invalid state does not flow into the main path.
        if (!backgroundPreset) {
          // Return the resolved value to the caller after all guards and transformations.
          return;
        }

        applyCanvasStateChange(set, (state) => {
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!state.canvasMeta) {
            // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!state.canvasMeta) {
            // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!state.canvasMeta) {
            // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!canvasMeta) {
            // Return the resolved value to the caller after all guards and transformations.
            return state;
          }

          const background = canvasMeta.background;
          // Keep this conditional branch explicit because it changes the user-visible editor behavior.
          if (background.kind !== "image") {
            // Return the resolved value to the caller after all guards and transformations.
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
            // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!state.canvasMeta) {
            // Return the resolved value to the caller after all guards and transformations.
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
            // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!state.canvasMeta) {
            // Return the resolved value to the caller after all guards and transformations.
            return state;
          }

          if (
            areCanvasBackgroundEffectsEqual(
              state.canvasMeta.backgroundEffects,
              DEFAULT_CANVAS_BACKGROUND_EFFECTS,
            )
          ) {
            // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!canvasMeta) {
            // Return the resolved value to the caller after all guards and transformations.
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
          // Return the resolved value to the caller after all guards and transformations.
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
          // Return the resolved value to the caller after all guards and transformations.
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
        // Keep this conditional branch explicit because it changes the user-visible editor behavior.
        if (get().historyTransactionStart) {
          // Return the resolved value to the caller after all guards and transformations.
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
            // Return the resolved value to the caller after all guards and transformations.
            return state;
          }

          if (
            !currentFrame ||
            areCanvasFramesEqual(transactionStart, currentFrame)
          ) {
            // Return the resolved value to the caller after all guards and transformations.
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
        // Guard this branch so missing or invalid state does not flow into the main path.
        if (!image) {
          // Return null when this helper cannot produce a usable value.
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
        // Guard this branch so missing or invalid state does not flow into the main path.
        if (!image) {
          // Return null when this helper cannot produce a usable value.
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
        // Guard this branch so missing or invalid state does not flow into the main path.
        if (!text) {
          // Return null when this helper cannot produce a usable value.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!state.canvasMeta || !moves.length) {
            // Return the resolved value to the caller after all guards and transformations.
            return state;
          }

          const nextImagesById = { ...state.imagesById };
          const nextTextsById = { ...state.textsById };
          let changed = false;

          for (const move of moves) {
            // Keep this conditional branch explicit because it changes the user-visible editor behavior.
            if (move.ref.kind === "image") {
              const image = nextImagesById[move.ref.id];
              // Guard this branch so missing or invalid state does not flow into the main path.
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
            // Guard this branch so missing or invalid state does not flow into the main path.
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
            // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!image) {
            // Return the resolved value to the caller after all guards and transformations.
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
            // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!canvasMeta || !image || image.isMovementLocked) {
            // Return the resolved value to the caller after all guards and transformations.
            return state;
          }

          const nextPosition = getImagePositionForPreset({
            canvasMeta,
            image,
            preset,
          });

          if (image.x === nextPosition.x && image.y === nextPosition.y) {
            // Return the resolved value to the caller after all guards and transformations.
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
          // Keep this conditional branch explicit because it changes the user-visible editor behavior.
          if (ref.kind === "image") {
            const image = state.imagesById[ref.id];
            // Guard this branch so missing or invalid state does not flow into the main path.
            if (!image) {
              // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!text) {
            // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!canvasMeta || !text) {
            // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!state.canvasMeta || state.canvasMeta.layoutAxisMode === mode) {
            // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!canvasMeta) {
            // Return the resolved value to the caller after all guards and transformations.
            return state;
          }

          const index = canvasMeta.objectOrder.findIndex((item) =>
            isSameObjectRef(item, ref),
          );
          // Handle collection boundaries before continuing with the resolved values.
          if (index < 0 || index === canvasMeta.objectOrder.length - 1) {
            // Return the resolved value to the caller after all guards and transformations.
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
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!canvasMeta) {
            // Return the resolved value to the caller after all guards and transformations.
            return state;
          }

          const index = canvasMeta.objectOrder.findIndex((item) =>
            isSameObjectRef(item, ref),
          );
          // Handle collection boundaries before continuing with the resolved values.
          if (index <= 0) {
            // Return the resolved value to the caller after all guards and transformations.
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
          // Select this store or hook value close to where the component uses it.
          const selectedObjects = useEditorUiStore.getState().selectedObjects;
          // Keep this conditional branch explicit because it changes the user-visible editor behavior.
          if (
            !canvasMeta ||
            canvasMeta.layoutAxisMode === "none" ||
            selectedObjects.length !== 2
          ) {
            // Return the resolved value to the caller after all guards and transformations.
            return state;
          }

          const orderedSelected = canvasMeta.objectOrder.filter((ref) =>
            selectedObjects.some((selected) => isSameObjectRef(selected, ref)),
          );
          // Handle collection boundaries before continuing with the resolved values.
          if (orderedSelected.length !== 2) {
            // Return the resolved value to the caller after all guards and transformations.
            return state;
          }

          const [higherRef, lowerRef] = orderedSelected;
          const nextImagesById = { ...state.imagesById };
          const nextTextsById = { ...state.textsById };
          const normalizedDistance = Math.round(distance);

          for (const ref of [higherRef, lowerRef]) {
            // Keep this conditional branch explicit because it changes the user-visible editor behavior.
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
          // Select this store or hook value close to where the component uses it.
          const selectedObjects = useEditorUiStore.getState().selectedObjects;
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!canvasMeta || !selectedObjects.length) {
            // Return the resolved value to the caller after all guards and transformations.
            return state;
          }

          const selectedKeys = new Set(
            selectedObjects.map((ref) => `${ref.kind}:${ref.id}`),
          );
          const nextImagesById = { ...state.imagesById };
          const nextTextsById = { ...state.textsById };

          selectedObjects.forEach((ref) => {
            // Keep this conditional branch explicit because it changes the user-visible editor behavior.
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

/**
 * Selects the active canvas metadata from the store for rendering components.
 */
export const useCanvasShell = () => useCanvasStore((state) => state.canvasMeta);

/**
 * Selects one text object by id while preserving component-level subscription granularity.
 */
export const useCanvasText = (textId: string) =>
  useCanvasStore((state) => state.textsById[textId] ?? null);

/**
 * Selects renderable objects in z-order for canvas and overview consumers.
 */
export const useOrderedCanvasObjects = () => {
  // Select this store or hook value close to where the component uses it.
  const objectOrder = useCanvasStore(
    (state) => state.canvasMeta?.objectOrder ?? null,
  );
  // Select this store or hook value close to where the component uses it.
  const imagesById = useCanvasStore((state) => state.imagesById);
  // Select this store or hook value close to where the component uses it.
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

/**
 * Resolves the active preset from the current canvas size and preset id.
 */
export const useActiveCanvasPreset = () => {
  // Select this store or hook value close to where the component uses it.
  const canvasMeta = useCanvasShell();
  // Select this store or hook value close to where the component uses it.
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

/**
 * Resolves the active background preset for display and fallback behavior.
 */
export const useActiveCanvasBackground = () => {
  // Select this store or hook value close to where the component uses it.
  const canvasMeta = useCanvasShell();

  return findCanvasBackgroundById(canvasMeta?.backgroundPresetId);
};
