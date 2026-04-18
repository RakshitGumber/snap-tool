import { beforeEach, describe, expect, test } from "bun:test";

import { DEFAULT_BOARD_TEXT_INPUT } from "@/board/text";
import { useBoardSelectionStore } from "@/stores/useBoardSelectionStore";
import type { UploadLibraryAssetMeta } from "@/types/uploads";

import { useCanvasStore } from "./useCanvasStore";

const asset: UploadLibraryAssetMeta = {
  id: "asset-1",
  name: "Sample image",
  source: "built-in",
  previewUrl: "/images/sample.png",
  remoteUrl: "/images/sample.png",
  width: 1200,
  height: 800,
  addedAt: "2026-04-18T00:00:00.000Z",
  storageKind: "bundled",
};

beforeEach(() => {
  useCanvasStore.setState({
    canvasMeta: null,
    imageOrder: [],
    imagesById: {},
    textOrder: [],
    textsById: {},
  });
  useBoardSelectionStore.setState({ selectedImageId: null, selectedTextId: null });
});

describe("useCanvasStore", () => {
  test("initializes the default canvas", () => {
    const canvas = useCanvasStore.getState().initializeDefaultCanvas();

    expect(canvas.title).toBe("Canvas");
    expect(canvas.width).toBe(500);
    expect(canvas.height).toBe(500);
    expect(canvas.images).toEqual([]);
    expect(canvas.texts).toEqual([]);
  });

  test("resizes and updates the canvas background", () => {
    const store = useCanvasStore.getState();

    store.initializeDefaultCanvas();
    store.resizeCanvas({ width: 640, height: 360 }, "general-landscape");
    store.applyBackgroundToCanvas("gradient-fresh");

    const canvas = store.serializeCanvas();

    expect(canvas).toMatchObject({
      width: 640,
      height: 360,
      presetId: "general-landscape",
      backgroundPresetId: "gradient-fresh",
    });
  });

  test("inserts an image at the default centered position", () => {
    const store = useCanvasStore.getState();

    store.initializeDefaultCanvas();
    const imageId = store.insertImageOnActiveCanvas(asset);
    const canvas = store.serializeCanvas();

    expect(imageId).toBeTruthy();
    expect(canvas?.images).toHaveLength(1);
    expect(canvas?.images[0]).toMatchObject({
      width: 400,
      height: 267,
      x: 50,
      y: 116.5,
    });
  });

  test("inserts an image around the dropped point", () => {
    const store = useCanvasStore.getState();

    store.initializeDefaultCanvas();
    store.insertImageOnCanvasAtPoint(asset, { x: 80, y: 90 });
    const canvas = store.serializeCanvas();

    expect(canvas?.images[0]).toMatchObject({
      x: 0,
      y: 0,
    });
  });

  test("moves an image within canvas bounds", () => {
    const store = useCanvasStore.getState();

    store.initializeDefaultCanvas();
    const imageId = store.insertImageOnActiveCanvas(asset);
    expect(imageId).toBeTruthy();

    store.moveImageOnCanvas(imageId!, 999, 999);
    const canvas = store.serializeCanvas();

    expect(canvas?.images[0]).toMatchObject({
      x: 100,
      y: 233,
    });
  });

  test("removes the selected image", () => {
    const store = useCanvasStore.getState();

    store.initializeDefaultCanvas();
    const imageId = store.insertImageOnActiveCanvas(asset);
    useBoardSelectionStore.getState().setSelectedImage(imageId);

    store.removeSelectedImage();
    const canvas = store.serializeCanvas();

    expect(canvas?.images).toEqual([]);
    expect(useBoardSelectionStore.getState().selectedImageId).toBeNull();
  });

  test("inserts and updates text on the canvas", () => {
    const store = useCanvasStore.getState();

    store.initializeDefaultCanvas();
    const textId = store.insertTextOnActiveCanvas({
      ...DEFAULT_BOARD_TEXT_INPUT,
      text: "Board title",
      fontFamily: "Open Sans",
      maxWidth: 280,
    });

    expect(textId).toBeTruthy();
    expect(useBoardSelectionStore.getState().selectedTextId).toBe(textId);

    store.updateTextOnCanvas(textId!, {
      text: "Board subtitle",
      fontSize: 64,
      align: "left",
    });

    const canvas = store.serializeCanvas();

    expect(canvas?.texts).toHaveLength(1);
    expect(canvas?.texts[0]).toMatchObject({
      text: "Board subtitle",
      fontFamily: "Open Sans",
      fontSize: 64,
      align: "left",
      maxWidth: 280,
    });
  });

  test("moves and removes selected text", () => {
    const store = useCanvasStore.getState();

    store.initializeDefaultCanvas();
    const textId = store.insertTextOnActiveCanvas({
      ...DEFAULT_BOARD_TEXT_INPUT,
      text: "Move me",
      fontSize: 48,
    });

    expect(textId).toBeTruthy();

    store.moveTextOnCanvas(textId!, 999, 999, { width: 220, height: 80 });
    let canvas = store.serializeCanvas();

    expect(canvas?.texts[0]).toMatchObject({
      x: 280,
      y: 420,
    });

    useBoardSelectionStore.getState().setSelectedText(textId);
    store.removeSelectedText();
    canvas = store.serializeCanvas();

    expect(canvas?.texts).toEqual([]);
    expect(useBoardSelectionStore.getState().selectedTextId).toBeNull();
  });

  test("resets the canvas to a clean single-canvas document", () => {
    const store = useCanvasStore.getState();

    store.initializeDefaultCanvas();
    store.insertImageOnActiveCanvas(asset);
    const canvas = store.resetCanvas({ width: 360, height: 640 });

    expect(canvas).toMatchObject({
      title: "Canvas",
      width: 360,
      height: 640,
      presetId: "general-square",
      images: [],
    });
  });

  test("serializes a single-canvas payload without board coordinates", () => {
    const store = useCanvasStore.getState();

    store.initializeDefaultCanvas();
    const canvas = store.serializeCanvas();

    expect(canvas).not.toBeNull();
    expect(canvas).not.toHaveProperty("x");
    expect(canvas).not.toHaveProperty("y");
    expect(canvas).toHaveProperty("images");
  });
});
