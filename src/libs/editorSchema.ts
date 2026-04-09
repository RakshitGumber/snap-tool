export const ASPECT_RATIO_PRESETS = ["1:1", "9:16", "16:9"] as const;

export type AspectRatioPreset = (typeof ASPECT_RATIO_PRESETS)[number];

export type EditorTool = "select" | "paintBucket";

export type EffectAssetKind = "sticker" | "icon";

export interface EffectAsset {
  id: string;
  label: string;
  kind: EffectAssetKind;
  src: string;
  defaultSize: number;
}

export interface AssetDragPayload {
  type: EffectAssetKind;
  sourceId: string;
}

export interface CanvasItem {
  id: string;
  type: EffectAssetKind;
  sourceId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  z: number;
}

export interface EditorDocument {
  v: 1;
  bg: {
    fill: string;
  };
  items: CanvasItem[];
}

export interface EditorCanvas {
  id: string;
  ratio: AspectRatioPreset;
  document: EditorDocument;
}

export interface EditorStateSnapshot {
  v: 2;
  activeCanvasId: string;
  canvases: EditorCanvas[];
}

export interface NormalizedCanvasPoint {
  x: number;
  y: number;
}

export const DEFAULT_ASPECT_RATIO: AspectRatioPreset = "1:1";
export const DEFAULT_DOCUMENT: EditorDocument = {
  v: 1,
  bg: {
    fill: "#ffffff",
  },
  items: [],
};

export const DEFAULT_PAINT_COLOR = "#10b981";
export const DEFAULT_CANVAS_ID = "canvas-1";

export const CANVAS_ASSET_MIME = "application/x.snap-tool-asset";

export const ASPECT_RATIO_DIMENSIONS: Record<
  AspectRatioPreset,
  { width: number; height: number }
> = {
  "1:1": { width: 1200, height: 1200 },
  "9:16": { width: 900, height: 1600 },
  "16:9": { width: 1600, height: 900 },
};

export const PAINT_SWATCHES = [
  "#ffffff",
  "#10b981",
  "#1d4ed8",
  "#f97316",
  "#ef4444",
  "#121217",
] as const;

const createSvgDataUri = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const sticker = (svg: string) => createSvgDataUri(svg);

