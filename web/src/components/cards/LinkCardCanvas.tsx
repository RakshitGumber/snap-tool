/* eslint-disable react-refresh/only-export-components */
import "./pixiSetup";

import { useEffect, useMemo } from "react";
import { FillGradient } from "pixi.js";

import {
  getBackgroundPresetById,
  getBackgroundContrastColor,
  getBackgroundPresetLayers,
  getOppositeContrastColor,
  type BackgroundLayer,
} from "@/config/backgroundPresets";
import {
  getLinkCardPresetById,
  type LinkCardPreset,
} from "@/config/linkCardPresets";
import type { CanvasSize } from "@/config/canvasPresets";
import { clampCardWidthRatio } from "@/libs/cardSizing";
import {
  getCompositionLayout,
  MAX_CHANNEL_LINES,
  MAX_TEXT_LINES,
  type CanvasComposition,
} from "@/libs/canvasComposition";
import type { LinkCardCanvasItem } from "@/stores/useCanvasStore";
import { PixiImageBox, PixiRect, PixiTextBlock } from "./pixiPrimitives";

type LinkCardCanvasProps = {
  canvasSize: CanvasSize;
  activeBackgroundId: string;
  activeComposition: CanvasComposition | null;
};

const createLinearGradient = (
  layer: Extract<BackgroundLayer, { type: "linear-gradient" }>,
  canvasSize: CanvasSize,
) => {
  const radians = (layer.angle * Math.PI) / 180;
  const dx = Math.sin(radians);
  const dy = -Math.cos(radians);
  const centerX = canvasSize.width / 2;
  const centerY = canvasSize.height / 2;
  const cornerDistances = [
    -centerX * dx - centerY * dy,
    (canvasSize.width - centerX) * dx - centerY * dy,
    -centerX * dx + (canvasSize.height - centerY) * dy,
    (canvasSize.width - centerX) * dx + (canvasSize.height - centerY) * dy,
  ];
  const startDistance = Math.min(...cornerDistances);
  const endDistance = Math.max(...cornerDistances);

  return new FillGradient({
    type: "linear",
    start: {
      x: centerX + startDistance * dx,
      y: centerY + startDistance * dy,
    },
    end: {
      x: centerX + endDistance * dx,
      y: centerY + endDistance * dy,
    },
    colorStops: layer.stops,
    textureSpace: "global",
  });
};

const createRadialGradient = (
  layer: Extract<BackgroundLayer, { type: "radial-gradient" }>,
  canvasSize: CanvasSize,
) =>
  new FillGradient({
    type: "radial",
    center: {
      x: layer.center.x * canvasSize.width,
      y: layer.center.y * canvasSize.height,
    },
    outerCenter: {
      x: layer.center.x * canvasSize.width,
      y: layer.center.y * canvasSize.height,
    },
    innerRadius: 0,
    outerRadius: layer.radius * Math.max(canvasSize.width, canvasSize.height),
    colorStops: layer.stops,
    textureSpace: "global",
  });

const PixiGradientLayer = ({
  layer,
  canvasSize,
}: {
  layer: Extract<
    BackgroundLayer,
    { type: "linear-gradient" | "radial-gradient" }
  >;
  canvasSize: CanvasSize;
}) => {
  const gradient = useMemo(
    () =>
      layer.type === "linear-gradient"
        ? createLinearGradient(layer, canvasSize)
        : createRadialGradient(layer, canvasSize),
    [canvasSize, layer],
  );

  useEffect(() => () => gradient.destroy(), [gradient]);

  return (
    <PixiRect
      box={{ x: 0, y: 0, width: canvasSize.width, height: canvasSize.height }}
      fill={gradient}
    />
  );
};

