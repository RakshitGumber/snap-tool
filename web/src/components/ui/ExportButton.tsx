import { Icon } from "@iconify/react";
import { useCallback } from "react";

import { getBackgroundPresetById } from "@/config/backgroundPresets";
import { getCardShadowOption } from "@/config/cardShadows";
import {
  getLinkCardPresetById,
  type LinkCardBorder,
  type LinkCardBox,
  type LinkCardLayer,
  type LinkCardShadow,
  type LinkCardSlot,
  type LinkCardTextStyle,
} from "@/config/linkCardPresets";
import {
  type LinkCardCanvasItem,
  useCanvasStore,
} from "@/stores/useCanvasStore";

const splitCssArgs = (value: string) => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];

    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;

    if (char === "," && depth === 0) {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }

  parts.push(value.slice(start).trim());
  return parts;
};

const parseCssImageBackground = (background: string | undefined) => {
  if (!background?.startsWith("url(")) return null;

  const match = background.match(/^url\((?:"([^"]+)"|'([^']+)'|([^)]*))\)/);
  const src = match?.[1] ?? match?.[2] ?? match?.[3]?.trim();

  return src ? { src } : null;
};

const addGradientStops = (
  gradient: CanvasGradient,
  stops: string[],
) => {
  stops.forEach((stop, index) => {
    const stopMatch = stop.match(/^(.*)\s+([\d.]+)%$/);

    gradient.addColorStop(
      stopMatch
        ? Number(stopMatch[2]) / 100
        : index / Math.max(1, stops.length - 1),
      stopMatch ? stopMatch[1] : stop,
    );
  });
};

const createFillStyle = (
  context: CanvasRenderingContext2D,
  background: string | undefined,
  width: number,
  height: number,
  x = 0,
  y = 0,
) => {
  if (!background) return "transparent";
  if (parseCssImageBackground(background)) return "#f8fafc";

  if (background.startsWith("linear-gradient(")) {
    const args = splitCssArgs(background.slice(16, -1));
    const angleMatch = args[0]?.match(/^([\d.]+)deg$/);
    const angle = ((angleMatch ? Number(angleMatch[1]) : 180) * Math.PI) / 180;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const length = Math.abs(width * dx) + Math.abs(height * dy);
    const gradient = context.createLinearGradient(
      x + width / 2 - (dx * length) / 2,
      y + height / 2 - (dy * length) / 2,
      x + width / 2 + (dx * length) / 2,
      y + height / 2 + (dy * length) / 2,
    );
    const stops = args.slice(angleMatch ? 1 : 0);

    addGradientStops(gradient, stops);

    return gradient;
  }

  if (background.startsWith("radial-gradient(")) {
    const args = splitCssArgs(background.slice(16, -1));
    const shape = args[0] ?? "";
    const positionMatch = shape.match(/at\s+([\d.]+)%\s+([\d.]+)%/);
    const hasShapeArg =
      shape.startsWith("circle") ||
      shape.startsWith("ellipse") ||
      shape.startsWith("at ");
    const centerX = x + width * (positionMatch ? Number(positionMatch[1]) / 100 : 0.5);
    const centerY = y + height * (positionMatch ? Number(positionMatch[2]) / 100 : 0.5);
    const radius = Math.max(width, height);
    const gradient = context.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius,
    );

    addGradientStops(gradient, args.slice(hasShapeArg ? 1 : 0));

    return gradient;
  }

  return background;
};

const roundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
};

const getLayerBox = (
  box: LinkCardBox,
  x: number,
  y: number,
  width: number,
  height: number,
) => ({
  x: x + box.x * width,
  y: y + box.y * height,
  width: box.width * width,
  height: box.height * height,
});

const applyShadow = (
  context: CanvasRenderingContext2D,
  shadow: LinkCardShadow | undefined,
  cardWidth: number,
) => {
  if (!shadow) return;

  context.shadowBlur = shadow.blurRatio * cardWidth;
  context.shadowColor = shadow.color;
  context.shadowOffsetX = shadow.offsetXRatio * cardWidth;
  context.shadowOffsetY = shadow.offsetYRatio * cardWidth;
};

