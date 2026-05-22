/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CanvasTextMetrics,
  FillGradient,
  Graphics,
  TextStyle,
  Texture,
  type ColorSource,
  type TextStyleOptions,
} from "pixi.js";

import type { LinkCardImageSlot } from "@/config/linkCardPresets";
import type { LinkCardMetadata } from "@/libs/linkCards";

export type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FontWeightInput = TextStyleOptions["fontWeight"] | number;
type PixiFill = ColorSource | FillGradient;

type TextBlockProps = {
  text: string;
  box: Box;
  color: ColorSource;
  fontSize: number;
  fontWeight?: FontWeightInput;
  lineHeight?: number;
  maxLines?: number;
  align?: "left" | "center" | "right";
  alpha?: number;
};

type BadgeProps = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  background: ColorSource;
  color: ColorSource;
  fontSize: number;
  fontWeight?: FontWeightInput;
  hiddenWhenEmpty?: boolean;
};

type ImageBoxProps = {
  src: string | null;
  box: Box;
  radius?: number;
  fit?: "cover" | "contain";
  background?: ColorSource;
  alpha?: number;
};

const textureCache = new Map<string, Texture | null>();
const texturePromises = new Map<string, Promise<Texture | null>>();
const CARD_FONT_FAMILY = "Roboto, Arial, sans-serif";

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image failed to load."));
    image.src = src;
  });

export const loadPixiTexture = async (src: string | null | undefined) => {
  if (!src) return null;

  const cachedTexture = textureCache.get(src);
  if (cachedTexture !== undefined) return cachedTexture;

  const activePromise = texturePromises.get(src);
  if (activePromise) return activePromise;

  const promise = loadImageElement(src)
    .then((image) => Texture.from(image))
    .catch(() => null)
    .then((texture) => {
      textureCache.set(src, texture);
      texturePromises.delete(src);
      return texture;
    });

  texturePromises.set(src, promise);
  return promise;
};

const getCachedTexture = (src: string | null | undefined) =>
  src ? (textureCache.get(src) ?? null) : null;

export const usePixiTexture = (
  src: string | null | undefined,
  revision?: number,
) => {
  const [texture, setTexture] = useState<Texture | null>(() =>
    getCachedTexture(src),
  );

  useEffect(() => {
    let isActive = true;

    Promise.resolve(getCachedTexture(src))
      .then((cachedTexture) => cachedTexture ?? loadPixiTexture(src))
      .then((nextTexture) => {
        if (isActive) setTexture(nextTexture);
      });

    return () => {
      isActive = false;
    };
  }, [revision, src]);

  return texture;
};

export const getImageSlotValue = (
  metadata: LinkCardMetadata,
  slot: LinkCardImageSlot,
) => {
  switch (slot) {
    case "thumbnailUrl":
      return "thumbnailUrl" in metadata ? metadata.thumbnailUrl : null;
    case "avatarUrl":
      return "avatarUrl" in metadata ? metadata.avatarUrl : null;
    case "openGraphUrl":
      return "openGraphUrl" in metadata ? metadata.openGraphUrl : null;
    case "faviconUrl":
      return "faviconUrl" in metadata ? metadata.faviconUrl : null;
  }
};

export const hostnameFromMetadata = (metadata: LinkCardMetadata) =>
  "hostname" in metadata
    ? metadata.hostname.replace(/^www\./, "")
    : new URL(metadata.originalUrl).hostname.replace(/^www\./, "");

export const imageForMetadata = (
  metadata: LinkCardMetadata,
  slots: LinkCardImageSlot[],
) => {
  for (const slot of slots) {
    const value = getImageSlotValue(metadata, slot);
    if (value) return value;
  }

  return null;
};

export const shortUrl = (value: string) => {
  try {
    const url = new URL(value);
    return `${url.hostname.replace(/^www\./, "")}${
      url.pathname === "/" ? "" : url.pathname
    }`;
  } catch {
    return value;
  }
};

export const textOrFallback = (
  value: string | null | undefined,
  fallback: string,
) => (value?.trim() ? value : fallback);

const normalizeFontWeight = (
  fontWeight: FontWeightInput,
): TextStyleOptions["fontWeight"] => {
  if (typeof fontWeight !== "number") return fontWeight;

  const normalized = Math.min(
    900,
    Math.max(100, Math.round(fontWeight / 100) * 100),
  );
  return String(normalized) as TextStyleOptions["fontWeight"];
};

export const roundedRect = (
  graphics: Graphics,
  box: Box,
  radius: number,
  fill: PixiFill,
  alpha = 1,
) => {
  graphics.roundRect(box.x, box.y, box.width, box.height, radius);
  if (fill instanceof FillGradient) {
    graphics.alpha = alpha;
    graphics.fill(fill);
  } else {
    graphics.fill({ color: fill, alpha });
  }
};

