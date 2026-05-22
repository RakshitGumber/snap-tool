import { describe, expect, test } from "bun:test";

import {
  clampCardWidthRatio,
  getMaxFittingCardWidthRatio,
  MAX_CARD_CANVAS_OCCUPANCY_RATIO,
  MIN_CARD_WIDTH_RATIO,
} from "../src/libs/cardSizing";

describe("card sizing", () => {
  test("shrinks portrait cards to fit short canvases by height", () => {
    const canvasSize = { width: 1500, height: 500 };
    const aspectRatio = 4 / 5;

    const widthRatio = clampCardWidthRatio({
      widthRatio: 0.43,
      canvasSize,
      aspectRatio,
    });
    const cardWidth = canvasSize.width * widthRatio;
    const cardHeight = cardWidth / aspectRatio;

    expect(widthRatio).toBeCloseTo((500 * (4 / 5) * 0.92) / 1500);
    expect(cardHeight).toBeLessThanOrEqual(
      canvasSize.height * MAX_CARD_CANVAS_OCCUPANCY_RATIO,
    );
  });

  test("keeps landscape cards under the existing width cap", () => {
    expect(
      getMaxFittingCardWidthRatio(
        { width: 1600, height: 900 },
        16 / 9,
      ),
    ).toBeCloseTo(MAX_CARD_CANVAS_OCCUPANCY_RATIO);
  });

  test("clamps drag attempts to the largest fitting ratio", () => {
    const canvasSize = { width: 1500, height: 500 };
    const aspectRatio = 4 / 5;
    const maxRatio = getMaxFittingCardWidthRatio(canvasSize, aspectRatio);

    expect(
      clampCardWidthRatio({
        widthRatio: 2,
        canvasSize,
        aspectRatio,
      }),
    ).toBeCloseTo(maxRatio);
  });

  test("lets fit take priority over the minimum ratio on very short canvases", () => {
    const widthRatio = clampCardWidthRatio({
      widthRatio: MIN_CARD_WIDTH_RATIO,
      canvasSize: { width: 1600, height: 120 },
      aspectRatio: 4 / 5,
    });

    expect(widthRatio).toBeLessThan(MIN_CARD_WIDTH_RATIO);
  });
});
