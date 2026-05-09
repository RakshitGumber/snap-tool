// Review note: Canvas background renderer for solid, gradient, and image backgrounds with visual effects.
// The comments in this file are intentionally dense to support the requested review pass.

import clsx from "clsx";

import {
  buildCanvasBackgroundFilter,
  getCanvasBackgroundBlurPadding,
  getCanvasBackgroundOpacity,
  normalizeCanvasBackgroundEffects,
} from "@/canvas/backgroundEffects";
import {
  getCanvasBackgroundCssValue,
  getCanvasBackgroundImageLayout,
  isCanvasBackgroundImage,
} from "@/canvas/backgrounds";
import type {
  CanvasBackgroundEffects,
  CanvasBackgroundValue,
} from "@/types/canvas";

/**
 * Documents the canvas background layer props contract used by the surrounding feature.
 */
type CanvasBackgroundLayerProps = {
  width: number;
  height: number;
  background: CanvasBackgroundValue;
  effects?: Partial<CanvasBackgroundEffects> | null;
  imageSrc?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  className?: string;
};

/**
 * Paints the active background beneath board objects while mirroring export behavior.
 */
export const CanvasBackgroundLayer = ({
  width,
  height,
  background,
  effects,
  imageSrc,
  imageWidth,
  imageHeight,
  className,
}: CanvasBackgroundLayerProps) => {
  const normalizedEffects = normalizeCanvasBackgroundEffects(effects);
  const blurPadding = getCanvasBackgroundBlurPadding(normalizedEffects);
  const cssBackground = getCanvasBackgroundCssValue(background);
  const imageLayout =
    isCanvasBackgroundImage(background) &&
    imageSrc &&
    imageWidth &&
    imageHeight
      ? getCanvasBackgroundImageLayout({
          canvasWidth: width,
          canvasHeight: height,
          imageWidth,
          imageHeight,
          fit: background.fit,
          offsetX: background.offsetX,
          offsetY: background.offsetY,
        })
      : null;

  return (
    <div className={clsx("absolute inset-0 overflow-hidden", className)}>
      {cssBackground ? (
        <div
          className="absolute"
          style={{
            top: -blurPadding,
            right: -blurPadding,
            bottom: -blurPadding,
            left: -blurPadding,
            background: cssBackground,
            filter: buildCanvasBackgroundFilter(normalizedEffects),
            opacity: getCanvasBackgroundOpacity(normalizedEffects),
          }}
        />
      ) : null}

      {imageLayout && imageSrc ? (
        <div
          className="absolute overflow-hidden"
          style={{
            top: -blurPadding,
            right: -blurPadding,
            bottom: -blurPadding,
            left: -blurPadding,
          }}
        >
          <img
            src={imageSrc}
            alt=""
            draggable={false}
            className="pointer-events-none absolute select-none"
            style={{
              left: imageLayout.x + blurPadding,
              top: imageLayout.y + blurPadding,
              width: imageLayout.width,
              height: imageLayout.height,
              maxWidth: "none",
              filter: buildCanvasBackgroundFilter(normalizedEffects),
              opacity: getCanvasBackgroundOpacity(normalizedEffects),
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
