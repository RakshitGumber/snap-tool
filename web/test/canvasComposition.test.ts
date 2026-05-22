import { describe, expect, test } from "bun:test";

import {
  createYouTubeComposition,
  getCompositionLayout,
  getMaxCompositionImageWidthRatio,
  measureCompositionText,
  type CanvasComposition,
} from "../src/libs/canvasComposition";
import type { YouTubeLinkCardMetadata } from "../src/libs/linkCards";

const metadata: YouTubeLinkCardMetadata = {
  source: "youtube",
  originalUrl: "https://www.youtube.com/watch?v=test",
  videoId: "test",
  title: "A practical guide to building polished launch graphics",
  subtitle: "Single Filter",
  description: "Single Filter",
  thumbnailUrl: "https://i.ytimg.com/vi/test/hqdefault.jpg",
  startTimeLabel: null,
  stats: [],
};

const makeComposition = (
  patch?: Partial<CanvasComposition>,
): CanvasComposition => ({
  ...createYouTubeComposition(metadata),
  ...patch,
});

describe("canvas composition layout", () => {
  test("centers the image and text as one group", () => {
    const composition = makeComposition();
    const layout = getCompositionLayout(composition, {
      width: 1600,
      height: 900,
    });

    expect(layout.groupBox.x + layout.groupBox.width / 2).toBeCloseTo(800);
    expect(layout.groupBox.y + layout.groupBox.height / 2).toBeCloseTo(450);
    expect(layout.textBox.width).toBeCloseTo(layout.imageBox.width);
  });

  test("supports placing text above the image", () => {
    const composition = makeComposition({
      text: {
        ...createYouTubeComposition(metadata).text,
        position: "above",
      },
    });
    const layout = getCompositionLayout(composition, {
      width: 1600,
      height: 900,
    });

    expect(layout.textBox.y).toBeLessThan(layout.imageBox.y);
  });

  test("clamps image size against the full group height", () => {
    const composition = makeComposition({
      image: {
        ...createYouTubeComposition(metadata).image,
        widthRatio: 1.5,
      },
      text: {
        ...createYouTubeComposition(metadata).text,
        fontSize: 48,
      },
    });
    const canvasSize = { width: 1500, height: 500 };
    const maxRatio = getMaxCompositionImageWidthRatio(
      composition,
      canvasSize,
    );
    const layout = getCompositionLayout(composition, canvasSize);

    expect(layout.imageWidthRatio).toBeCloseTo(maxRatio);
    expect(layout.groupBox.height).toBeLessThanOrEqual(canvasSize.height * 0.92);
  });

  test("measures wrapped title height with a max line count", () => {
    const measured = measureCompositionText({
      text: metadata.title.repeat(4),
      maxWidth: 260,
      fontSize: 24,
    });

    expect(measured.lineCount).toBe(3);
    expect(measured.height).toBeCloseTo(86.4);
  });
});
