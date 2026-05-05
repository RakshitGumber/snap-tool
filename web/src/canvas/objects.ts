import type {
  BoardImageItem,
  BoardObjectKind,
  BoardObjectRef,
  BoardTextItem,
  CanvasFrame,
} from "@/types/canvas";

export type CanvasObjectBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CanvasObjectRecord = {
  image: BoardImageItem;
  text: BoardTextItem;
};

export type OrderedCanvasObject =
  | {
      kind: "image";
      ref: BoardObjectRef;
      item: BoardImageItem;
    }
  | {
      kind: "text";
      ref: BoardObjectRef;
      item: BoardTextItem;
    };

type OrderedObjectSource = {
  objectOrder: BoardObjectRef[];
  imagesById: Record<string, BoardImageItem>;
  textsById: Record<string, BoardTextItem>;
};

export const createObjectRef = (
  kind: BoardObjectKind,
  id: string,
): BoardObjectRef => ({
  kind,
  id,
});

export const getObjectRefKey = (ref: BoardObjectRef) => `${ref.kind}:${ref.id}`;

export const isSameObjectRef = (left: BoardObjectRef, right: BoardObjectRef) =>
  left.kind === right.kind && left.id === right.id;

export const getOrderedCanvasObjects = ({
  objectOrder,
  imagesById,
  textsById,
}: OrderedObjectSource): OrderedCanvasObject[] => {
  const orderedObjects: OrderedCanvasObject[] = [];

  objectOrder.forEach((ref) => {
    if (ref.kind === "image") {
      const item = imagesById[ref.id];
      if (item) {
        orderedObjects.push({ kind: "image", ref, item });
      }
      return;
    }

    const item = textsById[ref.id];
    if (item) {
      orderedObjects.push({ kind: "text", ref, item });
    }
  });

  return orderedObjects;
};

export const getOrderedCanvasObjectsFromFrame = (frame: CanvasFrame) =>
  getOrderedCanvasObjects({
    objectOrder: frame.objectOrder,
    imagesById: Object.fromEntries(frame.images.map((image) => [image.id, image])),
    textsById: Object.fromEntries(frame.texts.map((text) => [text.id, text])),
  });

export const getObjectBounds = (
  object: OrderedCanvasObject,
  measuredBounds?: Partial<Pick<CanvasObjectBounds, "width" | "height">>,
): CanvasObjectBounds => {
  if (object.kind === "image") {
    return {
      x: object.item.x,
      y: object.item.y,
      width: measuredBounds?.width ?? object.item.width,
      height: measuredBounds?.height ?? object.item.height,
    };
  }

  return {
    x: object.item.x,
    y: object.item.y,
    width: measuredBounds?.width ?? object.item.maxWidth,
    height: measuredBounds?.height ?? object.item.fontSize * 1.4,
  };
};

export const getObjectLabel = (object: OrderedCanvasObject) =>
  object.kind === "image"
    ? object.item.alt || "Image"
    : object.item.text.trim() || "Text";

let textMeasureContext: CanvasRenderingContext2D | null = null;

const getTextMeasureContext = () => {
  if (textMeasureContext || typeof document === "undefined") {
    return textMeasureContext;
  }

  const canvas = document.createElement("canvas");
  textMeasureContext = canvas.getContext("2d");

  return textMeasureContext;
};

const breakTokenToFit = (
  context: CanvasRenderingContext2D,
  token: string,
  maxWidth: number,
) => {
  const chunks: string[] = [];
  let current = "";

  for (const character of token) {
    const next = `${current}${character}`;
    if (!current || context.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }

    chunks.push(current);
    current = character;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
};

const wrapParagraph = (
  context: CanvasRenderingContext2D,
  paragraph: string,
  maxWidth: number,
) => {
  if (!paragraph) {
    return [""];
  }

  const tokens = paragraph.split(/(\s+)/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const token of tokens) {
    const candidate = `${currentLine}${token}`;
    if (!currentLine || context.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (token.trim() && context.measureText(token).width > maxWidth) {
      if (currentLine.trim()) {
        lines.push(currentLine.trimEnd());
        currentLine = "";
      }

      const chunks = breakTokenToFit(context, token, maxWidth);
      const lastChunk = chunks.pop();
      lines.push(...chunks);
      currentLine = lastChunk ?? "";
      continue;
    }

    lines.push(currentLine.trimEnd());
    currentLine = token.trimStart();
  }

  lines.push(currentLine.trimEnd());
  return lines;
};

export const measureTextItemBounds = (text: BoardTextItem) => {
  const fallbackHeight = text.fontSize * 1.4;
  const availableWidth = Math.max(text.maxWidth - 16, 1);
  const context = getTextMeasureContext();

  if (!context) {
    return {
      width: text.maxWidth,
      height: fallbackHeight,
    };
  }

  context.font = `${text.fontWeight} ${text.fontSize}px "${text.fontFamily}", sans-serif`;
  const lines = text.text
    .split("\n")
    .flatMap((paragraph) => wrapParagraph(context, paragraph, availableWidth));
  const lineHeight = text.fontSize * 1.4;
  const lineCount = Math.max(lines.length, 1);

  return {
    width: text.maxWidth,
    height: Math.max(lineCount * lineHeight + 8, fallbackHeight),
  };
};
