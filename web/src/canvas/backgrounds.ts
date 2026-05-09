// Review note: Background value factories, normalizers, display labels, and image layout calculations.
// The comments in this file are intentionally dense to support the requested review pass.

import type {
  CanvasBackgroundImageFit,
  CanvasBackgroundPreset,
  CanvasBackgroundValue,
  CanvasImageBackground,
} from "@/types/canvas";

/**
 * Handles the clamp behavior for this module.
 */
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Keeps image_background_defaults in one named constant so related calculations stay consistent.
 */
const IMAGE_BACKGROUND_DEFAULTS = {
  fit: "cover" as CanvasBackgroundImageFit,
  offsetX: 0,
  offsetY: 0,
};

/**
 * Handles the clone canvas background behavior for this module.
 */
export const cloneCanvasBackground = (
  background: CanvasBackgroundValue,
): CanvasBackgroundValue => {
  // Keep this conditional branch explicit because it changes the user-visible editor behavior.
  if (background.kind === "solid") {
    // Return the resolved value to the caller after all guards and transformations.
    return {
      kind: "solid",
      color: background.color,
    };
  }

  if (background.kind === "gradient") {
    // Return the resolved value to the caller after all guards and transformations.
    return {
      kind: "gradient",
      css: background.css,
    };
  }

  return {
    kind: "image",
    fit: background.fit,
    offsetX: background.offsetX,
    offsetY: background.offsetY,
    assetId: background.assetId ?? null,
    src: background.src ?? null,
    previewSrc: background.previewSrc ?? null,
    width: background.width ?? null,
    height: background.height ?? null,
  };
};

/**
 * Normalizes normalize canvas background preset value before the value is stored or rendered.
 */
export const normalizeCanvasBackgroundPresetValue = (
  background: CanvasBackgroundValue,
): CanvasBackgroundValue => {
  // Keep this conditional branch explicit because it changes the user-visible editor behavior.
  if (background.kind !== "image") {
    // Return the resolved value to the caller after all guards and transformations.
    return cloneCanvasBackground(background);
  }

  return {
    kind: "image",
    fit: background.fit ?? IMAGE_BACKGROUND_DEFAULTS.fit,
    offsetX: background.offsetX ?? IMAGE_BACKGROUND_DEFAULTS.offsetX,
    offsetY: background.offsetY ?? IMAGE_BACKGROUND_DEFAULTS.offsetY,
    assetId: background.assetId ?? null,
    src: background.src ?? null,
    previewSrc: background.previewSrc ?? background.src ?? null,
    width: background.width ?? null,
    height: background.height ?? null,
  };
};

/**
 * Builds create canvas background from preset from normalized inputs.
 */
export const createCanvasBackgroundFromPreset = (
  preset: CanvasBackgroundPreset,
): CanvasBackgroundValue =>
  normalizeCanvasBackgroundPresetValue(preset.value);

/**
 * Builds create canvas asset image background from normalized inputs.
 */
export const createCanvasAssetImageBackground = (
  assetId: string,
): CanvasImageBackground => ({
  kind: "image",
  fit: IMAGE_BACKGROUND_DEFAULTS.fit,
  offsetX: IMAGE_BACKGROUND_DEFAULTS.offsetX,
  offsetY: IMAGE_BACKGROUND_DEFAULTS.offsetY,
  assetId,
  src: null,
  previewSrc: null,
  width: null,
  height: null,
});

/**
 * Handles the infer canvas background from legacy value behavior for this module.
 */