const PixiBackgroundLayer = ({
  layer,
  canvasSize,
}: {
  layer: BackgroundLayer;
  canvasSize: CanvasSize;
}) => {
  if (layer.type === "solid") {
    return (
      <PixiRect
        box={{
          x: 0,
          y: 0,
          width: canvasSize.width,
          height: canvasSize.height,
        }}
        fill={layer.color}
      />
    );
  }

  if (layer.type === "image") {
    return (
      <PixiImageBox
        src={layer.src}
        box={{
          x: 0,
          y: 0,
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      />
    );
  }

  return <PixiGradientLayer layer={layer} canvasSize={canvasSize} />;
};

const PixiBackground = ({
  activeBackgroundId,
  canvasSize,
}: {
  activeBackgroundId: string;
  canvasSize: CanvasSize;
}) => {
  const layers = getBackgroundPresetLayers(
    getBackgroundPresetById(activeBackgroundId),
  );

  return (
    <pixiContainer>
      {layers.map((layer, index) => (
        <PixiBackgroundLayer
          key={`${layer.type}-${index}`}
          layer={layer}
          canvasSize={canvasSize}
        />
      ))}
    </pixiContainer>
  );
};

export const getCardRenderBox = (
  card: LinkCardCanvasItem,
  preset: LinkCardPreset,
  canvasSize: CanvasSize,
) => {
  const widthRatio = clampCardWidthRatio({
    widthRatio: card.widthRatio,
    canvasSize,
    aspectRatio: preset.aspectRatio,
  });
  const cardWidth = canvasSize.width * widthRatio;
  const cardHeight = cardWidth / preset.aspectRatio;

  return {
    x: (canvasSize.width - cardWidth) / 2,
    y: (canvasSize.height - cardHeight) / 2,
    width: cardWidth,
    height: cardHeight,
  };
};

export const LinkCardCanvas = ({
  canvasSize,
  activeBackgroundId,
  activeComposition,
}: LinkCardCanvasProps) => {
  const activeBackground = getBackgroundPresetById(activeBackgroundId);
  const contrastColor = getBackgroundContrastColor(activeBackground);

  return (
    <pixiContainer>
      <PixiBackground
        activeBackgroundId={activeBackgroundId}
        canvasSize={canvasSize}
      />
      {activeComposition ? (
        <PixiComposition
          composition={activeComposition}
          canvasSize={canvasSize}
          textColor={contrastColor}
          overlayColor={getOppositeContrastColor(contrastColor)}
        />
      ) : null}
    </pixiContainer>
  );
};

const IMAGE_SHADOWS = {
  none: null,
  soft: { x: 10, y: 14, alpha: 0.18 },
  strong: { x: 16, y: 20, alpha: 0.28 },
} as const;

const PixiComposition = ({
  composition,
  canvasSize,
  textColor,
  overlayColor,
}: {
  composition: CanvasComposition;
  canvasSize: CanvasSize;
  textColor: string;
  overlayColor: string;
}) => {
  const layout = getCompositionLayout(composition, canvasSize);
  const shadow = IMAGE_SHADOWS[composition.image.shadow];

  const resolvedTextColor =
    composition.text.colorMode === "black"
      ? "#111111"
      : composition.text.colorMode === "white"
        ? "#FFFFFF"
        : textColor;

  return (
    <pixiContainer>
      {shadow && composition.image.visible ? (
        <PixiRect
          box={{
            x: layout.imageBox.x + shadow.x,
            y: layout.imageBox.y + shadow.y,
            width: layout.imageBox.width,
            height: layout.imageBox.height,
          }}
          radius={composition.image.radius}
          fill={0x000000}
          alpha={shadow.alpha}
        />
      ) : null}

      {composition.image.visible ? (
        <PixiImageBox
          src={composition.image.src}
          box={layout.imageBox}
          fit="cover"
          radius={Math.max(10, composition.image.radius)}
          background={null}
        />
      ) : null}

      {composition.text.visible && composition.text.overlay.enabled ? (
        <PixiRect
          box={{
            x: layout.titleBox.x,
            y: layout.titleBox.y,
            width: layout.titleBox.width,
            height: layout.titleBox.height + layout.channelBox.height,
          }}
          radius={Math.min(18, composition.text.fontSize * 0.32)}
          fill={overlayColor}
          alpha={0.82}
        />
      ) : null}

      {composition.text.visible ? (
        <>
          <PixiTextBlock
            text={composition.text.value}
            box={layout.titleBox}
            color={resolvedTextColor}
            fontFamily={`${composition.text.fontFamily}, Arial, sans-serif`}
            fontSize={composition.text.fontSize}
            fontWeight={820}
            lineHeight={1.1}
            maxLines={MAX_TEXT_LINES}
            align="left"
          />
          <PixiTextBlock
            text={composition.metadata.subtitle}
            box={layout.channelBox}
            color={resolvedTextColor}
            fontFamily={`${composition.text.fontFamily}, Arial, sans-serif`}
            fontSize={Math.max(12, composition.text.fontSize * 0.48)}
            fontWeight={650}
            lineHeight={1.1}
            maxLines={MAX_CHANNEL_LINES}
            align="left"
            alpha={0.82}
          />
        </>
      ) : null}
    </pixiContainer>
  );
};

export const CenteredPixiCard = ({
  card,
  canvasSize,
}: {
  card: LinkCardCanvasItem;
  canvasSize: CanvasSize;
}) => {
  const preset = getLinkCardPresetById(card.presetId);
  const box = getCardRenderBox(card, preset, canvasSize);
  const CardComponent = preset.Component;

  return (
    <pixiContainer x={box.x} y={box.y}>
      <CardComponent
        metadata={card.metadata}
        width={box.width}
        height={box.height}
      />
    </pixiContainer>
  );
};
