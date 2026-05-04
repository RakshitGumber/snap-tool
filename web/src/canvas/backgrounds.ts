import type {
  CanvasBackgroundImageFit,
  CanvasBackgroundPreset,
  CanvasBackgroundValue,
  CanvasImageBackground,
} from "@/types/canvas";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const IMAGE_BACKGROUND_DEFAULTS = {
  fit: "cover" as CanvasBackgroundImageFit,
  offsetX: 0,
  offsetY: 0,
};

export const cloneCanvasBackground = (
  background: CanvasBackgroundValue,
): CanvasBackgroundValue => {
  if (background.kind === "solid") {
    return {
      kind: "solid",
      color: background.color,
    };
  }

  if (background.kind === "gradient") {
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

export const normalizeCanvasBackgroundPresetValue = (
  background: CanvasBackgroundValue,
): CanvasBackgroundValue => {
  if (background.kind !== "image") {
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

export const createCanvasBackgroundFromPreset = (
  preset: CanvasBackgroundPreset,
): CanvasBackgroundValue =>
  normalizeCanvasBackgroundPresetValue(preset.value);

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

export const inferCanvasBackgroundFromLegacyValue = (
  background: string,
): CanvasBackgroundValue => {
  const trimmed = background.trim();

  if (/^linear-gradient\(/i.test(trimmed)) {
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

export const normalizeCanvasBackgroundValue = ({
  background,
  preset,
}: {
  background: CanvasBackgroundValue | string | null | undefined;
  preset?: CanvasBackgroundPreset | null;
}): CanvasBackgroundValue => {
  if (typeof background === "string") {
    if (preset) {
      return createCanvasBackgroundFromPreset(preset);
    }

    return inferCanvasBackgroundFromLegacyValue(background);
  }

  if (!background) {
    return preset
      ? createCanvasBackgroundFromPreset(preset)
      : inferCanvasBackgroundFromLegacyValue("#FFFFFF");
  }

  return normalizeCanvasBackgroundPresetValue(background);
};

export const getCanvasBackgroundCssValue = (
  background: CanvasBackgroundValue | null | undefined,
) => {
  if (!background) {
    return "#FFFFFF";
  }

  if (background.kind === "solid") {
    return background.color;
  }

  if (background.kind === "gradient") {
    return background.css;
  }

  return null;
};

export const isCanvasBackgroundImage = (
  background: CanvasBackgroundValue | null | undefined,
): background is CanvasImageBackground => background?.kind === "image";

export const isCanvasBackgroundImageMovable = (
  background: CanvasBackgroundValue | null | undefined,
) => background?.kind === "image" && background.fit !== "fill";

export const cycleCanvasBackgroundImageFit = (
  fit: CanvasBackgroundImageFit,
): CanvasBackgroundImageFit => {
  switch (fit) {
    case "contain":
      return "cover";
    case "cover":
      return "fill";
    case "fill":
    default:
      return "contain";
  }
};

export const formatCanvasBackgroundKind = (
  background: CanvasBackgroundValue | null | undefined,
) => background?.kind ?? "custom";

export const getCanvasBackgroundImageSource = (
  background: CanvasBackgroundValue | null | undefined,
) => {
  if (background?.kind !== "image") {
    return null;
  }

  return background.src ?? background.previewSrc ?? null;
};

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
