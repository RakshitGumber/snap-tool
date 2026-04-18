import { ensureGoogleFontLoaded } from "@/libs/googleFonts";
import type { BoardTextItem, CanvasFrame } from "@/types/canvas";

export type BoardImageExportFormat = "png" | "jpeg";

type ExportBoardImageOptions = {
  canvas: CanvasFrame;
  format: BoardImageExportFormat;
  resolveImageSrc: (assetId: string) => Promise<string>;
};

type ParsedColorStop = {
  color: string;
  offset: number;
};

const LINE_HEIGHT_RATIO = 1.2;

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const isPotentiallyRemote =
      !src.startsWith("blob:") &&
      !src.startsWith("data:") &&
      !src.startsWith("/") &&
      /^https?:/i.test(src);

    image.decoding = "async";
    image.referrerPolicy = "no-referrer";

    if (isPotentiallyRemote) {
      image.crossOrigin = "anonymous";
    }

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error(
          "One of the board images could not be loaded for export. Remote images may need CORS access.",
        ),
      );
    image.src = src;
  });

const parseGradientStop = (input: string, fallbackOffset: number): ParsedColorStop => {
  const match = input.trim().match(/^(.*?)(?:\s+(-?\d+(?:\.\d+)?)%)?$/);
  const color = match?.[1]?.trim() || input.trim();
  const rawOffset = match?.[2];

  return {
    color,
    offset: rawOffset ? Number(rawOffset) / 100 : fallbackOffset,
  };
};

const applyCanvasBackground = ({
  context,
  background,
  width,
  height,
}: {
  context: CanvasRenderingContext2D;
  background: string;
  width: number;
  height: number;
}) => {
  if (!background.startsWith("linear-gradient(")) {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    return;
  }

  const innerValue = background.slice("linear-gradient(".length, -1);
  const segments = innerValue.split(",").map((segment) => segment.trim());
  const angleSegment = segments.shift() ?? "180deg";
  const angle = Number.parseFloat(angleSegment.replace("deg", "")) || 180;
  const fallbackDenominator = Math.max((segments.length || 1) - 1, 1);
  const stops = segments.map((segment, index) =>
    parseGradientStop(segment, index / fallbackDenominator),
  );

  const radians = ((angle - 90) * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);
  const halfProjection = (Math.abs(dx) * width + Math.abs(dy) * height) / 2;
  const centerX = width / 2;
  const centerY = height / 2;
  const gradient = context.createLinearGradient(
    centerX - dx * halfProjection,
    centerY - dy * halfProjection,
    centerX + dx * halfProjection,
    centerY + dy * halfProjection,
  );

  stops.forEach((stop) => {
    gradient.addColorStop(Math.min(Math.max(stop.offset, 0), 1), stop.color);
  });

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
};

const wrapTextLines = ({
  context,
  text,
  maxWidth,
}: {
  context: CanvasRenderingContext2D;
  text: string;
  maxWidth: number;
}) => {
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trimEnd();
    if (!trimmedParagraph) {
      lines.push("");
      continue;
    }

    const words = trimmedParagraph.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const candidateLine = currentLine ? `${currentLine} ${word}` : word;
      if (context.measureText(candidateLine).width <= maxWidth || !currentLine) {
        currentLine = candidateLine;
        continue;
      }

      lines.push(currentLine);
      currentLine = word;
    }

    lines.push(currentLine);
  }

  return lines;
};

const waitForTextFonts = async (texts: BoardTextItem[]) => {
  if (typeof document === "undefined" || !("fonts" in document)) {
    return;
  }

  await Promise.all(
    texts.map(async (text) => {
      ensureGoogleFontLoaded(text.fontFamily);
      await document.fonts.load(
        `${text.fontWeight} ${text.fontSize}px "${text.fontFamily}"`,
        text.text,
      );
    }),
  );
};

const drawTextLayer = ({
  context,
  text,
}: {
  context: CanvasRenderingContext2D;
  text: BoardTextItem;
}) => {
  context.save();
  context.font = `${text.fontWeight} ${text.fontSize}px "${text.fontFamily}", sans-serif`;
  context.fillStyle = text.color;
  context.textAlign = text.align;
  context.textBaseline = "top";

  const lineHeight = text.fontSize * LINE_HEIGHT_RATIO;
  const lines = wrapTextLines({
    context,
    text: text.text,
    maxWidth: text.maxWidth,
  });
  const drawX =
    text.align === "left"
      ? text.x
      : text.align === "center"
        ? text.x + text.maxWidth / 2
        : text.x + text.maxWidth;

  lines.forEach((line, index) => {
    context.fillText(line, drawX, text.y + index * lineHeight);
  });

  context.restore();
};

const canvasToBlob = async (
  canvas: HTMLCanvasElement,
  format: BoardImageExportFormat,
) => {
  const mimeType = format === "png" ? "image/png" : "image/jpeg";
  const quality = format === "png" ? undefined : 0.92;

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });

  if (!blob) {
    throw new Error("Unable to create the exported image.");
  }

  return blob;
};

export const exportBoardImage = async ({
  canvas,
  format,
  resolveImageSrc,
}: ExportBoardImageOptions) => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;

  const context = exportCanvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to initialize the export canvas.");
  }

  applyCanvasBackground({
    context,
    background: canvas.background,
    width: canvas.width,
    height: canvas.height,
  });

  await waitForTextFonts(canvas.texts);

  const imageLayers = await Promise.all(
    canvas.images.map(async (image) => {
      const src = await resolveImageSrc(image.assetId);
      const element = await loadImageElement(src);

      return {
        image,
        element,
      };
    }),
  );

  imageLayers.forEach(({ image, element }) => {
    context.drawImage(element, image.x, image.y, image.width, image.height);
  });

  canvas.texts.forEach((text) => {
    drawTextLayer({
      context,
      text,
    });
  });

  return canvasToBlob(exportCanvas, format);
};
