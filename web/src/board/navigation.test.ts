import { describe, expect, test } from "bun:test";

import { getNearestCanvasInDirection } from "./navigation";

const canvases = [
  { id: "left", x: 0, y: 100, width: 200, height: 200 },
  { id: "center", x: 300, y: 100, width: 200, height: 200 },
  { id: "right", x: 620, y: 100, width: 200, height: 200 },
  { id: "top", x: 300, y: -180, width: 200, height: 200 },
  { id: "bottom", x: 300, y: 420, width: 200, height: 200 },
];

describe("getNearestCanvasInDirection", () => {
  test("finds the closest canvas horizontally and vertically", () => {
    expect(getNearestCanvasInDirection(canvases, "center", "next")).toBe("right");
    expect(getNearestCanvasInDirection(canvases, "center", "prev")).toBe("left");
    expect(getNearestCanvasInDirection(canvases, "center", "up")).toBe("top");
    expect(getNearestCanvasInDirection(canvases, "center", "down")).toBe("bottom");
  });

  test("falls back to the first canvas when there is no active canvas", () => {
    expect(getNearestCanvasInDirection(canvases, null, "next")).toBe("left");
  });
});
