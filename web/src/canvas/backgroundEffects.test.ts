import { describe, expect, test } from "bun:test";

import {
  buildCanvasBackgroundFilter,
  DEFAULT_CANVAS_BACKGROUND_EFFECTS,
  formatCanvasBackgroundEffectValue,
  getCanvasBackgroundBlurPadding,
  getCanvasBackgroundOpacity,
  normalizeCanvasBackgroundEffects,
} from "./backgroundEffects";

describe("backgroundEffects", () => {
  test("returns the shared defaults when no effects are provided", () => {
    expect(normalizeCanvasBackgroundEffects()).toEqual(
      DEFAULT_CANVAS_BACKGROUND_EFFECTS,
    );
  });

  test("clamps incoming values to the supported ranges", () => {
    expect(
      normalizeCanvasBackgroundEffects({
        hue: 500,
        saturation: -10,
        blur: 52,
        brightness: 250,
        contrast: -20,
        opacity: 180,
      }),
    ).toEqual({
      hue: 360,
      saturation: 0,
      blur: 40,
      brightness: 200,
      contrast: 0,
      opacity: 100,
    });
  });

  test("builds a stable CSS filter string for the background layer", () => {
    expect(
      buildCanvasBackgroundFilter({
        hue: 120,
        saturation: 135,
        blur: 6,
        brightness: 110,
        contrast: 92,
      }),
    ).toBe(
      "hue-rotate(120deg) saturate(135%) blur(6px) brightness(110%) contrast(92%)",
    );
  });

  test("derives opacity, blur bleed, and label formatting from effect values", () => {
    const effects = normalizeCanvasBackgroundEffects({
      blur: 7,
      opacity: 45,
    });

    expect(getCanvasBackgroundOpacity(effects)).toBe(0.45);
    expect(getCanvasBackgroundBlurPadding(effects)).toBe(28);
    expect(formatCanvasBackgroundEffectValue("blur", effects.blur)).toBe("7px");
    expect(formatCanvasBackgroundEffectValue("opacity", effects.opacity)).toBe(
      "45%",
    );
  });
});
