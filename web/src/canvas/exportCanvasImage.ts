import { ensureGoogleFontLoaded } from "@/libs/googleFonts";
import {
  getCanvasBackgroundCssValue,
  getCanvasBackgroundImageLayout,
} from "@/canvas/backgrounds";
import { normalizeBoardTextFamily } from "@/stores/useConfigStore";
import { useCanvasStore } from "@/stores/useCanvasStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import type {
  BoardImageItem,
  BoardTextItem,
  CanvasFrame,
  CanvasBackgroundValue,
} from "@/types/canvas";
import {
  buildCanvasBackgroundFilter,
  getCanvasBackgroundBlurPadding,
  getCanvasBackgroundOpacity,
  normalizeCanvasBackgroundEffects,
} from "@/canvas/backgroundEffects";

export type CanvasExportFormat = "png" | "jpg";
export type CanvasExportOptions = {
  format: CanvasExportFormat;
  filenameBase?: string;
  width?: number;
  height?: number;
  quality?: number;
};

export type CanvasExportResult = {
  blob: Blob;
  file: File;
  filename: string;
  format: CanvasExportFormat;
  width: number;
  height: number;
};

const IMAGE_CORNER_RADIUS = 8;
const TEXT_PADDING_X = 8;
const TEXT_PADDING_Y = 4;
const MIN_EXPORT_EDGE = 64;
const MAX_EXPORT_EDGE = 4096;
const DEFAULT_JPEG_QUALITY = 92;

const MIME_TYPE_BY_FORMAT: Record<CanvasExportFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
};

const FILE_EXTENSION_BY_FORMAT: Record<CanvasExportFormat, string> = {
  png: "png",
  jpg: "jpg",
};

const splitTopLevel = (value: string) => {
  const parts: string[] = [];
  let current = "";
  let depth = 0;

  for (const character of value) {
    if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth = Math.max(depth - 1, 0);
    }

    if (character === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
};

const parseLinearGradient = (value: string) => {
  const match = value.match(/^linear-gradient\((.*)\)$/i);
  if (!match) {
    return null;
  }

  const parts = splitTopLevel(match[1]);
  if (parts.length < 2) {
    return null;
  }

  let angle = 180;
  let stopParts = parts;

  if (/^-?\d+(\.\d+)?deg$/i.test(parts[0])) {
    angle = Number.parseFloat(parts[0]);
    stopParts = parts.slice(1);
  }

  const positions = stopParts.map((part) => {
    const stopMatch = part.match(/^(.*?)(?:\s+(-?\d+(?:\.\d+)?)%)?$/);
    if (!stopMatch) {
      return { color: part, position: null as number | null };
    }

    return {
      color: stopMatch[1].trim(),
      position:
        stopMatch[2] !== undefined
          ? Number.parseFloat(stopMatch[2]) / 100
          : null,
    };
  });

  if (positions[0]?.position === null) {
    positions[0].position = 0;
  }

  if (positions[positions.length - 1]?.position === null) {
    positions[positions.length - 1].position = 1;
  }

  let knownIndex = 0;
  while (knownIndex < positions.length) {
    if (positions[knownIndex].position === null) {
      knownIndex += 1;
      continue;
    }

    let nextKnownIndex = knownIndex + 1;
    while (
      nextKnownIndex < positions.length &&
      positions[nextKnownIndex].position === null
    ) {
      nextKnownIndex += 1;
    }

    if (nextKnownIndex >= positions.length) {
      break;
    }

    const start = positions[knownIndex].position ?? 0;
    const end = positions[nextKnownIndex].position ?? start;
    const gap = nextKnownIndex - knownIndex;

    for (let index = knownIndex + 1; index < nextKnownIndex; index += 1) {
      const progress = (index - knownIndex) / gap;
      positions[index].position = start + (end - start) * progress;
    }

    knownIndex = nextKnownIndex;
  }

  return {
    angle,
    stops: positions.map((stop, index, array) => ({
      color: stop.color,
      position:
        stop.position ?? (array.length === 1 ? 0 : index / (array.length - 1)),
    })),
  };
};

const fillCanvasBackground = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: CanvasBackgroundValue,
) => {
  const backgroundCss = getCanvasBackgroundCssValue(background);
  if (!backgroundCss) {
    return;
  }

  const gradient = parseLinearGradient(backgroundCss);
  if (!gradient) {
    context.fillStyle = backgroundCss;
    context.fillRect(0, 0, width, height);
    return;
  }

  const radians = (gradient.angle * Math.PI) / 180;
  const directionX = Math.sin(radians);
  const directionY = -Math.cos(radians);
  const centerX = width / 2;
  const centerY = height / 2;
  const scale =
    Math.abs((width / 2) * directionX) + Math.abs((height / 2) * directionY);
  const canvasGradient = context.createLinearGradient(
    centerX - directionX * scale,
    centerY - directionY * scale,
    centerX + directionX * scale,
    centerY + directionY * scale,
  );

  for (const stop of gradient.stops) {
    canvasGradient.addColorStop(
      Math.min(Math.max(stop.position, 0), 1),
      stop.color,
    );
  }

  context.fillStyle = canvasGradient;
  context.fillRect(0, 0, width, height);
};

