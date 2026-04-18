import type { BoardDocument, CanvasFrame, CanvasRecord } from "@/types/canvas";

export const createEmptyBoardDocument = (): BoardDocument => ({
  canvasOrder: [],
  canvasesById: {},
});

export const normalizeCanvasFrame = (canvas: CanvasFrame): CanvasRecord => ({
  id: canvas.id,
  title: canvas.title,
  x: canvas.x,
  y: canvas.y,
  width: canvas.width,
  height: canvas.height,
  presetId: canvas.presetId ?? null,
  background: canvas.background,
  backgroundPresetId: canvas.backgroundPresetId,
  imageOrder: canvas.images.map((image) => image.id),
  imagesById: Object.fromEntries(canvas.images.map((image) => [image.id, image])),
});

export const createBoardDocument = (canvases: CanvasFrame[]): BoardDocument => ({
  canvasOrder: canvases.map((canvas) => canvas.id),
  canvasesById: Object.fromEntries(
    canvases.map((canvas) => [canvas.id, normalizeCanvasFrame(canvas)]),
  ),
});

export const serializeCanvasRecord = (canvas: CanvasRecord): CanvasFrame => ({
  id: canvas.id,
  title: canvas.title,
  x: canvas.x,
  y: canvas.y,
  width: canvas.width,
  height: canvas.height,
  presetId: canvas.presetId,
  background: canvas.background,
  backgroundPresetId: canvas.backgroundPresetId,
  images: canvas.imageOrder
    .map((imageId) => canvas.imagesById[imageId])
    .filter((image): image is CanvasRecord["imagesById"][string] => image !== undefined),
});

export const serializeBoardDocument = (document: BoardDocument): CanvasFrame[] =>
  document.canvasOrder
    .map((canvasId) => document.canvasesById[canvasId])
    .filter((canvas): canvas is CanvasRecord => canvas !== undefined)
    .map(serializeCanvasRecord);