const drawBorder = (
  context: CanvasRenderingContext2D,
  border: LinkCardBorder | undefined,
  box: ReturnType<typeof getLayerBox>,
  radius: number,
  cardWidth: number,
) => {
  if (!border) return;

  context.save();
  context.strokeStyle = border.color;
  context.lineWidth = Math.max(1, border.widthRatio * cardWidth);
  roundedRect(
    context,
    box.x + context.lineWidth / 2,
    box.y + context.lineWidth / 2,
    box.width - context.lineWidth,
    box.height - context.lineWidth,
    Math.max(0, radius - context.lineWidth / 2),
  );
  context.stroke();
  context.restore();
};

const getTextValue = (card: LinkCardCanvasItem, slot: LinkCardSlot) => {
  const metadata = card.metadata;

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
      return "startTimeLabel" in metadata
        ? (metadata.startTimeLabel ?? "")
        : "";
    default:
      return "";
  }
};

const getImageValue = (card: LinkCardCanvasItem, slot: LinkCardSlot) => {
  const metadata = card.metadata;

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
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;
  const drawWidth = imageRatio > boxRatio ? height * imageRatio : width;
  const drawHeight = drawWidth / imageRatio;

  context.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
};

const drawBackground = async (
  context: CanvasRenderingContext2D,
  background: string | undefined,
  width: number,
  height: number,
) => {
  const imageBackground = parseCssImageBackground(background);

  if (!imageBackground) {
    context.fillStyle = createFillStyle(context, background, width, height);
    context.fillRect(0, 0, width, height);
    return;
  }

  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, width, height);

  try {
    const image = await loadImage(imageBackground.src);

    drawCoverImage(context, image, 0, 0, width, height);
  } catch {
    // Keep exporting even when a remote background image is unavailable.
  }
};

const drawCardShadow = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  shadow: ReturnType<typeof getCardShadowOption>["canvas"],
) => {
  if (
    shadow.color === "transparent" ||
    (shadow.blur === 0 && shadow.offsetX === 0 && shadow.offsetY === 0)
  ) {
    return;
  }

  const shadowCanvas = document.createElement("canvas");
  const shadowContext = shadowCanvas.getContext("2d");

  if (!shadowContext) return;

  shadowCanvas.width = context.canvas.width;
  shadowCanvas.height = context.canvas.height;

  shadowContext.save();
  shadowContext.shadowBlur = shadow.blur;
  shadowContext.shadowColor = shadow.color;
  shadowContext.shadowOffsetX = shadow.offsetX;
  shadowContext.shadowOffsetY = shadow.offsetY;
  shadowContext.fillStyle = "#000000";
  roundedRect(shadowContext, x, y, width, height, radius);
  shadowContext.fill();
  shadowContext.restore();

  shadowContext.save();
  shadowContext.globalCompositeOperation = "destination-out";
  shadowContext.fillStyle = "#000000";
  roundedRect(shadowContext, x, y, width, height, radius);
  shadowContext.fill();
  shadowContext.restore();

  context.drawImage(shadowCanvas, 0, 0);
};

const drawImageLayer = async (
  context: CanvasRenderingContext2D,
  layer: Extract<LinkCardLayer, { kind: "image" }>,
  card: LinkCardCanvasItem,
  box: ReturnType<typeof getLayerBox>,
  radius: number,
  cardWidth: number,
) => {
  if (layer.shadow) {
    context.save();
    applyShadow(context, layer.shadow, cardWidth);
    context.fillStyle = layer.background ?? "#ffffff";
    roundedRect(context, box.x, box.y, box.width, box.height, radius);
    context.fill();
    context.restore();
  }

  context.save();
  roundedRect(context, box.x, box.y, box.width, box.height, radius);
  context.clip();

  if (layer.background) {
    context.fillStyle = createFillStyle(
      context,
      layer.background,
      box.width,
      box.height,
      box.x,
      box.y,
    );
    context.fillRect(box.x, box.y, box.width, box.height);
  }

  const src = getImageValue(card, layer.slot);

  if (src) {
    try {
      const image = await loadImage(src);
      const imageRatio = image.naturalWidth / image.naturalHeight;
      const boxRatio = box.width / box.height;
      const drawWidth =
        layer.fit === "contain"
          ? imageRatio > boxRatio
            ? box.width
            : box.height * imageRatio
          : imageRatio > boxRatio
            ? box.height * imageRatio
            : box.width;
      const drawHeight = drawWidth / imageRatio;

      context.save();
      context.globalAlpha = layer.opacity ?? 1;
      context.drawImage(
        image,
        box.x + (box.width - drawWidth) / 2,
        box.y + (box.height - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );
      context.restore();
    } catch {
      // Keep exporting even if a remote image blocks canvas access.
    }
  }

  context.restore();
  drawBorder(context, layer.border, box, radius, cardWidth);
};

const applyTextStyle = (
  context: CanvasRenderingContext2D,
  style: LinkCardTextStyle,
  cardWidth: number,
) => {
  const fontSize = cardWidth * style.fontSizeRatio;

  context.fillStyle = style.color;
  context.font = `${style.fontWeight ?? 400} ${fontSize}px Inter, sans-serif`;
  context.globalAlpha = style.opacity ?? 1;
  context.textAlign = style.align ?? "left";
  context.textBaseline = "top";

  return fontSize;
};

const truncateText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) => {
  if (context.measureText(text).width <= maxWidth) return text;

  let nextText = text;

  while (
    nextText.length > 0 &&
    context.measureText(`${nextText}...`).width > maxWidth
  ) {
    nextText = nextText.slice(0, -1);
  }

  return `${nextText}...`;
};

