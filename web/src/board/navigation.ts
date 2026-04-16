import type { CanvasFrame, CanvasNavigationDirection } from "@/types/canvas";

const getCanvasCenter = (canvas: CanvasFrame) => ({
  x: canvas.x + canvas.width / 2,
  y: canvas.y + canvas.height / 2,
});

export const getNearestCanvasInDirection = (
  canvases: CanvasFrame[],
  activeCanvasId: string | null,
  direction: CanvasNavigationDirection,
): string | null => {
  if (!activeCanvasId) return canvases[0]?.id ?? null;

  const activeCanvas = canvases.find((canvas) => canvas.id === activeCanvasId);
  if (!activeCanvas) return canvases[0]?.id ?? null;

  const activeCenter = getCanvasCenter(activeCanvas);

  const rankedCandidates = canvases
    .filter((canvas) => canvas.id !== activeCanvas.id)
    .map((canvas) => {
      const center = getCanvasCenter(canvas);
      const deltaX = center.x - activeCenter.x;
      const deltaY = center.y - activeCenter.y;

      if (direction === "next" && deltaX <= 0) return null;
      if (direction === "prev" && deltaX >= 0) return null;
      if (direction === "down" && deltaY <= 0) return null;
      if (direction === "up" && deltaY >= 0) return null;

      const primaryDistance =
        direction === "next" || direction === "prev"
          ? Math.abs(deltaX)
          : Math.abs(deltaY);
      const secondaryDistance =
        direction === "next" || direction === "prev"
          ? Math.abs(deltaY)
          : Math.abs(deltaX);

      return {
        id: canvas.id,
        primaryDistance,
        secondaryDistance,
      };
    })
    .filter((candidate) => candidate !== null)
    .sort((left, right) => {
      if (left.primaryDistance !== right.primaryDistance) {
        return left.primaryDistance - right.primaryDistance;
      }

      return left.secondaryDistance - right.secondaryDistance;
    });

  return rankedCandidates[0]?.id ?? activeCanvas.id;
};
