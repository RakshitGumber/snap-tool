import type {
  CanvasBackgroundPreset,
  CanvasFrame,
  CanvasPreset,
  CanvasPresetId,
  CanvasSize,
} from "@/types/canvas";

export const MIN_ZOOM = 0.35;
export const MAX_ZOOM = 2.25;
export const SNAP_THRESHOLD = 16;
export const SNAP_GAP = 40;
export const FIT_PADDING = 48;

export const DEFAULT_ACCESS_PANEL_WIDTH = 80;
export const DEFAULT_DESIGN_PANEL_WIDTH = 352;
export const DEFAULT_SIDEBAR_WIDTH =
  DEFAULT_ACCESS_PANEL_WIDTH + DEFAULT_DESIGN_PANEL_WIDTH;
export const MIN_SIDEBAR_WIDTH = 352;
export const MAX_SIDEBAR_WIDTH = 448;

export const CANVAS_PRESETS: CanvasPreset[] = [
  {
    id: "square",
    label: "square",
    size: { width: 500, height: 500 },
  },
  {
    id: "landscape",
    label: "landscape",
    size: { width: 640, height: 360 },
  },
  {
    id: "portrait",
    label: "portrait",
    size: { width: 360, height: 640 },
  },
  {
    id: "custom",
    label: "custom",
  },
];

export const DEFAULT_CANVAS_PRESET_ID: CanvasPresetId = "square";
export const DEFAULT_BACKGROUND_PRESET_ID = "solid-white";

export const CANVAS_BACKGROUND_PRESETS: CanvasBackgroundPreset[] = [
  {
    id: "solid-white",
    label: "White",
    kind: "solid",
    value: "#FFFFFF",
    preview: "#FFFFFF",
  },
  {
    id: "solid-slate",
    label: "Soft slate",
    kind: "solid",
    value: "#F4F6FF",
    preview: "#F4F6FF",
  },
  {
    id: "solid-ink",
    label: "Ink",
    kind: "solid",
    value: "#1A1A1E",
    preview: "#1A1A1E",
  },
  {
    id: "solid-mint",
    label: "Mint",
    kind: "solid",
    value: "#E8FFF4",
    preview: "#E8FFF4",
  },
  {
    id: "gradient-cloud",
    label: "Cloud",
    kind: "gradient",
    value: "linear-gradient(135deg, #FFFFFF 0%, #F4F6FF 100%)",
    preview: "linear-gradient(135deg, #FFFFFF 0%, #F4F6FF 100%)",
  },
  {
    id: "gradient-fresh",
    label: "Fresh",
    kind: "gradient",
    value: "linear-gradient(135deg, #E8FFF4 0%, #BDEED9 100%)",
    preview: "linear-gradient(135deg, #E8FFF4 0%, #BDEED9 100%)",
  },
  {
    id: "gradient-warm",
    label: "Warm",
    kind: "gradient",
    value: "linear-gradient(135deg, #FFF3E8 0%, #FFD8B5 100%)",
    preview: "linear-gradient(135deg, #FFF3E8 0%, #FFD8B5 100%)",
  },
  {
    id: "gradient-night",
    label: "Night",
    kind: "gradient",
    value: "linear-gradient(135deg, #1A1A1E 0%, #33333C 100%)",
    preview: "linear-gradient(135deg, #1A1A1E 0%, #33333C 100%)",
  },
];

export const getCanvasPresetById = (presetId: CanvasPresetId) =>
  CANVAS_PRESETS.find((preset) => preset.id === presetId) ?? CANVAS_PRESETS[0];

export const getCanvasPresetIdFromSize = ({
  width,
  height,
}: CanvasSize): CanvasPresetId => {
  const match = CANVAS_PRESETS.find(
    (preset) => preset.size?.width === width && preset.size?.height === height,
  );

  return match?.id ?? "custom";
};

export const getCanvasBackgroundById = (presetId: string) =>
  CANVAS_BACKGROUND_PRESETS.find((preset) => preset.id === presetId) ??
  CANVAS_BACKGROUND_PRESETS[0];

export const createCanvasFrame = (
  size: CanvasSize,
  position: { x: number; y: number },
  index: number,
  backgroundPresetId: string = DEFAULT_BACKGROUND_PRESET_ID,
): CanvasFrame => {
  const backgroundPreset = getCanvasBackgroundById(backgroundPresetId);

  return {
    id: crypto.randomUUID(),
    title: `Canvas ${index + 1}`,
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
    background: backgroundPreset.value,
    backgroundPresetId: backgroundPreset.id,
    images: [],
  };
};
