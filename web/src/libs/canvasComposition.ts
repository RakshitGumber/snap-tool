import type { CanvasSize } from "@/config/canvasPresets";
import type { YouTubeLinkCardMetadata } from "@/libs/linkCards";

export type CanvasFontFamily = "Roboto" | "Inter Variable";
export type ImageShadowPreset = "none" | "soft" | "strong";
export type TextColorMode = "auto" | "black" | "white";

export type YouTubeCanvasComposition = {
  id: string;
  source: "youtube";
  metadata: YouTubeLinkCardMetadata;
  image: {
    src: string;
    aspectRatio: number;
    widthRatio: number;
    radius: number;
    shadow: ImageShadowPreset;
    visible: boolean;
  };
  text: {
    value: string;
    fontFamily: CanvasFontFamily;
    fontSize: number;
    visible: boolean;
    colorMode: TextColorMode;
    overlay: {
      enabled: boolean;
    };
  };
  layout: {
    spacing: number;
  };
};

export type CanvasComposition = YouTubeCanvasComposition;

export type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CompositionLayout = {
  groupBox: Box;
  imageBox: Box;
  titleBox: Box;
  channelBox: Box;
  imageWidthRatio: number;
};

export const DEFAULT_IMAGE_WIDTH_RATIO = 0.68;
export const DEFAULT_TEXT_FONT_FAMILY: CanvasFontFamily = "Roboto";
export const DEFAULT_TEXT_FONT_SIZE = 52;
export const DEFAULT_COMPOSITION_SPACING = 32;
export const DEFAULT_IMAGE_RADIUS = 0;
export const DEFAULT_IMAGE_SHADOW: ImageShadowPreset = "none";
export const MAX_COMPOSITION_OCCUPANCY_RATIO = 0.92;
export const MIN_IMAGE_WIDTH_RATIO = 0.12;
export const MAX_TEXT_LINES = 2;
export const MAX_CHANNEL_LINES = 1;
const DEFAULT_TEXT_LINE_HEIGHT = 1.2;
export const TITLE_TEXT_LINE_HEIGHT = 1.1;
export const CHANNEL_TEXT_LINE_HEIGHT = 1.1;
const AVERAGE_CHARACTER_WIDTH_RATIO = 0.56;

