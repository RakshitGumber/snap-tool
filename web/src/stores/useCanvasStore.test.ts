import { describe, expect, test } from "bun:test";

import { DEFAULT_CANVAS_BACKGROUND_EFFECTS } from "@/canvas/backgroundEffects";

import { useCanvasStore } from "./useCanvasStore";

describe("useCanvasStore background actions", () => {
  test("applies custom solid colors as canvas-only backgrounds", () => {
    const store = useCanvasStore.getState();

    store.resetCanvas({ width: 1080, height: 1080 });
    store.applySolidColorBackground("#123456");

    const frame = useCanvasStore.getState().serializeCanvas();
    expect(frame?.backgroundPresetId).toBeNull();
    expect(frame?.background).toEqual({
      kind: "solid",
      color: "#123456",
    });
  });

  test("resets background effects to the shared defaults", () => {
    const store = useCanvasStore.getState();

    store.resetCanvas({ width: 1080, height: 1080 });
    store.updateCanvasBackgroundEffects({
      blur: 7,
      brightness: 140,
      contrast: 66,
      opacity: 45,
    });
    store.resetCanvasBackgroundEffects();

    const frame = useCanvasStore.getState().serializeCanvas();
    expect(frame?.backgroundEffects).toEqual(DEFAULT_CANVAS_BACKGROUND_EFFECTS);
  });
});