export const inferCanvasBackgroundFromLegacyValue = (
  background: string,
): CanvasBackgroundValue => {
  const trimmed = background.trim();

  if (/^linear-gradient\(/i.test(trimmed)) {
    // Return the resolved value to the caller after all guards and transformations.
    return {
      kind: "gradient",
      css: trimmed,
    };
  }

  return {
    kind: "solid",
    color: trimmed || "#FFFFFF",
  };
};

/**
 * Normalizes normalize canvas background value before the value is stored or rendered.
 */
export const normalizeCanvasBackgroundValue = ({
  background,
  preset,
}: {
  background: CanvasBackgroundValue | string | null | undefined;
  preset?: CanvasBackgroundPreset | null;
}): CanvasBackgroundValue => {
  // Keep this conditional branch explicit because it changes the user-visible editor behavior.
  if (typeof background === "string") {
    // Keep this conditional branch explicit because it changes the user-visible editor behavior.
    if (preset) {
      // Return the resolved value to the caller after all guards and transformations.
      return createCanvasBackgroundFromPreset(preset);
    }

    return inferCanvasBackgroundFromLegacyValue(background);
  }

  if (!background) {
    // Return the resolved value to the caller after all guards and transformations.
    return preset
      ? createCanvasBackgroundFromPreset(preset)
      : inferCanvasBackgroundFromLegacyValue("#FFFFFF");
  }

  return normalizeCanvasBackgroundPresetValue(background);
};

/**
 * Resolves get canvas background css value from the available editor state.
 */
export const getCanvasBackgroundCssValue = (
  background: CanvasBackgroundValue | null | undefined,
) => {
  // Guard this branch so missing or invalid state does not flow into the main path.
  if (!background) {
    // Return the resolved value to the caller after all guards and transformations.
    return "#FFFFFF";
  }

  if (background.kind === "solid") {
    // Return the resolved value to the caller after all guards and transformations.
    return background.color;
  }

  if (background.kind === "gradient") {
    // Return the resolved value to the caller after all guards and transformations.
    return background.css;
  }

  return null;
};

/**
 * Answers the is canvas background image predicate used to choose the next branch.
 */
export const isCanvasBackgroundImage = (
  background: CanvasBackgroundValue | null | undefined,
): background is CanvasImageBackground => background?.kind === "image";

/**
 * Answers the is canvas background image movable predicate used to choose the next branch.
 */
export const isCanvasBackgroundImageMovable = (
  background: CanvasBackgroundValue | null | undefined,
) => background?.kind === "image" && background.fit !== "fill";

/**
 * Handles the cycle canvas background image fit behavior for this module.
 */
export const cycleCanvasBackgroundImageFit = (
  fit: CanvasBackgroundImageFit,
): CanvasBackgroundImageFit => {
  // Route each variant through its own case so unsupported shapes stay isolated.
  switch (fit) {
    case "contain":
      // Return the resolved value to the caller after all guards and transformations.
      return "cover";
    case "cover":
      // Return the resolved value to the caller after all guards and transformations.
      return "fill";
    case "fill":
    default:
      // Return the resolved value to the caller after all guards and transformations.
      return "contain";
  }
};

/**
 * Formats format canvas background kind for compact UI display.
 */
export const formatCanvasBackgroundKind = (
  background: CanvasBackgroundValue | null | undefined,
) => background?.kind ?? "custom";

/**
 * Resolves get canvas background image source from the available editor state.
 */
export const getCanvasBackgroundImageSource = (
  background: CanvasBackgroundValue | null | undefined,
) => {
  // Keep this conditional branch explicit because it changes the user-visible editor behavior.
  if (background?.kind !== "image") {
    // Return null when this helper cannot produce a usable value.
    return null;
  }

  return background.src ?? background.previewSrc ?? null;
};

/**
 * Captures the rendered image rectangle after fit and offset math is applied.
 */
export type CanvasBackgroundImageLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

/**
 * Resolves get canvas background image layout from the available editor state.
 */
export const getCanvasBackgroundImageLayout = ({
  canvasWidth,
  canvasHeight,
  imageWidth,
  imageHeight,
  fit,
  offsetX,
  offsetY,
}: {
  canvasWidth: number;
  canvasHeight: number;
  imageWidth: number;
  imageHeight: number;
  fit: CanvasBackgroundImageFit;
  offsetX: number;
  offsetY: number;
}): CanvasBackgroundImageLayout => {
  const safeCanvasWidth = Math.max(canvasWidth, 1);
  const safeCanvasHeight = Math.max(canvasHeight, 1);
  const safeImageWidth = Math.max(imageWidth, 1);
  const safeImageHeight = Math.max(imageHeight, 1);

  let width = safeCanvasWidth;
  let height = safeCanvasHeight;

  if (fit !== "fill") {
    const scale =
      fit === "cover"
        ? Math.max(
            safeCanvasWidth / safeImageWidth,
            safeCanvasHeight / safeImageHeight,
          )
        : Math.min(
            safeCanvasWidth / safeImageWidth,
            safeCanvasHeight / safeImageHeight,
          );

    width = Math.max(1, safeImageWidth * scale);
    height = Math.max(1, safeImageHeight * scale);
  }

  const centerX = (safeCanvasWidth - width) / 2;
  const centerY = (safeCanvasHeight - height) / 2;

  let minX = centerX;
  let maxX = centerX;
  let minY = centerY;
  let maxY = centerY;

  if (fit === "contain") {
    minX = 0;
    maxX = Math.max(safeCanvasWidth - width, 0);
    minY = 0;
    maxY = Math.max(safeCanvasHeight - height, 0);
  } else if (fit === "cover") {
    minX = Math.min(safeCanvasWidth - width, 0);
    maxX = 0;
    minY = Math.min(safeCanvasHeight - height, 0);
    maxY = 0;
  }

  const x = clamp(centerX + offsetX, minX, maxX);
  const y = clamp(centerY + offsetY, minY, maxY);

  return {
    x,
    y,
    width,
    height,
    offsetX: x - centerX,
    offsetY: y - centerY,
    minX,
    maxX,
    minY,
    maxY,
  };
};
