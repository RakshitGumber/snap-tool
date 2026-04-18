import type { CanvasNavigationDirection } from "@/types/canvas";

type NavigableCanvas = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const getCanvasCenter = (canvas: NavigableCanvas) => ({
  x: canvas.x + canvas.width / 2,
  y: canvas.y + canvas.height / 2,
});

export const getNearestCanvasInDirection = (
  canvases: NavigableCanvas[],
  activeCanvasId: string | null,
  direction: CanvasNavigationDirection,
): string | null => {
  if (!activeCanvasId) return canvases[0]?.id ?? null;

  const activeCanvas = canvases.find((canvas) => canvas.id === activeCanvasId);
  if (!activeCanvas) return canvases[0]?.id ?? null;

  const activeCenter = getCanvasCenter(activeCanvas);
  let bestId: string | null = null;
  let bestPrimaryDistance = Number.POSITIVE_INFINITY;
  let bestSecondaryDistance = Number.POSITIVE_INFINITY;

  for (const canvas of canvases) {
    if (canvas.id === activeCanvas.id) {
      continue;
    }

    const center = getCanvasCenter(canvas);
    const deltaX = center.x - activeCenter.x;
    const deltaY = center.y - activeCenter.y;

    if (direction === "next" && deltaX <= 0) continue;
    if (direction === "prev" && deltaX >= 0) continue;
    if (direction === "down" && deltaY <= 0) continue;
    if (direction === "up" && deltaY >= 0) continue;

    const primaryDistance =
      direction === "next" || direction === "prev"
        ? Math.abs(deltaX)
        : Math.abs(deltaY);
    const secondaryDistance =
      direction === "next" || direction === "prev"
        ? Math.abs(deltaY)
        : Math.abs(deltaX);

    if (
      primaryDistance < bestPrimaryDistance ||
      (primaryDistance === bestPrimaryDistance &&
        secondaryDistance < bestSecondaryDistance)
    ) {
      bestId = canvas.id;
      bestPrimaryDistance = primaryDistance;
      bestSecondaryDistance = secondaryDistance;
    }
  }

  return bestId ?? activeCanvas.id;
};
