// Review note: Shared object ordering, lookup, labeling, and text measurement helpers for canvas items.
// The comments in this file are intentionally dense to support the requested review pass.

import type {
  BoardImageItem,
  BoardObjectKind,
  BoardObjectRef,
  BoardTextItem,
  CanvasFrame,
} from "@/types/canvas";

/**
 * Stores the rectangular geometry used for hit testing, ordering, and alignment.
 */
export type CanvasObjectBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Pairs an object reference with its full image or text item payload.
 */
export type CanvasObjectRecord = {
  image: BoardImageItem;
  text: BoardTextItem;
};

/**
 * Represents a renderable object after canvas objectOrder has been resolved.
 */
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

/**
 * Documents the ordered object source contract used by the surrounding feature.
 */
type OrderedObjectSource = {
  objectOrder: BoardObjectRef[];
  imagesById: Record<string, BoardImageItem>;
  textsById: Record<string, BoardTextItem>;
};

/**
 * Creates a typed reference that can point to either an image or a text object.
 */
export const createObjectRef = (
  kind: BoardObjectKind,
  id: string,
): BoardObjectRef => ({
  kind,
  id,
});

/**
 * Builds a stable map key for mixed image and text references.
 */
export const getObjectRefKey = (ref: BoardObjectRef) => `${ref.kind}:${ref.id}`;

/**
 * Compares object references without caring about object payload identity.
 */
export const isSameObjectRef = (left: BoardObjectRef, right: BoardObjectRef) =>
  left.kind === right.kind && left.id === right.id;

/**
 * Combines image and text maps into the exact order the canvas should render.
 */
export const getOrderedCanvasObjects = ({
  objectOrder,
  imagesById,
  textsById,
}: OrderedObjectSource): OrderedCanvasObject[] => {
  const orderedObjects: OrderedCanvasObject[] = [];

  objectOrder.forEach((ref) => {
    // Keep this conditional branch explicit because it changes the user-visible editor behavior.
    if (ref.kind === "image") {
      const item = imagesById[ref.id];
      // Keep this conditional branch explicit because it changes the user-visible editor behavior.
      if (item) {
        orderedObjects.push({ kind: "image", ref, item });
      }
      // Return the resolved value to the caller after all guards and transformations.
      return;
    }

    const item = textsById[ref.id];
    // Keep this conditional branch explicit because it changes the user-visible editor behavior.
    if (item) {
      orderedObjects.push({ kind: "text", ref, item });
    }
  });

  return orderedObjects;
};

/**
 * Convenience wrapper for ordering the objects inside a serialized frame.
 */
export const getOrderedCanvasObjectsFromFrame = (frame: CanvasFrame) =>
  getOrderedCanvasObjects({
    objectOrder: frame.objectOrder,
    imagesById: Object.fromEntries(frame.images.map((image) => [image.id, image])),
    textsById: Object.fromEntries(frame.texts.map((text) => [text.id, text])),
  });

/**
 * Returns the current rectangular bounds for image and text objects.
 */
export const getObjectBounds = (
  object: OrderedCanvasObject,
  measuredBounds?: Partial<Pick<CanvasObjectBounds, "width" | "height">>,
): CanvasObjectBounds => {
  // Keep this conditional branch explicit because it changes the user-visible editor behavior.
  if (object.kind === "image") {
    // Return the resolved value to the caller after all guards and transformations.
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

/**
 * Builds compact labels for layer lists and accessibility text.
 */
export const getObjectLabel = (object: OrderedCanvasObject) =>
  object.kind === "image"
    ? object.item.alt || "Image"
    : object.item.text.trim() || "Text";

let textMeasureContext: CanvasRenderingContext2D | null = null;

/**
 * Resolves get text measure context from the available editor state.
 */
const getTextMeasureContext = () => {
  // Guard this branch so missing or invalid state does not flow into the main path.
  if (textMeasureContext || typeof document === "undefined") {
    // Return the resolved value to the caller after all guards and transformations.
    return textMeasureContext;
  }

  const canvas = document.createElement("canvas");
  textMeasureContext = canvas.getContext("2d");

  return textMeasureContext;
};

/**
 * Handles the break token to fit behavior for this module.
 */
const breakTokenToFit = (
  context: CanvasRenderingContext2D,
  token: string,
  maxWidth: number,
) => {
  const chunks: string[] = [];
  let current = "";

  for (const character of token) {
    const next = `${current}${character}`;
    // Guard this branch so missing or invalid state does not flow into the main path.
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

/**
 * Handles the wrap paragraph behavior for this module.
 */
const wrapParagraph = (
  context: CanvasRenderingContext2D,
  paragraph: string,
  maxWidth: number,
) => {
  // Guard this branch so missing or invalid state does not flow into the main path.
  if (!paragraph) {
    // Return the resolved value to the caller after all guards and transformations.
    return [""];
  }

  const tokens = paragraph.split(/(\s+)/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const token of tokens) {
    const candidate = `${currentLine}${token}`;
    // Guard this branch so missing or invalid state does not flow into the main path.
    if (!currentLine || context.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (token.trim() && context.measureText(token).width > maxWidth) {
      // Keep this conditional branch explicit because it changes the user-visible editor behavior.
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
  // Return the resolved value to the caller after all guards and transformations.
  return lines;
};

/**
 * Approximates wrapped text geometry so selection and drag math match the visible text.
 */
export const measureTextItemBounds = (text: BoardTextItem) => {
  const fallbackHeight = text.fontSize * 1.4;
  const availableWidth = Math.max(text.maxWidth - 16, 1);
  const context = getTextMeasureContext();

  if (!context) {
    // Return the resolved value to the caller after all guards and transformations.
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
