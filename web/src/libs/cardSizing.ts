import type { CanvasSize } from "@/config/canvasPresets";

export const MIN_CARD_WIDTH_RATIO = 0.12;
export const MAX_CARD_CANVAS_OCCUPANCY_RATIO = 0.92;

export const getMaxFittingCardWidthRatio = (
  canvasSize: CanvasSize,
  aspectRatio: number,
) => {
  if (
    canvasSize.width <= 0 ||
    canvasSize.height <= 0 ||
    aspectRatio <= 0
  ) {
    return 0;
  }

  const maxWidthRatio = MAX_CARD_CANVAS_OCCUPANCY_RATIO;
  const maxHeightRatio =
    (canvasSize.height * aspectRatio * MAX_CARD_CANVAS_OCCUPANCY_RATIO) /
    canvasSize.width;

  return Math.min(maxWidthRatio, maxHeightRatio);
};

export const clampCardWidthRatio = ({
  widthRatio,
  canvasSize,
  aspectRatio,
}: {
  widthRatio: number;
  canvasSize: CanvasSize;
  aspectRatio: number;
}) => {
  const maxFittingRatio = getMaxFittingCardWidthRatio(
    canvasSize,
    aspectRatio,
  );
  const fallbackRatio = Number.isFinite(widthRatio)
    ? widthRatio
    : MIN_CARD_WIDTH_RATIO;
  const minFittingRatio = Math.min(MIN_CARD_WIDTH_RATIO, maxFittingRatio);

  return Math.min(maxFittingRatio, Math.max(minFittingRatio, fallbackRatio));
};
