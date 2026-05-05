import { describe, expect, test } from "bun:test";

import type { CanvasObjectBounds } from "./objects";
import {
  createObjectDragSession,
  EMPTY_GUIDES,
  resolveObjectDragUpdate,
} from "./objectDrag";

const createBounds = (x: number, y: number, width: number, height: number): CanvasObjectBounds => ({
  x,
  y,
  width,
  height,
});

describe("objectDrag", () => {
  test("moves every selected object by the same delta", () => {
    const imageRef = { kind: "image", id: "image-1" } as const;
    const textRef = { kind: "text", id: "text-1" } as const;
    const session = createObjectDragSession({
      pointerId: 7,
      primaryRef: imageRef,
      selection: [imageRef, textRef],
      startPointer: { x: 100, y: 150 },
      startPositions: {
        "image:image-1": { x: 40, y: 60 },
        "text:text-1": { x: 200, y: 300 },
      },
      primaryBounds: createBounds(40, 60, 120, 80),
    });

    const result = resolveObjectDragUpdate({
      session,
      pointer: { x: 130, y: 190, shiftKey: false },
      otherBounds: [],
      canvasWidth: 800,
      canvasHeight: 600,
    });

    expect(result.guides).toEqual(EMPTY_GUIDES);
    expect(result.moves).toEqual([
      { ref: imageRef, x: 70, y: 100 },
      { ref: textRef, x: 230, y: 340 },
    ]);
  });

  test("locks movement to the dominant axis when shift is pressed", () => {
    const imageRef = { kind: "image", id: "image-1" } as const;
    const session = createObjectDragSession({
      pointerId: 9,
      primaryRef: imageRef,
      selection: [imageRef],
      startPointer: { x: 100, y: 100 },
      startPositions: {
        "image:image-1": { x: 20, y: 30 },
      },
      primaryBounds: createBounds(20, 30, 120, 80),
    });

    const result = resolveObjectDragUpdate({
      session,
      pointer: { x: 160, y: 130, shiftKey: true },
      otherBounds: [],
      canvasWidth: 800,
      canvasHeight: 600,
    });

    expect(result.moves).toEqual([{ ref: imageRef, x: 80, y: 30 }]);
  });

  test("snaps the primary object to nearby guides", () => {
    const imageRef = { kind: "image", id: "image-1" } as const;
    const session = createObjectDragSession({
      pointerId: 11,
      primaryRef: imageRef,
      selection: [imageRef],
      startPointer: { x: 100, y: 100 },
      startPositions: {
        "image:image-1": { x: 100, y: 100 },
      },
      primaryBounds: createBounds(100, 100, 100, 100),
    });

    const result = resolveObjectDragUpdate({
      session,
      pointer: { x: 148, y: 145, shiftKey: false },
      otherBounds: [createBounds(250, 240, 100, 100)],
      canvasWidth: 800,
      canvasHeight: 600,
    });

    expect(result.guides).toEqual({
      vertical: [250],
      horizontal: [240],
    });
    expect(result.moves).toEqual([{ ref: imageRef, x: 150, y: 140 }]);
  });
});
