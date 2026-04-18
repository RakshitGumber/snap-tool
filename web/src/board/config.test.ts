import { describe, expect, test } from "bun:test";

import {
  CANVAS_PRESET_GROUPS,
  DEFAULT_CANVAS_PRESET_ID,
  getCanvasPresetById,
  getCanvasPresetBySize,
  resolveCanvasPreset,
} from "./config";

describe("canvas preset config", () => {
  test("keeps the default preset on the general 500x500 canvas", () => {
    expect(DEFAULT_CANVAS_PRESET_ID).toBe("general-square");
    expect(getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID).size).toEqual({
      width: 500,
      height: 500,
    });
  });

  test("resolves exact grouped preset matches by size", () => {
    expect(getCanvasPresetBySize({ width: 1080, height: 1350 })?.id).toBe(
      "instagram-portrait-post",
    );
    expect(getCanvasPresetBySize({ width: 500, height: 500 })?.id).toBe("general-square");
  });

  test("returns a preset resolution for known sizes", () => {
    const resolved = resolveCanvasPreset({ width: 1000, height: 1500 });

    expect(resolved).toMatchObject({
      kind: "preset",
      group: { id: "pinterest", label: "Pinterest" },
      preset: { id: "pinterest-standard-pin", label: "Standard" },
    });
  });

  test("prefers the stored preset id when multiple platforms share the same size", () => {
    const resolved = resolveCanvasPreset({
      width: 1200,
      height: 628,
      presetId: "linkedin-landscape-post",
    });

    expect(resolved).toMatchObject({
      kind: "preset",
      group: { id: "linkedin", label: "LinkedIn" },
      preset: { id: "linkedin-landscape-post", label: "Landscape" },
    });
  });

  test("falls back to custom when the size is not in the preset library", () => {
    expect(resolveCanvasPreset({ width: 777, height: 432 })).toEqual({
      kind: "custom",
      size: { width: 777, height: 432 },
    });
  });

  test("ships social groups before the general fallback group", () => {
    expect(CANVAS_PRESET_GROUPS.map((group) => group.id)).toEqual([
      "twitter",
      "linkedin",
      "instagram",
      "pinterest",
      "general",
    ]);
  });
});
