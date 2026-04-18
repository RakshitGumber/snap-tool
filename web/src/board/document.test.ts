import { describe, expect, test } from "bun:test";

import { createBoardDocument, serializeBoardDocument } from "./document";

describe("board document helpers", () => {
  test("preserves canvas and image ordering through normalize/serialize", () => {
    const canvases = [
      {
        id: "canvas-1",
        title: "Canvas 1",
        x: 0,
        y: 0,
        width: 500,
        height: 500,
        background: "#fff",
        backgroundPresetId: "solid-white",
        images: [
          {
            id: "image-1",
            assetId: "asset-1",
            x: 16,
            y: 24,
            width: 120,
            height: 90,
            alt: "Hero",
          },
          {
            id: "image-2",
            assetId: "asset-2",
            x: 180,
            y: 64,
            width: 140,
            height: 140,
            alt: "Badge",
          },
        ],
      },
      {
        id: "canvas-2",
        title: "Canvas 2",
        x: 540,
        y: 0,
        width: 640,
        height: 360,
        background: "#f4f6ff",
        backgroundPresetId: "solid-slate",
        images: [],
      },
    ];

    const document = createBoardDocument(canvases);

    expect(document.canvasOrder).toEqual(["canvas-1", "canvas-2"]);
    expect(document.canvasesById["canvas-1"]?.imageOrder).toEqual([
      "image-1",
      "image-2",
    ]);
    expect(serializeBoardDocument(document)).toEqual(canvases);
  });
});