export const EFFECT_ASSETS: EffectAsset[] = [
  {
    id: "spark-burst",
    label: "Spark Burst",
    kind: "sticker",
    defaultSize: 0.2,
    src: sticker(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <path fill="#FFD84D" d="M128 12l24 71 76 17-58 47 8 78-50-37-50 37 8-78-58-47 76-17z"/>
        <circle cx="128" cy="128" r="34" fill="#FFF6BF"/>
      </svg>
    `),
  },
  {
    id: "heart-pop",
    label: "Heart Pop",
    kind: "sticker",
    defaultSize: 0.2,
    src: sticker(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <path fill="#FF5D8F" d="M128 224 39 132C18 111 18 77 39 56c21-21 55-21 76 0l13 13 13-13c21-21 55-21 76 0 21 21 21 55 0 76z"/>
        <circle cx="92" cy="96" r="14" fill="#FFC4D7"/>
      </svg>
    `),
  },
  {
    id: "speech-bubble",
    label: "Speech Bubble",
    kind: "sticker",
    defaultSize: 0.22,
    src: sticker(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <rect x="28" y="40" width="200" height="140" rx="42" fill="#8B5CF6"/>
        <path fill="#8B5CF6" d="M88 180 68 228l57-34z"/>
        <circle cx="90" cy="110" r="10" fill="#F8F7FF"/>
        <circle cx="128" cy="110" r="10" fill="#F8F7FF"/>
        <circle cx="166" cy="110" r="10" fill="#F8F7FF"/>
      </svg>
    `),
  },
  {
    id: "sun-badge",
    label: "Sun Badge",
    kind: "sticker",
    defaultSize: 0.2,
    src: sticker(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <circle cx="128" cy="128" r="58" fill="#F59E0B"/>
        <circle cx="128" cy="128" r="34" fill="#FFF0B8"/>
        <g stroke="#F59E0B" stroke-width="16" stroke-linecap="round">
          <path d="M128 18v30M128 208v30M18 128h30M208 128h30M50 50l22 22M184 184l22 22M206 50l-22 22M72 184l-22 22"/>
        </g>
      </svg>
    `),
  },
  {
    id: "camera",
    label: "Camera",
    kind: "icon",
    defaultSize: 0.16,
    src: sticker(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <rect x="30" y="64" width="196" height="128" rx="28" fill="#111827"/>
        <path fill="#374151" d="M78 52h46l16 18H62z"/>
        <circle cx="128" cy="128" r="44" fill="#9CA3AF"/>
        <circle cx="128" cy="128" r="24" fill="#F9FAFB"/>
      </svg>
    `),
  },
  {
    id: "pin",
    label: "Location Pin",
    kind: "icon",
    defaultSize: 0.16,
    src: sticker(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <path fill="#EF4444" d="M128 236s74-74 74-130a74 74 0 1 0-148 0c0 56 74 130 74 130z"/>
        <circle cx="128" cy="106" r="28" fill="#FEE2E2"/>
      </svg>
    `),
  },
  {
    id: "bolt",
    label: "Bolt",
    kind: "icon",
    defaultSize: 0.16,
    src: sticker(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <path fill="#FBBF24" d="M150 18 58 142h56l-8 96 92-124h-56z"/>
      </svg>
    `),
  },
  {
    id: "star",
    label: "Star",
    kind: "icon",
    defaultSize: 0.16,
    src: sticker(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <path fill="#38BDF8" d="M128 24l29 68 75 7-57 47 18 72-65-39-65 39 18-72-57-47 75-7z"/>
      </svg>
    `),
  },
];

export const STICKER_ASSETS = EFFECT_ASSETS.filter(
  (asset) => asset.kind === "sticker",
);

export const ICON_ASSETS = EFFECT_ASSETS.filter((asset) => asset.kind === "icon");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const normalizeHexColor = (value: string) => {
  const sanitized = value.trim().toLowerCase();

  if (/^#[0-9a-f]{6}$/.test(sanitized)) {
    return sanitized;
  }

  if (/^#[0-9a-f]{3}$/.test(sanitized)) {
    return `#${sanitized
      .slice(1)
      .split("")
      .map((char) => char + char)
      .join("")}`;
  }

  return DEFAULT_DOCUMENT.bg.fill;
};

export const cloneEditorDocument = (document: EditorDocument): EditorDocument => ({
  v: 1,
  bg: {
    fill: document.bg.fill,
  },
  items: document.items.map((item) => ({ ...item })),
});

export const createEditorCanvas = (
  id: string,
  ratio: AspectRatioPreset = DEFAULT_ASPECT_RATIO,
  document: EditorDocument = DEFAULT_DOCUMENT,
): EditorCanvas => ({
  id,
  ratio,
  document: cloneEditorDocument(document),
});

export const createEditorStateSnapshot = (
  canvas: EditorCanvas = createEditorCanvas(DEFAULT_CANVAS_ID),
): EditorStateSnapshot => ({
  v: 2,
  activeCanvasId: canvas.id,
  canvases: [canvas],
});

export const isAspectRatioPreset = (value: string): value is AspectRatioPreset =>
  ASPECT_RATIO_PRESETS.includes(value as AspectRatioPreset);

export const findEffectAssetById = (id: string) =>
  EFFECT_ASSETS.find((asset) => asset.id === id) ?? null;

export const isAssetDragPayload = (value: unknown): value is AssetDragPayload =>
  isRecord(value) &&
  (value.type === "sticker" || value.type === "icon") &&
  typeof value.sourceId === "string";

