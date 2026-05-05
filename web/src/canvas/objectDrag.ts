import { getObjectRefKey } from "@/canvas/objects";
import type { CanvasObjectBounds } from "@/canvas/objects";
import type { BoardObjectRef } from "@/types/canvas";

export type GuideState = {
  vertical: number[];
  horizontal: number[];
};

export type ObjectDragSession = {
  pointerId: number;
  primaryRef: BoardObjectRef;
  selection: BoardObjectRef[];
  startPointer: {
    x: number;
    y: number;
  };
  startPositions: Record<string, { x: number; y: number }>;
  primaryBounds: CanvasObjectBounds;
};

export type ObjectDragMove = {
  ref: BoardObjectRef;
  x: number;
  y: number;
};

type AxisLock = "horizontal" | "vertical";

const SNAP_THRESHOLD = 8;

export const EMPTY_GUIDES: GuideState = {
  vertical: [],
  horizontal: [],
};

const getAxisLock = (
  deltaX: number,
  deltaY: number,
  isShiftPressed: boolean,
): AxisLock | null => {
  if (!isShiftPressed) {
    return null;
  }

  return Math.abs(deltaX) >= Math.abs(deltaY) ? "horizontal" : "vertical";
};

const buildAlignmentResult = ({
  movedBounds,
  otherBounds,
  canvasWidth,
  canvasHeight,
}: {
  movedBounds: CanvasObjectBounds;
  otherBounds: CanvasObjectBounds[];
  canvasWidth: number;
  canvasHeight: number;
}) => {
  const sourceX = [
    movedBounds.x,
    movedBounds.x + movedBounds.width / 2,
    movedBounds.x + movedBounds.width,
  ];
  const sourceY = [
    movedBounds.y,
    movedBounds.y + movedBounds.height / 2,
    movedBounds.y + movedBounds.height,
  ];
  const candidateX = [
    canvasWidth / 2,
    ...otherBounds.flatMap((bounds) => [
      bounds.x,
      bounds.x + bounds.width / 2,
      bounds.x + bounds.width,
    ]),
  ];
  const candidateY = [
    canvasHeight / 2,
    ...otherBounds.flatMap((bounds) => [
      bounds.y,
      bounds.y + bounds.height / 2,
      bounds.y + bounds.height,
    ]),
  ];

  let bestX: { delta: number; guide: number } | undefined;
  let bestY: { delta: number; guide: number } | undefined;

  sourceX.forEach((source) => {
    candidateX.forEach((candidate) => {
      const delta = candidate - source;
      if (Math.abs(delta) > SNAP_THRESHOLD) {
        return;
      }

      if (!bestX || Math.abs(delta) < Math.abs(bestX.delta)) {
        bestX = { delta, guide: candidate };
      }
    });
  });

  sourceY.forEach((source) => {
    candidateY.forEach((candidate) => {
      const delta = candidate - source;
      if (Math.abs(delta) > SNAP_THRESHOLD) {
        return;
      }

      if (!bestY || Math.abs(delta) < Math.abs(bestY.delta)) {
        bestY = { delta, guide: candidate };
      }
    });
  });

  return {
    deltaX: bestX?.delta ?? 0,
    deltaY: bestY?.delta ?? 0,
    guides: {
      vertical: bestX ? [bestX.guide] : [],
      horizontal: bestY ? [bestY.guide] : [],
    } satisfies GuideState,
  };
};

export const createObjectDragSession = ({
  pointerId,
  primaryRef,
  selection,
  startPointer,
  startPositions,
  primaryBounds,
}: ObjectDragSession): ObjectDragSession => ({
  pointerId,
  primaryRef,
  selection,
  startPointer,
  startPositions,
  primaryBounds,
});

export const resolveObjectDragUpdate = ({
  session,
  pointer,
  otherBounds,
  canvasWidth,
  canvasHeight,
}: {
  session: ObjectDragSession;
  pointer: {
    x: number;
    y: number;
    shiftKey: boolean;
  };
  otherBounds: CanvasObjectBounds[];
  canvasWidth: number;
  canvasHeight: number;
}) => {
  let deltaX = pointer.x - session.startPointer.x;
  let deltaY = pointer.y - session.startPointer.y;
  const axisLock = getAxisLock(deltaX, deltaY, pointer.shiftKey);

  if (axisLock === "horizontal") {
    deltaY = 0;
  } else if (axisLock === "vertical") {
    deltaX = 0;
  }

  const movedPrimaryBounds = {
    ...session.primaryBounds,
    x: session.primaryBounds.x + deltaX,
    y: session.primaryBounds.y + deltaY,
  };
  const alignment = buildAlignmentResult({
    movedBounds: movedPrimaryBounds,
    otherBounds,
    canvasWidth,
    canvasHeight,
  });
  const nextDeltaX = deltaX + alignment.deltaX;
  const nextDeltaY = deltaY + alignment.deltaY;

  return {
    guides: alignment.guides,
    moves: session.selection.map((ref) => {
      const startPosition =
        session.startPositions[getObjectRefKey(ref)] ?? { x: 0, y: 0 };

      return {
        ref,
        x: startPosition.x + nextDeltaX,
        y: startPosition.y + nextDeltaY,
      };
    }) satisfies ObjectDragMove[],
  };
};
