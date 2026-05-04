import { describe, expect, test } from "bun:test";

import {
  createCanvasAssetImageBackground,
  createCanvasBackgroundFromPreset,
  cycleCanvasBackgroundImageFit,
  getCanvasBackgroundCssValue,
  getCanvasBackgroundImageLayout,
  inferCanvasBackgroundFromLegacyValue,
  normalizeCanvasBackgroundValue,
} from "./backgrounds";

describe("backgrounds", () => {
  test("normalizes bundled image presets into movable canvas backgrounds", () => {
    const background = createCanvasBackgroundFromPreset({
      id: "image-orbit",
      label: "Orbit",
      value: {
        kind: "image",
        fit: "cover",
        offsetX: 0,
        offsetY: 0,
        src: "/images/bg-orbit.svg",
        previewSrc: "/images/bg-orbit.svg",
        width: 1600,
        height: 900,
      },
    });

    expect(background).toEqual({
      kind: "image",
      fit: "cover",
      offsetX: 0,
      offsetY: 0,
      assetId: null,
      src: "/images/bg-orbit.svg",
      previewSrc: "/images/bg-orbit.svg",
      width: 1600,
      height: 900,
    });
  });

  test("migrates legacy solid and gradient backgrounds", () => {
    expect(inferCanvasBackgroundFromLegacyValue("#FFFFFF")).toEqual({
      kind: "solid",
      color: "#FFFFFF",
    });

    expect(
      inferCanvasBackgroundFromLegacyValue(
        "linear-gradient(135deg, #fff 0%, #000 100%)",
      ),
    ).toEqual({
      kind: "gradient",
      css: "linear-gradient(135deg, #fff 0%, #000 100%)",
    });
  });

  test("prefers preset metadata when normalizing a legacy persisted background", () => {
    expect(
      normalizeCanvasBackgroundValue({
        background: "linear-gradient(0deg, #111 0%, #222 100%)",
        preset: {
          id: "image-cascade",
          label: "Cascade",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "/images/bg-cascade.svg",
            previewSrc: "/images/bg-cascade.svg",
            width: 1080,
            height: 1350,
          },
        },
      }),
    ).toEqual({
      kind: "image",
      fit: "cover",
      offsetX: 0,
      offsetY: 0,
      assetId: null,
      src: "/images/bg-cascade.svg",
      previewSrc: "/images/bg-cascade.svg",
      width: 1080,
      height: 1350,
    });
  });

  test("computes contain, cover, and fill layouts with clamped offsets", () => {
    expect(
      getCanvasBackgroundImageLayout({
        canvasWidth: 1000,
        canvasHeight: 1000,
        imageWidth: 2000,
        imageHeight: 1000,
        fit: "contain",
        offsetX: 999,
        offsetY: -999,
      }),
    ).toMatchObject({
      width: 1000,
      height: 500,
      x: 0,
      y: 0,
      offsetX: 0,
      offsetY: -250,
    });

    expect(
      getCanvasBackgroundImageLayout({
        canvasWidth: 1000,
        canvasHeight: 1000,
        imageWidth: 2000,
        imageHeight: 1000,
        fit: "cover",
        offsetX: 999,
        offsetY: -999,
      }),
    ).toMatchObject({
      width: 2000,
      height: 1000,
      x: 0,
      y: 0,
      offsetX: 500,
      offsetY: 0,
    });

    expect(
      getCanvasBackgroundImageLayout({
        canvasWidth: 1000,
        canvasHeight: 1000,
        imageWidth: 2000,
        imageHeight: 1000,
        fit: "fill",
        offsetX: 80,
        offsetY: -80,
      }),
    ).toMatchObject({
      width: 1000,
      height: 1000,
      x: 0,
      y: 0,
      offsetX: 0,
      offsetY: 0,
    });
  });

  test("cycles fit modes and exposes css backgrounds", () => {
    expect(cycleCanvasBackgroundImageFit("contain")).toBe("cover");
    expect(cycleCanvasBackgroundImageFit("cover")).toBe("fill");
    expect(cycleCanvasBackgroundImageFit("fill")).toBe("contain");

    expect(
      getCanvasBackgroundCssValue({
        kind: "solid",
        color: "#ABCDEF",
      }),
    ).toBe("#ABCDEF");
    expect(
      getCanvasBackgroundCssValue({
        kind: "gradient",
        css: "linear-gradient(90deg, #000 0%, #fff 100%)",
      }),
    ).toBe("linear-gradient(90deg, #000 0%, #fff 100%)");
    expect(createCanvasAssetImageBackground("a1").fit).toBe("cover");
    expect(getCanvasBackgroundCssValue(createCanvasAssetImageBackground("a1"))).toBe(null);
  });
});
