import "./pixiSetup";

import { Application } from "@pixi/react";

import { LinkCardCanvas } from "@/components/cards/LinkCardCanvas";
import { getPixiResolution } from "@/components/cards/pixiResolution";
import type { CanvasSize } from "@/config/canvasPresets";
import { normalizeComposition, type CanvasComposition } from "@/libs/canvasComposition";

export const PixiCompositionPreview = ({
  composition,
  width,
  canvasSize,
  activeBackgroundId,
}: {
  composition: CanvasComposition;
  width: number;
  canvasSize: CanvasSize;
  activeBackgroundId: string;
}) => {
  const height = (width * canvasSize.height) / canvasSize.width;
  const normalized = normalizeComposition(
    {
      ...composition,
      image: {
        ...composition.image,
        widthRatio: 0.9,
      },
    },
    { width, height },
  );

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
      <LinkCardCanvas
        activeBackgroundId={activeBackgroundId}
        activeComposition={normalized}
        canvasSize={{ width, height }}
      />
    </Application>
  );
};