const drawCanvasBackgroundImage = async ({
  context,
  width,
  height,
  background,
  src,
  imageWidth,
  imageHeight,
  blurPadding,
}: {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  background: Extract<CanvasBackgroundValue, { kind: "image" }>;
  src: string;
  imageWidth: number;
  imageHeight: number;
  blurPadding: number;
}) => {
  const element = await loadImage(src);
  const layout = getCanvasBackgroundImageLayout({
    canvasWidth: width,
    canvasHeight: height,
    imageWidth,
    imageHeight,
    fit: background.fit,
    offsetX: background.offsetX,
    offsetY: background.offsetY,
  });

  context.drawImage(
    element,
    layout.x + blurPadding,
    layout.y + blurPadding,
    layout.width,
    layout.height,
  );
};

const drawCanvasBackgroundWithEffects = async (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: CanvasBackgroundValue,
  effects: ReturnType<typeof normalizeCanvasBackgroundEffects>,
  imageBackgroundSource?: {
    src: string;
    width: number;
    height: number;
  } | null,
) => {
  context.save();
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.restore();

  const blurPadding = getCanvasBackgroundBlurPadding(effects);
  const backgroundCanvas = document.createElement("canvas");
  backgroundCanvas.width = width + blurPadding * 2;
  backgroundCanvas.height = height + blurPadding * 2;

  const backgroundContext = backgroundCanvas.getContext("2d");
  if (!backgroundContext) {
    fillCanvasBackground(context, width, height, background);
    return;
  }

  backgroundContext.imageSmoothingEnabled = true;
  backgroundContext.imageSmoothingQuality = "high";
  backgroundContext.save();
  backgroundContext.filter = buildCanvasBackgroundFilter(effects);
  backgroundContext.globalAlpha = getCanvasBackgroundOpacity(effects);
  if (background.kind === "image" && imageBackgroundSource) {
    await drawCanvasBackgroundImage({
      context: backgroundContext,
      width,
      height,
      background,
      src: imageBackgroundSource.src,
      imageWidth: imageBackgroundSource.width,
      imageHeight: imageBackgroundSource.height,
      blurPadding,
    });
  } else {
    fillCanvasBackground(
      backgroundContext,
      backgroundCanvas.width,
      backgroundCanvas.height,
      background,
    );
  }
  backgroundContext.restore();

  context.drawImage(backgroundCanvas, -blurPadding, -blurPadding);
};

const buildRoundedRectPath = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const clampedRadius = Math.max(0, Math.min(radius, width / 2, height / 2));

  context.beginPath();
  context.moveTo(x + clampedRadius, y);
  context.lineTo(x + width - clampedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + clampedRadius);
  context.lineTo(x + width, y + height - clampedRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - clampedRadius, y + height);
  context.lineTo(x + clampedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - clampedRadius);
  context.lineTo(x, y + clampedRadius);
  context.quadraticCurveTo(x, y, x + clampedRadius, y);
  context.closePath();
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    if (!src.startsWith("blob:") && !src.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("One of the board images could not be loaded for export."));
    image.src = src;
  });

const drawImageItem = async (
  context: CanvasRenderingContext2D,
  image: BoardImageItem,
  src: string,
  scaleX = 1,
  scaleY = 1,
) => {
  const element = await loadImage(src);

  context.save();
  context.scale(scaleX, scaleY);
  buildRoundedRectPath(
    context,
    image.x,
    image.y,
    image.width,
    image.height,
    IMAGE_CORNER_RADIUS,
  );
  context.clip();
  context.drawImage(element, image.x, image.y, image.width, image.height);
  context.restore();
};