export const createYouTubeComposition = (
  metadata: YouTubeLinkCardMetadata,
): CanvasComposition => ({
  id: crypto.randomUUID(),
  source: "youtube",
  metadata,
  image: {
    src: metadata.thumbnailUrl,
    aspectRatio: 16 / 9,
    widthRatio: DEFAULT_IMAGE_WIDTH_RATIO,
    radius: DEFAULT_IMAGE_RADIUS,
    shadow: DEFAULT_IMAGE_SHADOW,
    visible: true,
  },
  text: {
    value: metadata.title,
    fontFamily: DEFAULT_TEXT_FONT_FAMILY,
    fontSize: DEFAULT_TEXT_FONT_SIZE,
    visible: true,
    colorMode: "auto",
    overlay: {
      enabled: false,
    },
  },
  layout: {
    spacing: DEFAULT_COMPOSITION_SPACING,
  },
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isFinitePositiveNumber = (value: number) =>
  Number.isFinite(value) && value > 0;

const normalizeTextValue = (value: string) => value.replace(/\s+/g, " ").trim();

export const measureCompositionText = ({
  text,
  maxWidth,
  fontSize,
  maxLines = MAX_TEXT_LINES,
  lineHeightMultiplier = DEFAULT_TEXT_LINE_HEIGHT,
}: {
  text: string;
  maxWidth: number;
  fontSize: number;
  maxLines?: number;
  lineHeightMultiplier?: number;
}) => {
  const normalizedText = normalizeTextValue(text);
  const lineHeight = fontSize * lineHeightMultiplier;

  if (!normalizedText || maxWidth <= 0 || fontSize <= 0) {
    return {
      lineCount: 1,
      height: lineHeight,
    };
  }

  const averageCharacterWidth = fontSize * AVERAGE_CHARACTER_WIDTH_RATIO;
  const charactersPerLine = Math.max(
    1,
    Math.floor(maxWidth / averageCharacterWidth),
  );
  const words = normalizedText.split(" ");
  let lineCount = 1;
  let currentLineLength = 0;

  for (const word of words) {
    const nextLength = currentLineLength
      ? currentLineLength + 1 + word.length
      : word.length;

    if (nextLength <= charactersPerLine) {
      currentLineLength = nextLength;
      continue;
    }

    lineCount += 1;
    currentLineLength = word.length;
  }

  return {
    lineCount: Math.min(maxLines, lineCount),
    height: Math.min(maxLines, lineCount) * lineHeight,
  };
};

const getGroupHeightForImageWidth = (
  composition: CanvasComposition,
  imageWidth: number,
) => {
  const imageHeight = composition.image.visible
    ? imageWidth / composition.image.aspectRatio
    : 0;
  const titleHeight = composition.text.visible
    ? measureCompositionText({
        text: composition.text.value,
        maxWidth: imageWidth,
        fontSize: composition.text.fontSize,
        maxLines: MAX_TEXT_LINES,
        lineHeightMultiplier: TITLE_TEXT_LINE_HEIGHT,
      }).height
    : 0;
  const channelHeight = composition.text.visible
    ? measureCompositionText({
        text: composition.metadata.subtitle,
        maxWidth: imageWidth,
        fontSize: Math.max(12, composition.text.fontSize * 0.48),
        maxLines: MAX_CHANNEL_LINES,
        lineHeightMultiplier: CHANNEL_TEXT_LINE_HEIGHT,
      }).height
    : 0;

  const hasImage = composition.image.visible && imageHeight > 0;
  const hasText = composition.text.visible && (titleHeight > 0 || channelHeight > 0);
  const spacing = hasImage && hasText ? composition.layout.spacing : 0;

  return imageHeight + spacing + titleHeight + (hasText ? channelHeight : 0);
};

export const getMaxCompositionImageWidthRatio = (
  composition: CanvasComposition,
  canvasSize: CanvasSize,
) => {
  if (
    !isFinitePositiveNumber(canvasSize.width) ||
    !isFinitePositiveNumber(canvasSize.height) ||
    !isFinitePositiveNumber(composition.image.aspectRatio)
  ) {
    return 0;
  }

  const maxImageWidth = canvasSize.width * MAX_COMPOSITION_OCCUPANCY_RATIO;
  const maxGroupHeight = canvasSize.height * MAX_COMPOSITION_OCCUPANCY_RATIO;
  let lowWidth = 0;
  let highWidth = maxImageWidth;

  for (let index = 0; index < 24; index += 1) {
    const midWidth = (lowWidth + highWidth) / 2;
    const groupHeight = getGroupHeightForImageWidth(composition, midWidth);

    if (groupHeight <= maxGroupHeight) {
      lowWidth = midWidth;
    } else {
      highWidth = midWidth;
    }
  }

  return lowWidth / canvasSize.width;
};

export const clampCompositionImageWidthRatio = (
  composition: CanvasComposition,
  canvasSize: CanvasSize,
  widthRatio: number,
) => {
  const maxRatio = getMaxCompositionImageWidthRatio(composition, canvasSize);
  const fallbackRatio = Number.isFinite(widthRatio)
    ? widthRatio
    : DEFAULT_IMAGE_WIDTH_RATIO;
  const minRatio = Math.min(MIN_IMAGE_WIDTH_RATIO, maxRatio);

  return clamp(fallbackRatio, minRatio, maxRatio);
};

export const normalizeComposition = (
  composition: CanvasComposition,
  canvasSize: CanvasSize,
): CanvasComposition => ({
  ...composition,
  image: {
    ...composition.image,
    widthRatio: clampCompositionImageWidthRatio(
      composition,
      canvasSize,
      composition.image.widthRatio,
    ),
    radius: Math.max(0, composition.image.radius),
    visible: composition.image.visible ?? true,
  },
  text: {
    ...composition.text,
    fontSize: clamp(composition.text.fontSize, 12, 96),
    value: composition.text.value || composition.metadata.title,
    visible: composition.text.visible ?? true,
    colorMode: composition.text.colorMode ?? "auto",
  },
  layout: {
    ...composition.layout,
    spacing: clamp(composition.layout.spacing, 0, 160),
  },
});

export const getCompositionLayout = (
  composition: CanvasComposition,
  canvasSize: CanvasSize,
): CompositionLayout => {
  const imageWidthRatio = clampCompositionImageWidthRatio(
    composition,
    canvasSize,
    composition.image.widthRatio,
  );
  const imageWidth = canvasSize.width * imageWidthRatio;
  const imageHeight = composition.image.visible
    ? imageWidth / composition.image.aspectRatio
    : 0;
  const titleHeight = composition.text.visible
    ? measureCompositionText({
        text: composition.text.value,
        maxWidth: imageWidth,
        fontSize: composition.text.fontSize,
        maxLines: MAX_TEXT_LINES,
        lineHeightMultiplier: TITLE_TEXT_LINE_HEIGHT,
      }).height
    : 0;
  const channelFontSize = Math.max(12, composition.text.fontSize * 0.48);
  const channelHeight = composition.text.visible
    ? measureCompositionText({
        text: composition.metadata.subtitle,
        maxWidth: imageWidth,
        fontSize: channelFontSize,
        maxLines: MAX_CHANNEL_LINES,
        lineHeightMultiplier: CHANNEL_TEXT_LINE_HEIGHT,
      }).height
    : 0;
  const groupWidth = imageWidth;
  const hasImage = composition.image.visible && imageHeight > 0;
  const hasText =
    composition.text.visible && (titleHeight > 0 || channelHeight > 0);
  const spacing = hasImage && hasText ? composition.layout.spacing : 0;
  const groupHeight = imageHeight + spacing + titleHeight + (hasText ? channelHeight : 0);
  const groupX = (canvasSize.width - groupWidth) / 2;
  const groupY = (canvasSize.height - groupHeight) / 2;

  const imageY = groupY;
  const titleY = hasImage ? groupY + imageHeight + spacing : groupY;
  const channelY = titleY + titleHeight;
  const textInsetX = Math.max(0, Math.round(composition.text.fontSize * 0.25));

  return {
    groupBox: {
      x: groupX,
      y: groupY,
      width: groupWidth,
      height: groupHeight,
    },
    imageBox: {
      x: groupX,
      y: imageY,
      width: imageWidth,
      height: imageHeight,
    },
    titleBox: {
      x: groupX + textInsetX,
      y: titleY,
      width: Math.max(0, imageWidth - textInsetX * 2),
      height: titleHeight,
    },
    channelBox: {
      x: groupX + textInsetX,
      y: channelY,
      width: Math.max(0, imageWidth - textInsetX * 2),
      height: channelHeight,
    },
    imageWidthRatio,
  };
};
