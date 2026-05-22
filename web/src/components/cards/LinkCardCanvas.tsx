/* eslint-disable react-refresh/only-export-components */
import "./pixiSetup";

import { useEffect, useMemo } from "react";
import { FillGradient } from "pixi.js";

import {
  getBackgroundPresetById,
  getBackgroundPresetLayers,
  type BackgroundLayer,
} from "@/config/backgroundPresets";
import {
  getLinkCardPresetById,
  type LinkCardPreset,
} from "@/config/linkCardPresets";
import type { CanvasSize } from "@/config/canvasPresets";
import { clampCardWidthRatio } from "@/libs/cardSizing";
import type { LinkCardCanvasItem } from "@/stores/useCanvasStore";
import { PixiImageBox, PixiRect } from "./pixiPrimitives";

type LinkCardCanvasProps = {
  canvasSize: CanvasSize;
  activeBackgroundId: string;
  activeCard: LinkCardCanvasItem | null;
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
  activeCard,
}: LinkCardCanvasProps) => {
  return (
    <pixiContainer>
      <PixiBackground
        activeBackgroundId={activeBackgroundId}
        canvasSize={canvasSize}
      />
      {activeCard ? (
        <CenteredPixiCard card={activeCard} canvasSize={canvasSize} />
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
