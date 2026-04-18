import type {
  CanvasBackgroundPreset,
  CanvasFrame,
  CanvasPresetGroup,
  CanvasPresetGroupId,
  CanvasPreset,
  CanvasPresetId,
  CanvasSize,
  ResolvedCanvasPreset,
} from "@/types/canvas";

export const DEFAULT_ACCESS_PANEL_WIDTH = 80;
export const DEFAULT_DESIGN_PANEL_WIDTH = 352;
export const DEFAULT_SIDEBAR_WIDTH =
  DEFAULT_ACCESS_PANEL_WIDTH + DEFAULT_DESIGN_PANEL_WIDTH;
export const MIN_SIDEBAR_WIDTH = 352;
export const MAX_SIDEBAR_WIDTH = 448;

export const CANVAS_PRESET_GROUPS: CanvasPresetGroup[] = [
  {
    id: "twitter",
    label: "Twitter",
    presets: [
      {
        id: "twitter-square-post",
        groupId: "twitter",
        label: "Square",
        size: { width: 1200, height: 1200 },
      },
      {
        id: "twitter-landscape-post",
        groupId: "twitter",
        label: "Landscape",
        size: { width: 1200, height: 628 },
      },
    ],
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    presets: [
      {
        id: "linkedin-landscape-post",
        groupId: "linkedin",
        label: "Landscape",
        size: { width: 1200, height: 628 },
      },
      {
        id: "linkedin-square-post",
        groupId: "linkedin",
        label: "Square",
        size: { width: 1200, height: 1200 },
      },
      {
        id: "linkedin-portrait-post",
        groupId: "linkedin",
        label: "Portrait",
        size: { width: 720, height: 900 },
      },
    ],
  },
  {
    id: "instagram",
    label: "Instagram",
    presets: [
      {
        id: "instagram-landscape-post",
        groupId: "instagram",
        label: "Landscape",
        size: { width: 1080, height: 566 },
      },
      {
        id: "instagram-square-post",
        groupId: "instagram",
        label: "Square",
        size: { width: 1080, height: 1080 },
      },
      {
        id: "instagram-portrait-post",
        groupId: "instagram",
        label: "Portrait",
        size: { width: 1080, height: 1350 },
      },
      {
        id: "instagram-full-portrait-post",
        groupId: "instagram",
        label: "Full Portrait",
        size: { width: 1080, height: 1440 },
      },
    ],
  },
  {
    id: "pinterest",
    label: "Pinterest",
    presets: [
      {
        id: "pinterest-standard-pin",
        groupId: "pinterest",
        label: "Standard",
        size: { width: 1000, height: 1500 },
      },
      {
        id: "pinterest-square-pin",
        groupId: "pinterest",
        label: "Square",
        size: { width: 1000, height: 1000 },
      },
    ],
  },
  {
    id: "general",
    label: "General",
    presets: [
      {
        id: "general-square",
        groupId: "general",
        label: "Square",
        size: { width: 500, height: 500 },
      },
      {
        id: "general-landscape",
        groupId: "general",
        label: "Landscape",
        size: { width: 640, height: 360 },
      },
      {
        id: "general-portrait",
        groupId: "general",
        label: "Portrait",
        size: { width: 360, height: 640 },
      },
    ],
  },
];

export const CANVAS_PRESETS: CanvasPreset[] = CANVAS_PRESET_GROUPS.flatMap(
  (group) => group.presets,
);

export const DEFAULT_CANVAS_PRESET_ID: CanvasPresetId = "general-square";
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

export const findCanvasPresetById = (presetId: CanvasPresetId | null | undefined) =>
  presetId ? CANVAS_PRESETS.find((preset) => preset.id === presetId) ?? null : null;

export const getCanvasPresetById = (presetId: CanvasPresetId) =>
  findCanvasPresetById(presetId) ?? CANVAS_PRESETS[0];

export const getCanvasPresetGroupById = (groupId: CanvasPresetGroupId) =>
  CANVAS_PRESET_GROUPS.find((group) => group.id === groupId) ?? CANVAS_PRESET_GROUPS[0];

export const getCanvasPresetGroupIcon = (groupId: CanvasPresetGroupId) =>
  (
    {
      twitter: "ri:twitter-x-fill",
      linkedin: "mdi:linkedin",
      instagram: "mdi:instagram",
      pinterest: "mdi:pinterest",
      general: "solar:ruler-angular-linear",
    } satisfies Record<CanvasPresetGroupId, string>
  )[groupId];

export const getCanvasPresetBySize = ({ width, height }: CanvasSize) =>
  CANVAS_PRESETS.find((preset) => preset.size.width === width && preset.size.height === height);

export const resolveCanvasPreset = ({
  width,
  height,
  presetId = null,
}: CanvasSize & { presetId?: CanvasPresetId | null }): ResolvedCanvasPreset => {
  const presetFromId = findCanvasPresetById(presetId);
  const preset =
    presetFromId &&
    presetFromId.size.width === width &&
    presetFromId.size.height === height
      ? presetFromId
      : getCanvasPresetBySize({ width, height });
  if (!preset) {
    return {
      kind: "custom",
      size: { width, height },
    };
  }

  return {
    kind: "preset",
    preset,
    group: getCanvasPresetGroupById(preset.groupId),
  };
};

export const getCanvasBackgroundById = (presetId: string) =>
  CANVAS_BACKGROUND_PRESETS.find((preset) => preset.id === presetId) ??
  CANVAS_BACKGROUND_PRESETS[0];

export const createCanvasFrame = (
  size: CanvasSize,
  backgroundPresetId: string = DEFAULT_BACKGROUND_PRESET_ID,
  presetId: CanvasPresetId | null = DEFAULT_CANVAS_PRESET_ID,
  title: string = "Canvas",
): CanvasFrame => {
  const backgroundPreset = getCanvasBackgroundById(backgroundPresetId);

  return {
    id: crypto.randomUUID(),
    title,
    width: size.width,
    height: size.height,
    presetId,
    background: backgroundPreset.value,
    backgroundPresetId: backgroundPreset.id,
    images: [],
  };
};
