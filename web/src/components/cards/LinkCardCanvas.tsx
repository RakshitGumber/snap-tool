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
import type { LinkCardCanvasItem } from "@/stores/useCanvasStore";
import { PixiImageBox, PixiRect } from "./pixiPrimitives";

type LinkCardCanvasProps = {
  canvasSize: CanvasSize;
  activeBackgroundId: string;
  activeCard: LinkCardCanvasItem | null;
};

const createLinearGradient = (layer: Extract<BackgroundLayer, { type: "linear-gradient" }>) => {
  const radians = (layer.angle * Math.PI) / 180;
  const dx = Math.sin(radians);
  const dy = -Math.cos(radians);

  return new FillGradient({
    type: "linear",
    start: { x: 0.5 - dx / 2, y: 0.5 - dy / 2 },
    end: { x: 0.5 + dx / 2, y: 0.5 + dy / 2 },
    colorStops: layer.stops,
    textureSpace: "local",
  });
};

const createRadialGradient = (layer: Extract<BackgroundLayer, { type: "radial-gradient" }>) =>
  new FillGradient({
    type: "radial",
    center: layer.center,
    outerCenter: layer.center,
    innerRadius: 0,
    outerRadius: layer.radius,
    colorStops: layer.stops,
    textureSpace: "local",
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
        ? createLinearGradient(layer)
        : createRadialGradient(layer),
    [layer],
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
  const cardWidth = canvasSize.width * card.widthRatio;
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
