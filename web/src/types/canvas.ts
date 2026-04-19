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

export type BoardTextAlign = "left" | "center" | "right";

export type BoardImagePositionPreset =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right";

export type CanvasFrame = {
  id: string;
  title: string;
  width: number;
  height: number;
  presetId?: CanvasPresetId | null;
  background: string;
  backgroundPresetId: string;
  images: BoardImageItem[];
  texts: BoardTextItem[];
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

export type BoardTextItem = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: BoardTextAlign;
  maxWidth: number;
};

export type BoardTextInput = Omit<BoardTextItem, "id" | "x" | "y"> &
  Partial<Pick<BoardTextItem, "x" | "y">>;

export type CanvasShell = Omit<
  CanvasFrame,
  "images" | "texts"
>;