export const PixiRect = ({
  box,
  radius = 0,
  fill,
  alpha = 1,
  stroke,
}: {
  box: Box;
  radius?: number;
  fill: PixiFill;
  alpha?: number;
  stroke?: { color: ColorSource; width: number; alpha?: number };
}) => {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.alpha = alpha;
      graphics.roundRect(box.x, box.y, box.width, box.height, radius);
      if (fill instanceof FillGradient) {
        graphics.fill(fill);
      } else {
        graphics.fill({ color: fill, alpha });
      }

      if (stroke && stroke.width > 0) {
        graphics.stroke({
          color: stroke.color,
          width: stroke.width,
          alpha: stroke.alpha ?? 1,
        });
      }
    },
    [alpha, box.height, box.width, box.x, box.y, fill, radius, stroke],
  );

  return <pixiGraphics draw={draw} />;
};

const clampText = ({
  text,
  width,
  maxLines,
  style,
}: {
  text: string;
  width: number;
  maxLines: number;
  style: TextStyle;
}) => {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  let didTruncate = false;

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    const metrics = CanvasTextMetrics.measureText(nextLine, style);

    if (metrics.width <= width || !line) {
      line = nextLine;
      continue;
    }

    lines.push(line);
    line = word;

    if (lines.length === maxLines) {
      didTruncate = true;
      break;
    }
  }

  if (lines.length < maxLines && line) lines.push(line);
  if (!didTruncate && lines.length <= maxLines) return lines.join("\n");

  const visibleLines = lines.slice(0, maxLines);
  const lastLine = visibleLines[visibleLines.length - 1] ?? "";
  let truncatedLine = lastLine;

  while (
    truncatedLine.length > 1 &&
    CanvasTextMetrics.measureText(`${truncatedLine}...`, style).width > width
  ) {
    truncatedLine = truncatedLine.slice(0, -1).trimEnd();
  }

  visibleLines[visibleLines.length - 1] = `${truncatedLine || lastLine}...`;

  return visibleLines.join("\n");
};

export const PixiTextBlock = ({
  text,
  box,
  color,
  fontSize,
  fontWeight = 500,
  lineHeight = 1.15,
  maxLines = 1,
  align = "left",
  alpha = 1,
}: TextBlockProps) => {
  const style = useMemo(
    () =>
      new TextStyle({
        align,
        breakWords: true,
        fill: color,
        fontFamily: CARD_FONT_FAMILY,
        fontSize,
        fontWeight: normalizeFontWeight(fontWeight),
        lineHeight: fontSize * lineHeight,
        wordWrap: true,
        wordWrapWidth: box.width,
      }),
    [align, box.width, color, fontSize, fontWeight, lineHeight],
  );
  const clampedText = useMemo(
    () =>
      clampText({
        text,
        width: box.width,
        maxLines,
        style,
      }),
    [box.width, maxLines, style, text],
  );

  return (
    <pixiText
      alpha={alpha}
      text={clampedText}
      x={box.x}
      y={box.y}
      style={style}
    />
  );
};

export const PixiBadge = ({
  text,
  x,
  y,
  width,
  height,
  radius,
  background,
  color,
  fontSize,
  fontWeight = 800,
  hiddenWhenEmpty,
}: BadgeProps) => {
  if (hiddenWhenEmpty && !text) return null;

  return (
    <pixiContainer>
      <PixiRect
        box={{ x, y, width, height }}
        radius={radius}
        fill={background}
      />
      <pixiText
        anchor={0.5}
        text={text}
        x={x + width / 2}
        y={y + height / 2}
        style={
          new TextStyle({
            align: "center",
            fill: color,
            fontFamily: CARD_FONT_FAMILY,
            fontSize,
            fontWeight: normalizeFontWeight(fontWeight),
          })
        }
      />
    </pixiContainer>
  );
};

export const PixiImageBox = ({
  src,
  box,
  radius = 0,
  fit = "cover",
  background = 0xffffff,
  alpha = 1,
}: ImageBoxProps) => {
  const [mask, setMask] = useState<Graphics | null>(null);
  const texture = usePixiTexture(src);
  const maskDraw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.roundRect(0, 0, box.width, box.height, radius);
      graphics.fill(0xffffff);
    },
    [box.height, box.width, radius],
  );

  const imageSize = useMemo(() => {
    if (!texture) return null;

    const sourceWidth = texture.width || 1;
    const sourceHeight = texture.height || 1;
    const imageRatio = sourceWidth / sourceHeight;
    const boxRatio = box.width / box.height;
    const drawWidth =
      fit === "contain"
        ? imageRatio > boxRatio
          ? box.width
          : box.height * imageRatio
        : imageRatio > boxRatio
          ? box.height * imageRatio
          : box.width;
    const drawHeight = drawWidth / imageRatio;

    return {
      width: drawWidth,
      height: drawHeight,
      x: (box.width - drawWidth) / 2,
      y: (box.height - drawHeight) / 2,
    };
  }, [box.height, box.width, fit, texture]);

  return (
    <pixiContainer alpha={alpha} x={box.x} y={box.y}>
      <PixiRect
        box={{ x: 0, y: 0, width: box.width, height: box.height }}
        radius={radius}
        fill={background}
      />
      <pixiGraphics ref={setMask} draw={maskDraw} />
      {texture && imageSize ? (
        <pixiSprite
          texture={texture}
          x={imageSize.x}
          y={imageSize.y}
          width={imageSize.width}
          height={imageSize.height}
          mask={mask ?? undefined}
        />
      ) : null}
    </pixiContainer>
  );
};

