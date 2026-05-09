import { getBackgroundPresetById } from "@/config/backgroundPresets";
import { getCardShadowOption } from "@/config/cardShadows";
import {
  getLinkCardPresetById,
  type LinkCardBox,
  type LinkCardLayer,
  type LinkCardPreset,
  type LinkCardSlot,
  type LinkCardTextStyle,
} from "@/config/linkCardPresets";
import type { LinkCardMetadata } from "@/libs/linkCards";
import { useCanvasStore } from "@/new_stores/useCanvasStore";

type ExportResult = {
  blob: Blob;
  filename: string;
  url: string;
};

const splitCssList = (value: string) => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;

    if (character === "," && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  parts.push(value.slice(start).trim());
  return parts;
};

const createLinearGradient = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  value: string,
) => {
  const gradientMatch = value.match(/^linear-gradient\((.*)\)$/i);
  if (!gradientMatch) return null;

  const parts = splitCssList(gradientMatch[1]);
  const anglePart = parts[0]?.match(/^(-?\d+(?:\.\d+)?)deg$/i);
  const angle = anglePart ? Number(anglePart[1]) : 180;
  const stops = anglePart ? parts.slice(1) : parts;
  const radians = ((angle - 90) * Math.PI) / 180;
  const half = Math.sqrt(width * width + height * height) / 2;
  const centerX = width / 2;
  const centerY = height / 2;
  const gradient = context.createLinearGradient(
    centerX - Math.cos(radians) * half,
    centerY - Math.sin(radians) * half,
    centerX + Math.cos(radians) * half,
    centerY + Math.sin(radians) * half,
  );

  stops.forEach((stop, index) => {
    const stopMatch = stop.match(/^(.*?)(?:\s+(\d+(?:\.\d+)?)%)?$/);
    const color = stopMatch?.[1]?.trim() || stop;
    const offset =
      stopMatch?.[2] !== undefined
        ? Number(stopMatch[2]) / 100
        : stops.length <= 1
          ? 0
          : index / (stops.length - 1);

    gradient.addColorStop(Math.min(1, Math.max(0, offset)), color);
  });

  return gradient;
};

const fillBackground = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: string,
) => {
  const gradient = createLinearGradient(context, width, height, background);
  context.fillStyle = gradient ?? background;
  context.fillRect(0, 0, width, height);
};

const roundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const resolvedRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + resolvedRadius, y);
  context.lineTo(x + width - resolvedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + resolvedRadius);
  context.lineTo(x + width, y + height - resolvedRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - resolvedRadius,
    y + height,
  );
  context.lineTo(x + resolvedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - resolvedRadius);
  context.lineTo(x, y + resolvedRadius);
  context.quadraticCurveTo(x, y, x + resolvedRadius, y);
  context.closePath();
};

const resolveBox = (
  box: LinkCardBox,
  width: number,
  height: number,
) => ({
  x: box.x * width,
  y: box.y * height,
  width: box.width * width,
  height: box.height * height,
});

const getRadius = (ratio: number | undefined, width: number) =>
  ratio === undefined ? 0 : width * ratio;

const getTextValue = (metadata: LinkCardMetadata, slot: LinkCardSlot) => {
  switch (slot) {
    case "title":
      return metadata.title;
    case "subtitle":
      return metadata.subtitle;
    case "description":
      return metadata.description;
    case "originalUrl":
      return metadata.originalUrl;
    case "hostname":
      return "hostname" in metadata ? metadata.hostname : "";
    case "startTimeLabel":
      return "startTimeLabel" in metadata ? (metadata.startTimeLabel ?? "") : "";
    default:
      return "";
  }
};

const getImageValue = (metadata: LinkCardMetadata, slot: LinkCardSlot) => {
  switch (slot) {
    case "thumbnailUrl":
      return "thumbnailUrl" in metadata ? metadata.thumbnailUrl : "";
    case "avatarUrl":
      return "avatarUrl" in metadata ? (metadata.avatarUrl ?? "") : "";
    case "openGraphUrl":
      return "openGraphUrl" in metadata ? metadata.openGraphUrl : "";
    case "faviconUrl":
      return "faviconUrl" in metadata ? metadata.faviconUrl : "";
    case "imageUrl":
      return "imageUrl" in metadata ? metadata.imageUrl : "";
    default:
      return "";
  }
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image for export."));
    image.src = src;
  });

const drawFittedImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  fit: "cover" | "contain" = "cover",
) => {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const scale =
    fit === "contain"
      ? Math.min(width / imageWidth, height / imageHeight)
      : Math.max(width / imageWidth, height / imageHeight);
  const renderedWidth = imageWidth * scale;
  const renderedHeight = imageHeight * scale;

  context.drawImage(
    image,
    x + (width - renderedWidth) / 2,
    y + (height - renderedHeight) / 2,
    renderedWidth,
    renderedHeight,
  );
};

const applyTextStyle = (
  context: CanvasRenderingContext2D,
  style: LinkCardTextStyle,
  width: number,
) => {
  const fontSize = width * style.fontSizeRatio;
  const fontWeight = style.fontWeight ?? 400;

  context.fillStyle = style.color;
  context.globalAlpha = style.opacity ?? 1;
  context.font = `${fontWeight} ${fontSize}px "Inter Variable", Inter, Arial, sans-serif`;
  context.textAlign = style.align ?? "left";
  context.textBaseline = "top";

  return {
    fontSize,
    lineHeight: fontSize * (style.lineHeight ?? 1.15),
  };
};

const drawText = (
  context: CanvasRenderingContext2D,
  value: string,
  box: ReturnType<typeof resolveBox>,
  style: LinkCardTextStyle,
  cardWidth: number,
) => {
  const { lineHeight } = applyTextStyle(context, style, cardWidth);
  const maxLines = style.lineClamp ?? 1;
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (context.measureText(candidate).width <= box.width || !currentLine) {
      currentLine = candidate;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) lines.push(currentLine);

  const renderedLines = lines.slice(0, maxLines);
  const align = style.align ?? "left";
  const x =
    align === "center"
      ? box.x + box.width / 2
      : align === "right"
        ? box.x + box.width
        : box.x;

  renderedLines.forEach((line, index) => {
    const isLastClampedLine = index === renderedLines.length - 1;
    const hasHiddenLines = lines.length > renderedLines.length;
    let renderedLine = line;

    if (isLastClampedLine && hasHiddenLines) {
      while (
        renderedLine.length > 1 &&
        context.measureText(`${renderedLine}...`).width > box.width
      ) {
        renderedLine = renderedLine.slice(0, -1);
      }

      renderedLine = `${renderedLine}...`;
    }

    context.fillText(renderedLine, x, box.y + index * lineHeight, box.width);
  });

  context.globalAlpha = 1;
};

