import { describe, expect, test } from "bun:test";

import {
  getBackgroundContrastColor,
  getBackgroundPresetById,
} from "../src/config/backgroundPresets";

describe("background preset contrast", () => {
  test("uses black text on blush gradient", () => {
    const blush = getBackgroundPresetById("blush");
    expect(getBackgroundContrastColor(blush)).toBe("#111111");
  });

  test("uses white text on dark gradients", () => {
    const dark = getBackgroundPresetById("eternal-constance");
    expect(getBackgroundContrastColor(dark)).toBe("#FFFFFF");
  });
});

