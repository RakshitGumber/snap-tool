export type CanvasSize = {
  width: number;
  height: number;
};

export type CanvasPresetGroupId =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "pinterest"
  | "general";

export type CanvasPresetId = `${CanvasPresetGroupId}-${string}`;

export type CanvasPreset = {
  id: CanvasPresetId;
  groupId: CanvasPresetGroupId;
  label: string;
  size: CanvasSize;
};

export type CanvasPresetGroup = {
  id: CanvasPresetGroupId;
  label: string;
  presets: CanvasPreset[];
};

export type ResolvedCanvasPreset =
  | {
      kind: "preset";
      preset: CanvasPreset;
      group: CanvasPresetGroup;
    }
  | {
      kind: "custom";
      size: CanvasSize;
    };

export type CanvasBackgroundKind = "solid" | "gradient";

export type CanvasBackgroundPreset = {
  id: string;
  label: string;
  kind: CanvasBackgroundKind;
  value: string;
  preview: string;
};

export type CanvasFrame = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  presetId?: CanvasPresetId | null;
  background: string;
  backgroundPresetId: string;
  images: BoardImageItem[];
};

export type BoardImageItem = {
  id: string;
  assetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  alt: string;
};

export type CanvasRecord = Omit<CanvasFrame, "images"> & {
  presetId: CanvasPresetId | null;
  imageOrder: string[];
  imagesById: Record<string, BoardImageItem>;
};

export type BoardDocument = {
  canvasOrder: string[];
  canvasesById: Record<string, CanvasRecord>;
};

export type BoardSize = {
  width: number;
  height: number;
};

export type BoardViewport = {
  x: number;
  y: number;
  scale: number;
};

export type SnapMode = "gap" | "flush";

export type SnapGuide = {
  axis: "x" | "y";
  position: number;
  start: number;
  end: number;
  mode: SnapMode;
};

export type SnapPreview = {
  x: number;
  y: number;
  guides: SnapGuide[];
};

export type CanvasNavigationDirection = "next" | "prev" | "up" | "down";

export type CanvasActions = {
  delete: () => void;
  save: () => void;
  clear: () => void;
  focus: {
    this: () => void;
    next: () => void;
    prev: () => void;
    down: () => void;
    up: () => void;
  };
};

export type ShortcutMap = Record<string, () => void>;
