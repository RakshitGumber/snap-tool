import { describe, expect, test } from "bun:test";

import { createBoardDocument } from "./document";
import { resolveCanvasSnap } from "./snap";

describe("resolveCanvasSnap", () => {
  test("snaps flush alignment to the nearest canvas edge", () => {
    const board = createBoardDocument([
      {
        id: "active",
        title: "Canvas 1",
        x: 0,
        y: 0,
        width: 500,
        height: 500,
        background: "#fff",
        backgroundPresetId: "solid-white",
        images: [],
      },
      {
        id: "target",
        title: "Canvas 2",
        x: 560,
        y: 0,
        width: 500,
        height: 500,
        background: "#fff",
        backgroundPresetId: "solid-white",
        images: [],
      },
    ]);

    const activeCanvas = board.canvasesById.active!;
    const result = resolveCanvasSnap({
      activeCanvas,
      canvases: board,
      nextX: 552,
      nextY: 6,
      threshold: 16,
      gap: 40,
    });

    expect(result.x).toBe(560);
    expect(result.y).toBe(0);
    expect(result.guides).toHaveLength(2);
  });

  test("snaps to the configured gap when the canvases overlap on the other axis", () => {
    const board = createBoardDocument([
      {
        id: "active",
        title: "Canvas 1",
        x: 0,
        y: 0,
        width: 500,
        height: 500,
        background: "#fff",
        backgroundPresetId: "solid-white",
        images: [],
      },
      {
        id: "target",
        title: "Canvas 2",
        x: 600,
        y: 20,
        width: 500,
        height: 500,
        background: "#fff",
        backgroundPresetId: "solid-white",
        images: [],
      },
    ]);

    const activeCanvas = board.canvasesById.active!;
    const result = resolveCanvasSnap({
      activeCanvas,
      canvases: board,
      nextX: 68,
      nextY: 18,
      threshold: 16,
      gap: 40,
    });

    expect(result.x).toBe(60);
    expect(result.guides.some((guide) => guide.mode === "gap")).toBe(true);
  });
});
