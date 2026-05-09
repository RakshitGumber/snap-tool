// Review note: Canonical canvas data model shared by stores, renderers, panels, and export utilities.
// The comments in this file are intentionally dense to support the requested review pass.

/**
 * Stores width and height in pixels for every preset and canvas frame.
 */
export type CanvasSize = {
  width: number;
  height: number;
};

/**
 * Limits preset grouping to the supported social and device categories.
 */
export type CanvasPresetGroupId =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "pinterest"
  | "general";

/**
 * Encodes a preset id with its group prefix for easier lookup and migration.
 */
export type CanvasPresetId = `${CanvasPresetGroupId}-${string}`;

/**
 * Defines one selectable canvas size preset.
 */
export type CanvasPreset = {
  id: CanvasPresetId;
  groupId: CanvasPresetGroupId;
  label: string;
  size: CanvasSize;
};

/**
 * Groups related presets for display in preset controls.
 */
export type CanvasPresetGroup = {
  id: CanvasPresetGroupId;
  label: string;
  presets: CanvasPreset[];
};

/**
 * Represents a preset after width and height have been resolved from size data.
 */
export type ResolvedCanvasPreset =
  | {
      kind: "preset";
      preset: CanvasPreset;
      group: CanvasPresetGroup;
    }
  | {
      kind: "custom";
      size: CanvasSize;
    };

/**
 * Lists every background variant supported by storage, rendering, and export.
 */
export type CanvasBackgroundKind = "solid" | "gradient" | "image";

/**
 * Lists the image-fit modes supported for asset backgrounds.
 */
export type CanvasBackgroundImageFit = "contain" | "cover" | "fill";

/**
 * Stores a plain color background.
 */
export type CanvasSolidBackground = {
  kind: "solid";
  color: string;
};

/**
 * Stores a CSS gradient background.
 */
export type CanvasGradientBackground = {
  kind: "gradient";
  css: string;
};

/**
 * Stores an image-backed background with optional asset metadata and offsets.
 */
export type CanvasImageBackground = {
  kind: "image";
  fit: CanvasBackgroundImageFit;
  offsetX: number;
  offsetY: number;
  assetId?: string | null;
  src?: string | null;
  previewSrc?: string | null;
  width?: number | null;
  height?: number | null;
};

/**
 * Discriminated union for all supported background payloads.
 */
export type CanvasBackgroundValue =
  | CanvasSolidBackground
  | CanvasGradientBackground
  | CanvasImageBackground;

/**
 * Defines a selectable background preset shown in the background panel.
 */
export type CanvasBackgroundPreset = {
  id: string;
  label: string;
  value: CanvasBackgroundValue;
};

/**
 * Groups related background presets for panel display.
 */
export type CanvasBackgroundPresetGroup = {
  id: string;
  label: string;
  presets: CanvasBackgroundPreset[];
};

/**
 * Stores visual effect values that can be applied to any background.
 */
export type CanvasBackgroundEffects = {
  hue: number;
  saturation: number;
  blur: number;
  brightness: number;
  contrast: number;
  opacity: number;
};

/**
 * Limits text alignment values to the controls supported by the editor.
 */
export type BoardTextAlign = "left" | "center" | "right";
/**
 * Controls whether objects are free, vertically aligned, or horizontally aligned.
 */
export type CanvasLayoutAxisMode = "none" | "vertical" | "horizontal";
/**
 * Discriminates mixed image and text object references.
 */
export type BoardObjectKind = "image" | "text";
/**
 * Tracks whether an object is freely positioned or axis-bound.
 */
export type BoardObjectLayoutMode = "free" | "axis-bound";

/**
 * References a canvas object without copying its full payload.
 */
export type BoardObjectRef = {
  kind: BoardObjectKind;
  id: string;
};

/**
 * Stores geometry and interaction metadata shared by images and text.
 */
export type BoardObjectBase = {
  id: string;
  x: number;
  y: number;
  layoutMode: BoardObjectLayoutMode;
  layoutGap: number;
  isMovementLocked: boolean;
};

/**
 * Lists quick-placement commands for image objects.
 */
export type BoardImagePositionPreset =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right";

/**
 * Serializable snapshot of a full board at one point in history.
 */
export type CanvasFrame = {
  id: string;
  title: string;
  width: number;
  height: number;
  presetId?: CanvasPresetId | null;
  layoutAxisMode: CanvasLayoutAxisMode;
  background: CanvasBackgroundValue;
  backgroundPresetId: string | null;
  backgroundEffects: CanvasBackgroundEffects;
  objectOrder: BoardObjectRef[];
  images: BoardImageItem[];
  texts: BoardTextItem[];
};

/**
 * Stores geometry and source metadata for an image object on the canvas.
 */
export type BoardImageItem = BoardObjectBase & {
  assetId: string;
  width: number;
  height: number;
  alt: string;
};

/**
 * Stores geometry and typography for a text object on the canvas.
 */
export type BoardTextItem = BoardObjectBase & {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: BoardTextAlign;
  maxWidth: number;
};

/**
 * Represents editable text fields before they are merged into a full object.
 */
export type BoardTextInput = Omit<
  BoardTextItem,
  "id" | "x" | "y" | "layoutMode" | "layoutGap" | "isMovementLocked"
> &
  Partial<Pick<BoardTextItem, "x" | "y">>;

/**
 * Stores canvas metadata without the object maps held separately in active state.
 */
export type CanvasShell = Omit<
  CanvasFrame,
  "images" | "texts"
>;
