import { describe, expect, test } from "bun:test";

import {
  createYouTubeComposition,
  getCompositionLayout,
  getMaxCompositionImageWidthRatio,
  measureCompositionText,
  TITLE_TEXT_LINE_HEIGHT,
  CHANNEL_TEXT_LINE_HEIGHT,
  DEFAULT_YOUTUBE_TEMPLATE_ID,
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
  test("uses YouTube defaults for title and padding", () => {
    const composition = createYouTubeComposition(metadata);

    expect(composition.text.fontSize).toBe(52);
    expect(composition.layout.spacing).toBe(32);
  });

  test("centers the image and text as one group", () => {
    const composition = makeComposition();
    const layout = getCompositionLayout(composition, {
      width: 1600,
      height: 900,
    });

    expect(layout.groupBox.x + layout.groupBox.width / 2).toBeCloseTo(800);
    expect(layout.groupBox.y + layout.groupBox.height / 2).toBeCloseTo(450);
    expect(layout.titleBox.width).toBeLessThanOrEqual(layout.imageBox.width);
  });

  test("places the title below the thumbnail", () => {
    const composition = makeComposition();
    const layout = getCompositionLayout(composition, {
      width: 1600,
      height: 900,
    });

    expect(layout.titleBox.y).toBeGreaterThan(layout.imageBox.y);
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

    expect(measured.lineCount).toBe(2);
    expect(measured.height).toBeCloseTo(57.6);
  });

  test("collapses title+channel height when title is hidden", () => {
    const composition = makeComposition({
      text: {
        ...createYouTubeComposition(metadata).text,
        visible: false,
      },
    });
    const layout = getCompositionLayout(composition, {
      width: 1600,
      height: 900,
    });

    expect(layout.titleBox.height).toBe(0);
    expect(layout.channelBox.height).toBe(0);
    expect(layout.groupBox.height).toBeCloseTo(layout.imageBox.height);
  });

  test("uses tighter line heights for title and channel", () => {
    const composition = makeComposition({
      image: {
        ...createYouTubeComposition(metadata).image,
        visible: false,
      },
      text: {
        ...createYouTubeComposition(metadata).text,
        value: "Short title",
        fontSize: 50,
      },
      metadata: {
        ...metadata,
        subtitle: "Channel",
      },
    });
    const layout = getCompositionLayout(composition, {
      width: 2000,
      height: 900,
    });

    expect(layout.titleBox.height).toBeCloseTo(
      composition.text.fontSize * TITLE_TEXT_LINE_HEIGHT,
    );
    expect(layout.channelBox.height).toBeCloseTo(
      Math.max(12, composition.text.fontSize * 0.48) * CHANNEL_TEXT_LINE_HEIGHT,
    );
  });

  test("defaults new compositions to the feed template", () => {
    const composition = createYouTubeComposition(metadata);
    expect(composition.templateId).toBe(DEFAULT_YOUTUBE_TEMPLATE_ID);
  });

  test("positions title and channel inside thumbnail for on-thumbnail template", () => {
    const composition = createYouTubeComposition(metadata, "youtube-thumbnail-text");
    const layout = getCompositionLayout(composition, {
      width: 1600,
      height: 900,
    });

    expect(layout.groupBox.height).toBeCloseTo(layout.imageBox.height);
    expect(layout.titleBox.x).toBeGreaterThanOrEqual(layout.imageBox.x);
    expect(layout.channelBox.x).toBeGreaterThanOrEqual(layout.imageBox.x);
    expect(layout.titleBox.y).toBeGreaterThanOrEqual(layout.imageBox.y);
    expect(layout.channelBox.y + layout.channelBox.height).toBeLessThanOrEqual(
      layout.imageBox.y + layout.imageBox.height,
    );
    expect(layout.channelBox.y).toBeGreaterThan(layout.titleBox.y);
    expect(layout.channelBox.y - (layout.titleBox.y + layout.titleBox.height)).toBeGreaterThanOrEqual(
      14,
    );
  });
});