const drawText = (
  context: CanvasRenderingContext2D,
  text: string,
  box: ReturnType<typeof getLayerBox>,
  style: LinkCardTextStyle,
  cardWidth: number,
) => {
  if (!text) return;

  context.save();
  const fontSize = applyTextStyle(context, style, cardWidth);
  const lineHeight = fontSize * (style.lineHeight ?? 1.15);
  const maxLines = style.lineClamp ?? 1;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;

    if (context.measureText(nextLine).width <= box.width || !line) {
      line = nextLine;
    } else {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    }
  }

  if (lines.length < maxLines && line) lines.push(line);

  lines.slice(0, maxLines).forEach((currentLine, index) => {
    const isLastLine = index === maxLines - 1;
    const value = isLastLine
      ? truncateText(context, currentLine, box.width)
      : currentLine;
    const x =
      style.align === "center"
        ? box.x + box.width / 2
        : style.align === "right"
          ? box.x + box.width
          : box.x;

    context.fillText(value, x, box.y + index * lineHeight, box.width);
  });

  context.restore();
};

const drawIcon = (
  context: CanvasRenderingContext2D,
  icon: string,
  box: ReturnType<typeof getLayerBox>,
  color: string,
  opacity: number | undefined,
) => {
  const size = Math.min(box.width, box.height);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  context.save();
  context.globalAlpha = opacity ?? 1;
  context.fillStyle = color;
  context.strokeStyle = color;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = Math.max(2, size * 0.08);

  if (icon === "simple-icons:github") {
    context.beginPath();
    context.arc(centerX, centerY, size * 0.34, 0, Math.PI * 2);
    context.fill();
    context.fillRect(
      centerX - size * 0.08,
      centerY + size * 0.22,
      size * 0.16,
      size * 0.22,
    );
    context.beginPath();
    context.moveTo(centerX - size * 0.22, centerY - size * 0.22);
    context.lineTo(centerX - size * 0.34, centerY - size * 0.4);
    context.lineTo(centerX - size * 0.1, centerY - size * 0.31);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(centerX + size * 0.22, centerY - size * 0.22);
    context.lineTo(centerX + size * 0.34, centerY - size * 0.4);
    context.lineTo(centerX + size * 0.1, centerY - size * 0.31);
    context.closePath();
    context.fill();
  } else if (icon === "simple-icons:youtube") {
    roundedRect(
      context,
      centerX - size * 0.38,
      centerY - size * 0.26,
      size * 0.76,
      size * 0.52,
      size * 0.12,
    );
    context.fill();
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.moveTo(centerX - size * 0.08, centerY - size * 0.14);
    context.lineTo(centerX - size * 0.08, centerY + size * 0.14);
    context.lineTo(centerX + size * 0.15, centerY);
    context.closePath();
    context.fill();
  } else if (icon === "mingcute:play-circle-fill") {
    context.beginPath();
    context.arc(centerX, centerY, size * 0.42, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.moveTo(centerX - size * 0.08, centerY - size * 0.16);
    context.lineTo(centerX - size * 0.08, centerY + size * 0.16);
    context.lineTo(centerX + size * 0.18, centerY);
    context.closePath();
    context.fill();
  } else if (icon === "mingcute:star-fill") {
    context.beginPath();
    for (let point = 0; point < 10; point += 1) {
      const radius = point % 2 === 0 ? size * 0.42 : size * 0.18;
      const angle = -Math.PI / 2 + (point * Math.PI) / 5;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (point === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
  } else if (icon === "mingcute:globe-line") {
    context.beginPath();
    context.arc(centerX, centerY, size * 0.38, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.ellipse(centerX, centerY, size * 0.16, size * 0.38, 0, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(centerX - size * 0.34, centerY);
    context.lineTo(centerX + size * 0.34, centerY);
    context.stroke();
  } else if (icon === "mingcute:link-line") {
    context.beginPath();
    context.arc(centerX - size * 0.16, centerY, size * 0.18, Math.PI * 0.65, Math.PI * 1.65);
    context.stroke();
    context.beginPath();
    context.arc(centerX + size * 0.16, centerY, size * 0.18, -Math.PI * 0.35, Math.PI * 0.65);
    context.stroke();
    context.beginPath();
    context.moveTo(centerX - size * 0.08, centerY);
    context.lineTo(centerX + size * 0.08, centerY);
    context.stroke();
  } else if (icon === "mingcute:code-line") {
    context.beginPath();
    context.moveTo(centerX - size * 0.12, centerY - size * 0.22);
    context.lineTo(centerX - size * 0.28, centerY);
    context.lineTo(centerX - size * 0.12, centerY + size * 0.22);
    context.moveTo(centerX + size * 0.12, centerY - size * 0.22);
    context.lineTo(centerX + size * 0.28, centerY);
    context.lineTo(centerX + size * 0.12, centerY + size * 0.22);
    context.stroke();
  } else if (icon === "mingcute:git-branch-line") {
    context.beginPath();
    context.moveTo(centerX - size * 0.2, centerY - size * 0.26);
    context.lineTo(centerX - size * 0.2, centerY + size * 0.18);
    context.quadraticCurveTo(centerX - size * 0.2, centerY + size * 0.32, centerX, centerY + size * 0.32);
    context.lineTo(centerX + size * 0.2, centerY + size * 0.18);
    context.stroke();
    context.beginPath();
    context.arc(centerX - size * 0.2, centerY - size * 0.28, size * 0.1, 0, Math.PI * 2);
    context.arc(centerX + size * 0.2, centerY + size * 0.16, size * 0.1, 0, Math.PI * 2);
    context.fill();
  } else if (icon === "mingcute:browser-line") {
    roundedRect(
      context,
      centerX - size * 0.38,
      centerY - size * 0.3,
      size * 0.76,
      size * 0.6,
      size * 0.08,
    );
    context.stroke();
    context.beginPath();
    context.moveTo(centerX - size * 0.38, centerY - size * 0.12);
    context.lineTo(centerX + size * 0.38, centerY - size * 0.12);
    context.stroke();
  } else if (icon === "mingcute:image-line") {
    roundedRect(
      context,
      centerX - size * 0.36,
      centerY - size * 0.3,
      size * 0.72,
      size * 0.6,
      size * 0.08,
    );
    context.stroke();
    context.beginPath();
    context.arc(centerX + size * 0.18, centerY - size * 0.12, size * 0.07, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(centerX - size * 0.28, centerY + size * 0.2);
    context.lineTo(centerX - size * 0.08, centerY);
    context.lineTo(centerX + size * 0.04, centerY + size * 0.1);
    context.lineTo(centerX + size * 0.16, centerY - size * 0.02);
    context.lineTo(centerX + size * 0.3, centerY + size * 0.2);
    context.stroke();
  } else {
    context.beginPath();
    context.arc(centerX, centerY, size * 0.36, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
};

const drawCard = async (
  context: CanvasRenderingContext2D,
  card: LinkCardCanvasItem,
  canvasWidth: number,
  canvasHeight: number,
  shadowSize: ReturnType<typeof getCardShadowOption>["id"],
) => {
  const preset = getLinkCardPresetById(card.presetId);
  const cardWidth = canvasWidth * card.widthRatio;
  const cardHeight = cardWidth / preset.aspectRatio;
  const cardX = (canvasWidth - cardWidth) / 2;
  const cardY = (canvasHeight - cardHeight) / 2;
  const radius = preset.borderRadiusRatio * cardWidth;
  const shadow = getCardShadowOption(shadowSize).canvas;

  drawCardShadow(context, cardX, cardY, cardWidth, cardHeight, radius, shadow);

  context.save();
  roundedRect(context, cardX, cardY, cardWidth, cardHeight, radius);
  context.clip();

  for (const layer of preset.layers) {
    const box = getLayerBox(layer.box, cardX, cardY, cardWidth, cardHeight);

    if (layer.kind === "rect") {
      context.save();
      context.globalAlpha = layer.opacity ?? 1;
      applyShadow(context, layer.shadow, cardWidth);
      context.fillStyle = createFillStyle(
        context,
        layer.background,
        box.width,
        box.height,
        box.x,
        box.y,
      );
      roundedRect(
        context,
        box.x,
        box.y,
        box.width,
        box.height,
        (layer.radiusRatio ?? 0) * cardWidth,
      );
      context.fill();
      context.restore();
      drawBorder(
        context,
        layer.border,
        box,
        (layer.radiusRatio ?? 0) * cardWidth,
        cardWidth,
      );
    }

    if (layer.kind === "image") {
      await drawImageLayer(
        context,
        layer,
        card,
        box,
        (layer.radiusRatio ?? 0) * cardWidth,
        cardWidth,
      );
    }

    if (layer.kind === "text") {
      drawText(
        context,
        getTextValue(card, layer.slot) || layer.fallback || "",
        box,
        layer.style,
        cardWidth,
      );
    }

    if (layer.kind === "badge") {
      const value = getTextValue(card, layer.slot) || layer.fallback || "";

      if (!layer.hiddenWhenEmpty || value) {
        context.save();
        context.fillStyle = layer.style.background;
        roundedRect(
          context,
          box.x,
          box.y,
          box.width,
          box.height,
          layer.style.radiusRatio * cardWidth,
        );
        context.fill();
        drawText(
          context,
          value,
          {
            ...box,
            y:
              box.y +
              (box.height - cardWidth * layer.style.fontSizeRatio * 1.15) / 2,
          },
          { ...layer.style, align: "center" },
          cardWidth,
        );
        context.restore();
      }
    }

    if (layer.kind === "statList") {
      context.save();
      applyTextStyle(context, layer.item, cardWidth);
      const stats = card.metadata.stats.slice(0, layer.maxItems);
      const gap = layer.gapRatio * cardWidth;
      let x = box.x;
      let y = box.y;
      const fontSize = layer.item.fontSizeRatio * cardWidth;
      const paddingX = layer.item.paddingXRatio * cardWidth;
      const paddingY = layer.item.paddingYRatio * cardWidth;
      const pillHeight = fontSize * 1.1 + paddingY * 2;

      stats.forEach((stat) => {
        const pillWidth = context.measureText(stat).width + paddingX * 2;

        if (x + pillWidth > box.x + box.width) {
          x = box.x;
          y += pillHeight + gap;
        }

        if (y + pillHeight > box.y + box.height) return;

        context.fillStyle = layer.item.background;
        roundedRect(
          context,
          x,
          y,
          pillWidth,
          pillHeight,
          layer.item.radiusRatio * cardWidth,
        );
        context.fill();
        context.fillStyle = layer.item.color;
        context.fillText(stat, x + paddingX, y + paddingY);
        x += pillWidth + gap;
      });
      context.restore();
    }

    if (layer.kind === "icon") {
      drawIcon(context, layer.icon, box, layer.color, layer.opacity);
    }
  }

  context.restore();
};

export const ExportButton = () => {
  const handleDownload = useCallback(async () => {
    try {
      const { activeBackgroundId, activeCard, canvasSize, cardShadowSize } =
        useCanvasStore.getState();
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) throw new Error("Canvas export is not supported.");

      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;

      const background = getBackgroundPresetById(activeBackgroundId);
      await drawBackground(
        context,
        background.background,
        canvas.width,
        canvas.height,
      );

      if (activeCard) {
        await drawCard(
          context,
          activeCard,
          canvas.width,
          canvas.height,
          cardShadowSize,
        );
      }

      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `snap-tool-${Date.now()}.png`;
      link.click();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save the board.";
      console.log(message);
    }
  }, []);

  return (
    <div className="relative">
      <button
        className="gap-2 flex px-5 py-2.5 items-center text-bg bg-accent rounded-md"
        onClick={() => handleDownload()}
      >
        <div className="text-base leading-3 font-semibold">Export</div>
        <Icon icon="mingcute:external-link-line" fontSize={18} />
      </button>
    </div>
  );
};
