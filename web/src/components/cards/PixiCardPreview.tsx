import "./pixiSetup";

import { Application } from "@pixi/react";

import { CenteredPixiCard } from "@/components/cards/LinkCardCanvas";
import { getPixiResolution } from "@/components/cards/pixiResolution";
import { getLinkCardPresetById } from "@/config/linkCardPresets";
import type { LinkCardCanvasItem } from "@/stores/useCanvasStore";

export const PixiCardPreview = ({
  card,
  width,
}: {
  card: LinkCardCanvasItem;
  width: number;
}) => {
  const preset = getLinkCardPresetById(card.presetId);
  const height = width / preset.aspectRatio;

  return (
    <Application
      antialias
      autoDensity
      backgroundAlpha={0}
      className="block h-full w-full"
      height={height}
      resolution={getPixiResolution()}
      width={width}
    >
      <CenteredPixiCard
        card={{ ...card, widthRatio: 0.9 }}
        canvasSize={{ width, height }}
      />
    </Application>
  );
};
