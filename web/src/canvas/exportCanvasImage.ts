import { ensureGoogleFontLoaded } from "@/libs/googleFonts";
import { normalizeBoardTextFamily } from "@/stores/useConfigStore";
import { useCanvasStore } from "@/stores/useCanvasStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import type { BoardImageItem, BoardTextItem } from "@/types/canvas";

export type CanvasExportFormat = "png" | "jpg";

const IMAGE_CORNER_RADIUS = 8;
const TEXT_PADDING_X = 8;
const TEXT_PADDING_Y = 4;

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
  background: string,
) => {
  const gradient = parseLinearGradient(background);
  if (!gradient) {
    context.fillStyle = background;
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
) => {
  const element = await loadImage(src);

  context.save();
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
) => {
  const fontFamily = normalizeBoardTextFamily(text.fontFamily) || "sans-serif";
  const availableWidth = Math.max(text.maxWidth - TEXT_PADDING_X * 2, 1);

  context.save();
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

export const exportCanvasImage = async (format: CanvasExportFormat) => {
  const canvasFrame = useCanvasStore.getState().serializeCanvas();
  if (!canvasFrame) {
    throw new Error("There is no canvas to save yet.");
  }

  const { resolveAssetMedia } = useUploadLibraryStore.getState();
  const imageSources = new Map<string, string>();

  for (const image of canvasFrame.images) {
    const media = await resolveAssetMedia(image.assetId, "full");
    if (!media?.src) {
      throw new Error("One of the board images is not ready to save yet.");
    }

    imageSources.set(image.id, media.src);
  }

  await waitForFonts(canvasFrame.texts);

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvasFrame.width;
  exportCanvas.height = canvasFrame.height;

  const context = exportCanvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create an export canvas.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  fillCanvasBackground(
    context,
    canvasFrame.width,
    canvasFrame.height,
    canvasFrame.background,
  );

  for (const image of canvasFrame.images) {
    const src = imageSources.get(image.id);
    if (!src) {
      continue;
    }

    await drawImageItem(context, image, src);
  }

  for (const text of canvasFrame.texts) {
    drawTextItem(context, text);
  }

  let blob: Blob | null = null;
  try {
    blob = await new Promise<Blob | null>((resolve) => {
      exportCanvas.toBlob(
        resolve,
        MIME_TYPE_BY_FORMAT[format],
        format === "jpg" ? 0.92 : undefined,
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

  downloadBlob(blob, buildFilename(canvasFrame.title, format));
};
