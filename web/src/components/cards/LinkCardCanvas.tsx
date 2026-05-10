/* eslint-disable react-refresh/only-export-components */
import "./pixiSetup";

import { useEffect, useState } from "react";
import { Texture } from "pixi.js";

import {
  getBackgroundPresetBackground,
  getBackgroundPresetById,
} from "@/config/backgroundPresets";
import { loadBackgroundTexture } from "@/components/cards/backgroundTexture";
import {
  getLinkCardPresetById,
  type LinkCardPreset,
} from "@/components/cards/presets";
import type { CanvasSize } from "@/config/canvasPresets";
import type { LinkCardCanvasItem } from "@/stores/useCanvasStore";

type LinkCardCanvasProps = {
  canvasSize: CanvasSize;
  activeBackgroundId: string;
  activeCard: LinkCardCanvasItem | null;
  assetRevision?: number;
};

const useBackgroundTexture = ({
  activeBackgroundId,
  width,
  height,
  revision,
}: {
  activeBackgroundId: string;
  width: number;
  height: number;
  revision?: number;
}) => {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let isActive = true;
    const background = getBackgroundPresetBackground(
      getBackgroundPresetById(activeBackgroundId),
    );

    loadBackgroundTexture(background, width, height).then((nextTexture) => {
      if (isActive) setTexture(nextTexture);
    });

    return () => {
      isActive = false;
    };
  }, [activeBackgroundId, height, revision, width]);

  return texture;
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
  assetRevision,
}: LinkCardCanvasProps) => {
  const backgroundTexture = useBackgroundTexture({
    activeBackgroundId,
    width: canvasSize.width,
    height: canvasSize.height,
    revision: assetRevision,
  });

  if (!backgroundTexture) return null;

  return (
    <pixiContainer>
      <pixiSprite
        texture={backgroundTexture}
        width={canvasSize.width}
        height={canvasSize.height}
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