export const PixiStats = ({
  stats,
  x,
  y,
  maxWidth,
  color,
  background,
  fontSize,
  gap,
}: {
  stats: string[];
  x: number;
  y: number;
  maxWidth: number;
  color: ColorSource;
  background: ColorSource;
  fontSize: number;
  gap: number;
}) => {
  const positionedStats = useMemo(() => {
    const visibleStats = stats.slice(0, 3);
    const getPillWidth = (stat: string) =>
      Math.min(
        maxWidth,
        Math.max(fontSize * 5, stat.length * fontSize * 0.62 + fontSize * 1.8),
      );

    return visibleStats.map((stat, index) => {
      const previousOffset = visibleStats
        .slice(0, index)
        .reduce(
          (total, previousStat) => total + getPillWidth(previousStat) + gap,
          0,
        );

      return {
        stat,
        x: x + previousOffset,
        width: getPillWidth(stat),
      };
    });
  }, [fontSize, gap, maxWidth, stats, x]);

  return (
    <pixiContainer>
      {positionedStats.map((positionedStat) => (
        <PixiBadge
          key={positionedStat.stat}
          text={positionedStat.stat}
          x={positionedStat.x}
          y={y}
          width={positionedStat.width}
          height={fontSize * 2.2}
          radius={fontSize * 0.8}
          background={background}
          color={color}
          fontSize={fontSize}
          fontWeight={820}
        />
      ))}
    </pixiContainer>
  );
};

export const PixiIcon = ({
  kind,
  x,
  y,
  size,
  color,
  alpha = 1,
}: {
  kind: "github" | "youtube" | "play" | "globe" | "link" | "code";
  x: number;
  y: number;
  size: number;
  color: ColorSource;
  alpha?: number;
}) => {
  const draw = useCallback(
    (graphics: Graphics) => {
      const center = size / 2;

      graphics.clear();
      graphics.alpha = alpha;
      graphics.stroke({ color, width: Math.max(2, size * 0.07) });

      if (kind === "youtube") {
        graphics.roundRect(
          size * 0.1,
          size * 0.24,
          size * 0.8,
          size * 0.52,
          size * 0.14,
        );
        graphics.fill(color);
        graphics.moveTo(size * 0.43, size * 0.36);
        graphics.lineTo(size * 0.43, size * 0.64);
        graphics.lineTo(size * 0.65, size * 0.5);
        graphics.closePath();
        graphics.fill(0xffffff);
        return;
      }

      if (kind === "play") {
        graphics.circle(center, center, size * 0.43);
        graphics.fill(color);
        graphics.moveTo(size * 0.43, size * 0.32);
        graphics.lineTo(size * 0.43, size * 0.68);
        graphics.lineTo(size * 0.69, size * 0.5);
        graphics.closePath();
        graphics.fill(0xffffff);
        return;
      }

      if (kind === "github") {
        graphics.circle(center, center, size * 0.33);
        graphics.fill(color);
        graphics.rect(size * 0.44, size * 0.68, size * 0.12, size * 0.2);
        graphics.fill(color);
        graphics.moveTo(size * 0.3, size * 0.28);
        graphics.lineTo(size * 0.21, size * 0.13);
        graphics.lineTo(size * 0.4, size * 0.2);
        graphics.closePath();
        graphics.fill(color);
        graphics.moveTo(size * 0.7, size * 0.28);
        graphics.lineTo(size * 0.79, size * 0.13);
        graphics.lineTo(size * 0.6, size * 0.2);
        graphics.closePath();
        graphics.fill(color);
        return;
      }

      if (kind === "globe") {
        graphics.circle(center, center, size * 0.36);
        graphics.stroke({ color, width: Math.max(2, size * 0.06) });
        graphics.ellipse(center, center, size * 0.14, size * 0.36);
        graphics.stroke({ color, width: Math.max(2, size * 0.05) });
        graphics.moveTo(size * 0.16, center);
        graphics.lineTo(size * 0.84, center);
        graphics.stroke({ color, width: Math.max(2, size * 0.05) });
        return;
      }

      if (kind === "code") {
        graphics.moveTo(size * 0.4, size * 0.26);
        graphics.lineTo(size * 0.22, center);
        graphics.lineTo(size * 0.4, size * 0.74);
        graphics.moveTo(size * 0.6, size * 0.26);
        graphics.lineTo(size * 0.78, center);
        graphics.lineTo(size * 0.6, size * 0.74);
        graphics.stroke({ color, width: Math.max(2, size * 0.07) });
        return;
      }

      graphics.circle(size * 0.36, center, size * 0.18);
      graphics.circle(size * 0.64, center, size * 0.18);
      graphics.moveTo(size * 0.43, center);
      graphics.lineTo(size * 0.57, center);
      graphics.stroke({ color, width: Math.max(2, size * 0.07) });
    },
    [alpha, color, kind, size],
  );

  return <pixiGraphics draw={draw} x={x} y={y} />;
};
