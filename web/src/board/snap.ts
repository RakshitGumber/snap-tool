import type {
  BoardDocument,
  CanvasRecord,
  SnapGuide,
  SnapMode,
  SnapPreview,
} from "@/types/canvas";

const rangesOverlap = (
  startA: number,
  endA: number,
  startB: number,
  endB: number,
  tolerance: number,
) => startA <= endB + tolerance && endA >= startB - tolerance;

const buildGuide = (
  axis: "x" | "y",
  position: number,
  start: number,
  end: number,
  mode: SnapMode,
): SnapGuide => ({
  axis,
  position,
  start,
  end,
  mode,
});

const createAxisMatcher = (baseValue: number, threshold: number) => {
  let value = baseValue;
  let guide: SnapGuide | null = null;
  let delta = threshold + 1;

  return {
    consider(candidateValue: number, candidateGuide: SnapGuide) {
      const nextDelta = Math.abs(candidateValue - baseValue);
      if (nextDelta > threshold || nextDelta >= delta) {
        return;
      }

      value = candidateValue;
      guide = candidateGuide;
      delta = nextDelta;
    },
    getResult: () => ({ value, guide }),
  };
};

const getCanvasList = (canvases: BoardDocument | CanvasRecord[]) =>
  Array.isArray(canvases)
    ? canvases
    : canvases.canvasOrder
        .map((canvasId) => canvases.canvasesById[canvasId])
        .filter((canvas): canvas is CanvasRecord => canvas !== undefined);

export const resolveCanvasSnap = ({
  activeCanvas,
  canvases,
  nextX,
  nextY,
  threshold,
  gap,
}: {
  activeCanvas: CanvasRecord;
  canvases: BoardDocument | CanvasRecord[];
  nextX: number;
  nextY: number;
  threshold: number;
  gap: number;
}): SnapPreview => {
  const nextRight = nextX + activeCanvas.width;
  const nextBottom = nextY + activeCanvas.height;
  const horizontalMatcher = createAxisMatcher(nextX, threshold);
  const verticalMatcher = createAxisMatcher(nextY, threshold);

  for (const canvas of getCanvasList(canvases)) {
    if (canvas.id === activeCanvas.id) {
      continue;
    }

    const canvasRight = canvas.x + canvas.width;
    const canvasBottom = canvas.y + canvas.height;
    const canvasCenterX = canvas.x + canvas.width / 2;
    const canvasCenterY = canvas.y + canvas.height / 2;

    const guideStartY = Math.min(nextY, canvas.y);
    const guideEndY = Math.max(nextBottom, canvasBottom);
    const guideStartX = Math.min(nextX, canvas.x);
    const guideEndX = Math.max(nextRight, canvasRight);

    horizontalMatcher.consider(
      canvas.x,
      buildGuide("x", canvas.x, guideStartY, guideEndY, "flush"),
    );
    horizontalMatcher.consider(
      canvasCenterX - activeCanvas.width / 2,
      buildGuide("x", canvasCenterX, guideStartY, guideEndY, "flush"),
    );
    horizontalMatcher.consider(
      canvasRight - activeCanvas.width,
      buildGuide("x", canvasRight, guideStartY, guideEndY, "flush"),
    );

    verticalMatcher.consider(
      canvas.y,
      buildGuide("y", canvas.y, guideStartX, guideEndX, "flush"),
    );
    verticalMatcher.consider(
      canvasCenterY - activeCanvas.height / 2,
      buildGuide("y", canvasCenterY, guideStartX, guideEndX, "flush"),
    );
    verticalMatcher.consider(
      canvasBottom - activeCanvas.height,
      buildGuide("y", canvasBottom, guideStartX, guideEndX, "flush"),
    );

    const overlapsVertically = rangesOverlap(
      nextY,
      nextBottom,
      canvas.y,
      canvasBottom,
      threshold,
    );
    const overlapsHorizontally = rangesOverlap(
      nextX,
      nextRight,
      canvas.x,
      canvasRight,
      threshold,
    );

    if (overlapsVertically) {
      horizontalMatcher.consider(
        canvasRight + gap,
        buildGuide("x", canvasRight, guideStartY, guideEndY, "gap"),
      );
      horizontalMatcher.consider(
        canvasRight,
        buildGuide("x", canvasRight, guideStartY, guideEndY, "flush"),
      );
      horizontalMatcher.consider(
        canvas.x - activeCanvas.width - gap,
        buildGuide("x", canvas.x, guideStartY, guideEndY, "gap"),
      );
      horizontalMatcher.consider(
        canvas.x - activeCanvas.width,
        buildGuide("x", canvas.x, guideStartY, guideEndY, "flush"),
      );
    }

    if (overlapsHorizontally) {
      verticalMatcher.consider(
        canvasBottom + gap,
        buildGuide("y", canvasBottom, guideStartX, guideEndX, "gap"),
      );
      verticalMatcher.consider(
        canvasBottom,
        buildGuide("y", canvasBottom, guideStartX, guideEndX, "flush"),
      );
      verticalMatcher.consider(
        canvas.y - activeCanvas.height - gap,
        buildGuide("y", canvas.y, guideStartX, guideEndX, "gap"),
      );
      verticalMatcher.consider(
        canvas.y - activeCanvas.height,
        buildGuide("y", canvas.y, guideStartX, guideEndX, "flush"),
      );
    }
  }

  const horizontalResult = horizontalMatcher.getResult();
  const verticalResult = verticalMatcher.getResult();

  return {
    x: horizontalResult.value,
    y: verticalResult.value,
    guides: [horizontalResult.guide, verticalResult.guide].filter(
      (guide): guide is SnapGuide => guide !== null,
    ),
  };
};