const breakTokenToFit = (
  context: CanvasRenderingContext2D,
  token: string,
  maxWidth: number,
) => {
  const chunks: string[] = [];
  let current = "";

  for (const character of token) {
    const next = `${current}${character}`;
    if (!current || context.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }

    chunks.push(current);
    current = character;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
};

const wrapParagraph = (
  context: CanvasRenderingContext2D,
  paragraph: string,
  maxWidth: number,
) => {
  if (!paragraph) {
    return [""];
  }

  const tokens = paragraph.split(/(\s+)/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const token of tokens) {
    const candidate = `${currentLine}${token}`;
    if (!currentLine || context.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (token.trim() && context.measureText(token).width > maxWidth) {
      if (currentLine.trim()) {
        lines.push(currentLine.trimEnd());
        currentLine = "";
      }

      const chunks = breakTokenToFit(context, token, maxWidth);
      const lastChunk = chunks.pop();
      lines.push(...chunks);
      currentLine = lastChunk ?? "";
      continue;
    }

    lines.push(currentLine.trimEnd());
    currentLine = token.trimStart();
  }

  lines.push(currentLine.trimEnd());
  return lines;
};

const wrapTextLines = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) => text.split("\n").flatMap((paragraph) => wrapParagraph(context, paragraph, maxWidth));

const drawTextItem = (
  context: CanvasRenderingContext2D,
  text: BoardTextItem,
  scaleX = 1,
  scaleY = 1,
) => {
  const fontFamily = normalizeBoardTextFamily(text.fontFamily) || "sans-serif";
  const availableWidth = Math.max(text.maxWidth - TEXT_PADDING_X * 2, 1);

  context.save();
  context.scale(scaleX, scaleY);
  context.fillStyle = text.color;
  context.font = `${text.fontWeight} ${text.fontSize}px "${fontFamily}", sans-serif`;
  context.textBaseline = "alphabetic";
  const lineHeight = text.fontSize * 1.4;
  const lines = wrapTextLines(context, text.text, availableWidth);

  lines.forEach((line, index) => {
    const measuredWidth = context.measureText(line).width;
    let lineX = text.x + TEXT_PADDING_X;

    if (text.align === "center") {
      lineX += Math.max((availableWidth - measuredWidth) / 2, 0);
    } else if (text.align === "right") {
      lineX += Math.max(availableWidth - measuredWidth, 0);
    }

    const lineY =
      text.y + TEXT_PADDING_Y + text.fontSize + index * lineHeight;
    context.fillText(line, lineX, lineY, availableWidth);
  });

  context.restore();
};

const waitForFonts = async (texts: BoardTextItem[]) => {
  if (typeof document === "undefined" || !("fonts" in document)) {
    return;
  }

  await Promise.all(
    texts.map(async (text) => {
      const family = normalizeBoardTextFamily(text.fontFamily);
      if (!family) {
        return;
      }

      ensureGoogleFontLoaded(family);

      try {
        await document.fonts.load(
          `${text.fontWeight} ${text.fontSize}px "${family}"`,
          text.text || " ",
        );
      } catch {
        // Fallback fonts are acceptable when the requested font is unavailable.
      }
    }),
  );

  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => window.setTimeout(resolve, 1200)),
    ]);
  } catch {
    // Export can continue with whatever fonts are already available.
  }
};

const buildFilename = (title: string, format: CanvasExportFormat) => {
  const safeTitle =
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "canvas";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return `${safeTitle}-${timestamp}.${FILE_EXTENSION_BY_FORMAT[format]}`;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
};

const clampExportDimension = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(
    MAX_EXPORT_EDGE,
    Math.max(MIN_EXPORT_EDGE, Math.round(value)),
  );
};

const normalizeExportQuality = (quality?: number) =>
  Math.min(1, Math.max(0.1, Math.round(quality ?? DEFAULT_JPEG_QUALITY) / 100));

const resolveCanvasExportAssets = async (canvasFrame: CanvasFrame) => {
  const { assetMetaById, resolveAssetMedia } = useUploadLibraryStore.getState();
  const imageSources = new Map<string, string>();
  let backgroundImageSource:
    | {
        src: string;
        width: number;
        height: number;
      }
    | null = null;

  for (const image of canvasFrame.images) {
    const media = await resolveAssetMedia(image.assetId, "full");
    if (!media?.src) {
      throw new Error("One of the board images is not ready to save yet.");
    }

    imageSources.set(image.id, media.src);
  }

  if (canvasFrame.background.kind === "image") {
    if (canvasFrame.background.assetId) {
      const asset = assetMetaById[canvasFrame.background.assetId];
      const media = await resolveAssetMedia(
        canvasFrame.background.assetId,
        "full",
      );

      if (!asset || !media?.src) {
        throw new Error("The background image is not ready to save yet.");
      }

      backgroundImageSource = {
        src: media.src,
        width: asset.width,
        height: asset.height,
      };
    } else if (
      canvasFrame.background.src &&
      canvasFrame.background.width &&
      canvasFrame.background.height
    ) {
      backgroundImageSource = {
        src: canvasFrame.background.src,
        width: canvasFrame.background.width,
        height: canvasFrame.background.height,
      };
    } else {
      throw new Error("The background image is not ready to save yet.");
    }
  }

  return {
    canvasFrame,
    imageSources,
    backgroundImageSource,
  };
};