const drawLayer = async ({
  context,
  layer,
  metadata,
  cardWidth,
  cardHeight,
}: {
  context: CanvasRenderingContext2D;
  layer: LinkCardLayer;
  metadata: LinkCardMetadata;
  cardWidth: number;
  cardHeight: number;
}) => {
  const box = resolveBox(layer.box, cardWidth, cardHeight);

  switch (layer.kind) {
    case "rect": {
      context.save();
      context.globalAlpha = layer.opacity ?? 1;
      context.fillStyle =
        createLinearGradient(context, box.width, box.height, layer.background) ??
        layer.background;
      roundedRect(context, box.x, box.y, box.width, box.height, getRadius(layer.radiusRatio, cardWidth));
      context.fill();
      context.restore();
      return;
    }

    case "image": {
      const src = getImageValue(metadata, layer.slot);
      if (!src) return;

      let image: HTMLImageElement;

      try {
        image = await loadImage(src);
      } catch {
        return;
      }

      context.save();
      roundedRect(
        context,
        box.x,
        box.y,
        box.width,
        box.height,
        getRadius(layer.radiusRatio, cardWidth),
      );
      context.clip();
      if (layer.background) {
        context.fillStyle = layer.background;
        context.fillRect(box.x, box.y, box.width, box.height);
      }
      drawFittedImage(context, image, box.x, box.y, box.width, box.height, layer.fit);
      context.restore();
      return;
    }

    case "text": {
      const value = getTextValue(metadata, layer.slot) || layer.fallback || "";
      drawText(context, value, box, layer.style, cardWidth);
      return;
    }

    case "badge": {
      const value = getTextValue(metadata, layer.slot) || layer.fallback || "";
      if (layer.hiddenWhenEmpty && !value) return;

      context.save();
      context.fillStyle = layer.style.background;
      roundedRect(
        context,
        box.x,
        box.y,
        box.width,
        box.height,
        getRadius(layer.style.radiusRatio, cardWidth),
      );
      context.fill();
      drawText(
        context,
        value,
        { ...box, x: box.x + cardWidth * layer.style.paddingXRatio },
        { ...layer.style, align: "center", lineClamp: 1 },
        cardWidth,
      );
      context.restore();
      return;
    }

    case "icon": {
      context.save();
      context.fillStyle = layer.color;
      context.globalAlpha = layer.opacity ?? 1;
      context.font = `700 ${Math.min(box.width, box.height) * 0.42}px Arial, sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("GH", box.x + box.width / 2, box.y + box.height / 2);
      context.restore();
      return;
    }

    case "statList": {
      const stats = metadata.stats.slice(0, layer.maxItems);
      let x = box.x;
      const y = box.y;

      stats.forEach((stat) => {
        const fontSize = cardWidth * layer.item.fontSizeRatio;
        const paddingX = cardWidth * layer.item.paddingXRatio;
        const paddingY = cardWidth * layer.item.paddingYRatio;

        context.font = `${layer.item.fontWeight ?? 400} ${fontSize}px Arial, sans-serif`;
        const width = context.measureText(stat).width + paddingX * 2;
        const height = fontSize + paddingY * 2;

        context.fillStyle = layer.item.background;
        roundedRect(
          context,
          x,
          y,
          width,
          height,
          getRadius(layer.item.radiusRatio, cardWidth),
        );
        context.fill();
        context.fillStyle = layer.item.color;
        context.textBaseline = "middle";
        context.fillText(stat, x + paddingX, y + height / 2);
        x += width + cardWidth * layer.gapRatio;
      });
    }
  }
};

const drawCard = async (
  context: CanvasRenderingContext2D,
  preset: LinkCardPreset,
  metadata: LinkCardMetadata,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  context.save();
  context.translate(x, y);
  roundedRect(
    context,
    0,
    0,
    width,
    height,
    getRadius(preset.borderRadiusRatio, width),
  );
  context.clip();
  fillBackground(context, width, height, preset.background);

  for (const layer of preset.layers) {
    await drawLayer({
      context,
      layer,
      metadata,
      cardWidth: width,
      cardHeight: height,
    });
  }

  context.restore();
};

export const createLightweightCanvasExport = async (): Promise<ExportResult> => {
  const {
    activeBackgroundId,
    activeCard,
    canvasSize,
    cardShadowSize,
  } = useCanvasStore.getState();
  const activeBackground = getBackgroundPresetById(activeBackgroundId);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create an export canvas.");
  }

  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;

  await document.fonts?.ready;
  fillBackground(context, canvas.width, canvas.height, activeBackground.background);

  if (activeCard) {
    const preset = getLinkCardPresetById(activeCard.presetId);
    const cardWidth = canvas.width * activeCard.widthRatio;
    const cardHeight = cardWidth / preset.aspectRatio;
    const cardX = (canvas.width - cardWidth) / 2;
    const cardY = (canvas.height - cardHeight) / 2;
    const shadow = getCardShadowOption(cardShadowSize).canvas;

    if (cardShadowSize !== "none") {
      context.save();
      context.shadowBlur = shadow.blur;
      context.shadowColor = shadow.color;
      context.shadowOffsetX = shadow.offsetX;
      context.shadowOffsetY = shadow.offsetY;
      context.fillStyle = "rgba(0, 0, 0, 0.01)";
      roundedRect(
        context,
        cardX,
        cardY,
        cardWidth,
        cardHeight,
        getRadius(preset.borderRadiusRatio, cardWidth),
      );
      context.fill();
      context.restore();
    }

    await drawCard(
      context,
      preset,
      activeCard.metadata,
      cardX,
      cardY,
      cardWidth,
      cardHeight,
    );
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error("Unable to encode the PNG export."));
        return;
      }

      resolve(result);
    }, "image/png");
  });
  const url = URL.createObjectURL(blob);

  return {
    blob,
    filename: `canvas-${canvas.width}x${canvas.height}.png`,
    url,
  };
};

export const downloadLightweightCanvasExport = (exportResult: ExportResult) => {
  const link = document.createElement("a");

  link.href = exportResult.url;
  link.download = exportResult.filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(exportResult.url), 1000);
};
