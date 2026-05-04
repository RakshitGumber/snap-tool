import { describe, expect, test } from "bun:test";

import {
  findCanvasBackgroundById,
  useConfigStore,
} from "./useConfigStore";

describe("useConfigStore background preset groups", () => {
  test("exposes four grouped preset sections with six items each", () => {
    const groups = useConfigStore.getState().canvasBackgroundPresetGroups;

    expect(groups.map((group) => group.id)).toEqual([
      "gradients",
      "vector",
      "abstract",
      "unsplash",
    ]);
    expect(groups.map((group) => group.presets.length)).toEqual([6, 6, 6, 6]);
  });

  test("still resolves grouped preset ids through flat lookup helpers", () => {
    expect(findCanvasBackgroundById("gradient-01")?.label).toBe("Aurora");
    expect(findCanvasBackgroundById("vector-03")?.label).toBe("Summit");
    expect(findCanvasBackgroundById("abstract-05")?.label).toBe("Echo");
    expect(findCanvasBackgroundById("unsplash-06")?.label).toBe("Range");
  });
});