const renderCanvasExport = async ({
  canvasFrame,
  imageSources,
  backgroundImageSource,
  outputWidth,
  outputHeight,
}: {
  canvasFrame: CanvasFrame;
  imageSources: Map<string, string>;
  backgroundImageSource:
    | {
        src: string;
        width: number;
        height: number;
      }
    | null;
  outputWidth: number;
  outputHeight: number;
}) => {
  await waitForFonts(canvasFrame.texts);

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = outputWidth;
  exportCanvas.height = outputHeight;

  const context = exportCanvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create an export canvas.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const scaleX = outputWidth / canvasFrame.width;
  const scaleY = outputHeight / canvasFrame.height;
  const background =
    canvasFrame.background.kind === "image"
      ? {
          ...canvasFrame.background,
          offsetX: Math.round(canvasFrame.background.offsetX * scaleX),
          offsetY: Math.round(canvasFrame.background.offsetY * scaleY),
        }
      : canvasFrame.background;

  await drawCanvasBackgroundWithEffects(
    context,
    outputWidth,
    outputHeight,
    background,
    normalizeCanvasBackgroundEffects(canvasFrame.backgroundEffects),
    backgroundImageSource,
  );

  for (const image of canvasFrame.images) {
    const src = imageSources.get(image.id);
    if (!src) {
      continue;
    }

    await drawImageItem(context, image, src, scaleX, scaleY);
  }

  for (const text of canvasFrame.texts) {
    drawTextItem(context, text, scaleX, scaleY);
  }

  return exportCanvas;
};

const encodeExportCanvas = async ({
  canvas,
  format,
  quality,
}: {
  canvas: HTMLCanvasElement;
  format: CanvasExportFormat;
  quality?: number;
}) => {
  let blob: Blob | null = null;

  try {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        resolve,
        MIME_TYPE_BY_FORMAT[format],
        format === "jpg" ? normalizeExportQuality(quality) : undefined,
      );
    });
  } catch {
    throw new Error(
      "Saving failed. Remote images without CORS access cannot be exported from the browser.",
    );
  }

  if (!blob) {
    throw new Error("Saving failed while encoding the image.");
  }

  return blob;
};

export const createCanvasExport = async ({
  format,
  filenameBase,
  width,
  height,
  quality,
}: CanvasExportOptions): Promise<CanvasExportResult> => {
  const resolvedCanvasFrame = useCanvasStore.getState().serializeCanvas();
  if (!resolvedCanvasFrame) {
    throw new Error("There is no canvas to save yet.");
  }

  const outputWidth = clampExportDimension(width ?? resolvedCanvasFrame.width, resolvedCanvasFrame.width);
  const outputHeight = clampExportDimension(
    height ?? resolvedCanvasFrame.height,
    resolvedCanvasFrame.height,
  );
  const { imageSources, backgroundImageSource } =
    await resolveCanvasExportAssets(resolvedCanvasFrame);
  const canvas = await renderCanvasExport({
    canvasFrame: resolvedCanvasFrame,
    imageSources,
    backgroundImageSource,
    outputWidth,
    outputHeight,
  });
  const blob = await encodeExportCanvas({
    canvas,
    format,
    quality,
  });
  const filename = buildFilename(filenameBase ?? resolvedCanvasFrame.title, format);
  const file = new File([blob], filename, {
    type: MIME_TYPE_BY_FORMAT[format],
  });

  return {
    blob,
    file,
    filename,
    format,
    width: outputWidth,
    height: outputHeight,
  };
};

export const downloadCanvasExport = ({
  blob,
  filename,
}: Pick<CanvasExportResult, "blob" | "filename">) => {
  downloadBlob(blob, filename);
};

export const exportCanvasImage = async (format: CanvasExportFormat) => {
  const exportResult = await createCanvasExport({ format });
  downloadCanvasExport(exportResult);
};
