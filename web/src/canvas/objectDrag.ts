// Review note: Pointer-drag math for axis locking, snapping, and guide feedback during object movement.
// The comments in this file are intentionally dense to support the requested review pass.

import { getObjectRefKey } from "@/canvas/objects";
import type { CanvasObjectBounds } from "@/canvas/objects";
import type { BoardObjectRef } from "@/types/canvas";

/**
 * Stores the active snap-guide coordinates shown during an object drag.
 */
export type GuideState = {
  vertical: number[];
  horizontal: number[];
};

/**
 * Captures the fixed drag baseline used to compute movement deltas.
 */
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

/**
 * Represents one moved object after snapping and axis constraints have been resolved.
 */
export type ObjectDragMove = {
  ref: BoardObjectRef;
  x: number;
  y: number;
};

/**
 * Documents the axis lock contract used by the surrounding feature.
 */
type AxisLock = "horizontal" | "vertical";

/**
 * Keeps snap_threshold in one named constant so related calculations stay consistent.
 */
const SNAP_THRESHOLD = 8;

/**
 * Provides a stable no-guide object so callers can avoid null checks.
 */
export const EMPTY_GUIDES: GuideState = {
  vertical: [],
  horizontal: [],
};

/**
 * Resolves get axis lock from the available editor state.
 */
const getAxisLock = (
  deltaX: number,
  deltaY: number,
  isShiftPressed: boolean,
): AxisLock | null => {
  // Guard this branch so missing or invalid state does not flow into the main path.
  if (!isShiftPressed) {
    // Return null when this helper cannot produce a usable value.
    return null;
  }

  return Math.abs(deltaX) >= Math.abs(deltaY) ? "horizontal" : "vertical";
};

/**
 * Builds build alignment result from normalized inputs.
 */
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
      // Keep this conditional branch explicit because it changes the user-visible editor behavior.
      if (Math.abs(delta) > SNAP_THRESHOLD) {
        // Return the resolved value to the caller after all guards and transformations.
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
      // Keep this conditional branch explicit because it changes the user-visible editor behavior.
      if (Math.abs(delta) > SNAP_THRESHOLD) {
        // Return the resolved value to the caller after all guards and transformations.
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

/**
 * Snapshots the starting drag state before pointer movement begins.
 */
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

/**
 * Applies pointer deltas, optional axis locks, and snapping to every dragged object.
 */
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
