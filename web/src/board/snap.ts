import type { CanvasFrame, SnapGuide, SnapMode, SnapPreview } from "@/types/canvas";

type SnapCandidate = {
  value: number;
  guide: SnapGuide;
};

type SnapAxisResult = {
  value: number;
  guide: SnapGuide | null;
};

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

const getClosestCandidate = (
  baseValue: number,
  candidates: SnapCandidate[],
  threshold: number,
): SnapAxisResult => {
  const closest = candidates
    .map((candidate) => ({
      ...candidate,
      delta: Math.abs(candidate.value - baseValue),
    }))
    .filter((candidate) => candidate.delta <= threshold)
    .sort((left, right) => left.delta - right.delta)[0];

  return closest
    ? { value: closest.value, guide: closest.guide }
    : { value: baseValue, guide: null };
};

export const resolveCanvasSnap = ({
  activeCanvas,
  canvases,
  nextX,
  nextY,
  threshold,
  gap,
}: {
  activeCanvas: CanvasFrame;
  canvases: CanvasFrame[];
  nextX: number;
  nextY: number;
  threshold: number;
  gap: number;
}): SnapPreview => {
  const horizontalCandidates: SnapCandidate[] = [];
  const verticalCandidates: SnapCandidate[] = [];

  const nextRight = nextX + activeCanvas.width;
  const nextBottom = nextY + activeCanvas.height;

  canvases
    .filter((canvas) => canvas.id !== activeCanvas.id)
    .forEach((canvas) => {
      const canvasRight = canvas.x + canvas.width;
      const canvasBottom = canvas.y + canvas.height;
      const canvasCenterX = canvas.x + canvas.width / 2;
      const canvasCenterY = canvas.y + canvas.height / 2;

      const guideStartY = Math.min(nextY, canvas.y);
      const guideEndY = Math.max(nextBottom, canvasBottom);
      const guideStartX = Math.min(nextX, canvas.x);
      const guideEndX = Math.max(nextRight, canvasRight);

      horizontalCandidates.push(
        {
          value: canvas.x,
          guide: buildGuide("x", canvas.x, guideStartY, guideEndY, "flush"),
        },
        {
          value: canvasCenterX - activeCanvas.width / 2,
          guide: buildGuide("x", canvasCenterX, guideStartY, guideEndY, "flush"),
        },
        {
          value: canvasRight - activeCanvas.width,
          guide: buildGuide("x", canvasRight, guideStartY, guideEndY, "flush"),
        },
      );

      verticalCandidates.push(
        {
          value: canvas.y,
          guide: buildGuide("y", canvas.y, guideStartX, guideEndX, "flush"),
        },
        {
          value: canvasCenterY - activeCanvas.height / 2,
          guide: buildGuide("y", canvasCenterY, guideStartX, guideEndX, "flush"),
        },
        {
          value: canvasBottom - activeCanvas.height,
          guide: buildGuide("y", canvasBottom, guideStartX, guideEndX, "flush"),
        },
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
        horizontalCandidates.push(
          {
            value: canvasRight + gap,
            guide: buildGuide("x", canvasRight, guideStartY, guideEndY, "gap"),
          },
          {
            value: canvasRight,
            guide: buildGuide("x", canvasRight, guideStartY, guideEndY, "flush"),
          },
          {
            value: canvas.x - activeCanvas.width - gap,
            guide: buildGuide("x", canvas.x, guideStartY, guideEndY, "gap"),
          },
          {
            value: canvas.x - activeCanvas.width,
            guide: buildGuide("x", canvas.x, guideStartY, guideEndY, "flush"),
          },
        );
      }

      if (overlapsHorizontally) {
        verticalCandidates.push(
          {
            value: canvasBottom + gap,
            guide: buildGuide("y", canvasBottom, guideStartX, guideEndX, "gap"),
          },
          {
            value: canvasBottom,
            guide: buildGuide("y", canvasBottom, guideStartX, guideEndX, "flush"),
          },
          {
            value: canvas.y - activeCanvas.height - gap,
            guide: buildGuide("y", canvas.y, guideStartX, guideEndX, "gap"),
          },
          {
            value: canvas.y - activeCanvas.height,
            guide: buildGuide("y", canvas.y, guideStartX, guideEndX, "flush"),
          },
        );
      }
    });

  const horizontalResult = getClosestCandidate(
    nextX,
    horizontalCandidates,
    threshold,
  );
  const verticalResult = getClosestCandidate(nextY, verticalCandidates, threshold);

  return {
    x: horizontalResult.value,
    y: verticalResult.value,
    guides: [horizontalResult.guide, verticalResult.guide].filter(
      (guide): guide is SnapGuide => guide !== null,
    ),
  };
};
