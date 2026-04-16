export type CanvasSize = {
  width: number;
  height: number;
};

export type CanvasPresetId = "square" | "landscape" | "portrait" | "custom";

export type CanvasPreset = {
  id: CanvasPresetId;
  label: string;
  size?: CanvasSize;
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
  background: string;
  backgroundPresetId: string;
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