const validateCanvasItem = (value: unknown): CanvasItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    (value.type !== "sticker" && value.type !== "icon") ||
    typeof value.sourceId !== "string" ||
    !isFiniteNumber(value.x) ||
    !isFiniteNumber(value.y) ||
    !isFiniteNumber(value.w) ||
    !isFiniteNumber(value.h)
  ) {
    return null;
  }

  return {
    id: value.id,
    type: value.type,
    sourceId: value.sourceId,
    x: clamp(value.x, 0, 1),
    y: clamp(value.y, 0, 1),
    w: clamp(value.w, 0.05, 1),
    h: clamp(value.h, 0.05, 1),
    rotation: isFiniteNumber(value.rotation) ? value.rotation : 0,
    z: isFiniteNumber(value.z) ? value.z : 0,
  };
};

export const validateEditorDocument = (value: unknown): EditorDocument | null => {
  if (!isRecord(value) || value.v !== 1 || !isRecord(value.bg)) {
    return null;
  }

  if (typeof value.bg.fill !== "string" || !Array.isArray(value.items)) {
    return null;
  }

  const items = value.items
    .map((item) => validateCanvasItem(item))
    .filter((item): item is CanvasItem => item !== null);

  return {
    v: 1,
    bg: {
      fill: normalizeHexColor(value.bg.fill),
    },
    items,
  };
};

const validateEditorCanvas = (value: unknown): EditorCanvas | null => {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.ratio !== "string") {
    return null;
  }

  if (!isAspectRatioPreset(value.ratio)) {
    return null;
  }

  const document = validateEditorDocument(value.document);

  if (!document) {
    return null;
  }

  return {
    id: value.id,
    ratio: value.ratio,
    document,
  };
};

export const validateEditorStateSnapshot = (
  value: unknown,
): EditorStateSnapshot | null => {
  if (
    !isRecord(value) ||
    value.v !== 2 ||
    typeof value.activeCanvasId !== "string" ||
    !Array.isArray(value.canvases)
  ) {
    return null;
  }

  const canvases = value.canvases
    .map((canvas) => validateEditorCanvas(canvas))
    .filter((canvas): canvas is EditorCanvas => canvas !== null);

  if (
    canvases.length === 0 ||
    !canvases.some((canvas) => canvas.id === value.activeCanvasId)
  ) {
    return null;
  }

  return {
    v: 2,
    activeCanvasId: value.activeCanvasId,
    canvases,
  };
};

export const resizeDocumentForAspectRatio = (
  document: EditorDocument,
  fromRatio: AspectRatioPreset,
  toRatio: AspectRatioPreset,
): EditorDocument => {
  if (fromRatio === toRatio) {
    return cloneEditorDocument(document);
  }

  const fromSize = ASPECT_RATIO_DIMENSIONS[fromRatio];
  const toSize = ASPECT_RATIO_DIMENSIONS[toRatio];

  return {
    ...cloneEditorDocument(document),
    items: document.items.map((item) => {
      const width = clamp((item.w * fromSize.width) / toSize.width, 0.05, 1);
      const height = clamp((item.h * fromSize.height) / toSize.height, 0.05, 1);
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      const x = clamp((item.x * fromSize.width) / toSize.width, halfWidth, 1 - halfWidth);
      const y = clamp(
        (item.y * fromSize.height) / toSize.height,
        halfHeight,
        1 - halfHeight,
      );

      return {
        ...item,
        x,
        y,
        w: width,
        h: height,
      };
    }),
  };
};

export const parseEditorDocument = (value: string) => {
  try {
    return validateEditorDocument(JSON.parse(value));
  } catch {
    return null;
  }
};

export const serializeEditorDocument = (value: EditorDocument) =>
  JSON.stringify(value);

export const parseEditorStateSnapshot = (value: string) => {
  try {
    return validateEditorStateSnapshot(JSON.parse(value));
  } catch {
    return null;
  }
};

export const serializeEditorStateSnapshot = (value: EditorStateSnapshot) =>
  JSON.stringify(value);
