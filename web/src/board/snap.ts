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
      const overlapsVertically = rangesOverlap(
        nextY,
        nextBottom,
        canvas.y,
        canvas.y + canvas.height,
        threshold,
      );
      const overlapsHorizontally = rangesOverlap(
        nextX,
        nextRight,
        canvas.x,
        canvas.x + canvas.width,
        threshold,
      );

      if (overlapsVertically) {
        const guideStart = Math.min(nextY, canvas.y);
        const guideEnd = Math.max(nextBottom, canvas.y + canvas.height);

        horizontalCandidates.push(
          {
            value: canvas.x + canvas.width + gap,
            guide: buildGuide("x", canvas.x + canvas.width, guideStart, guideEnd, "gap"),
          },
          {
            value: canvas.x + canvas.width,
            guide: buildGuide("x", canvas.x + canvas.width, guideStart, guideEnd, "flush"),
          },
          {
            value: canvas.x - activeCanvas.width - gap,
            guide: buildGuide("x", canvas.x, guideStart, guideEnd, "gap"),
          },
          {
            value: canvas.x - activeCanvas.width,
            guide: buildGuide("x", canvas.x, guideStart, guideEnd, "flush"),
          },
        );
      }

      if (overlapsHorizontally) {
        const guideStart = Math.min(nextX, canvas.x);
        const guideEnd = Math.max(nextRight, canvas.x + canvas.width);

        verticalCandidates.push(
          {
            value: canvas.y + canvas.height + gap,
            guide: buildGuide("y", canvas.y + canvas.height, guideStart, guideEnd, "gap"),
          },
          {
            value: canvas.y + canvas.height,
            guide: buildGuide("y", canvas.y + canvas.height, guideStart, guideEnd, "flush"),
          },
          {
            value: canvas.y - activeCanvas.height - gap,
            guide: buildGuide("y", canvas.y, guideStart, guideEnd, "gap"),
          },
          {
            value: canvas.y - activeCanvas.height,
            guide: buildGuide("y", canvas.y, guideStart, guideEnd, "flush"),
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
