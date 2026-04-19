import { create } from "zustand";

import type {
  CanvasBackgroundPreset,
  CanvasFrame,
  CanvasPreset,
  CanvasPresetGroup,
  CanvasPresetGroupId,
  CanvasPresetId,
  CanvasSize,
  ResolvedCanvasPreset,
} from "@/types/canvas";

type ConfigState = {
  defaultCanvasPresetId: CanvasPresetId;
  defaultBackgroundPresetId: string;
  canvasPresetGroups: CanvasPresetGroup[];
  canvasPresets: CanvasPreset[];
  canvasBackgroundPresets: CanvasBackgroundPreset[];
  canvasPresetGroupIcons: Record<CanvasPresetGroupId, string>;
};

const canvasPresetGroups: CanvasPresetGroup[] = [
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
  {
    id: "instagram",
    label: "Instagram",
    presets: [
      {
        id: "instagram-square-post",
        groupId: "instagram",
        label: "Square Post",
        size: { width: 1080, height: 1080 },
      },
      {
        id: "instagram-portrait-post",
        groupId: "instagram",
        label: "Portrait Post",
        size: { width: 1080, height: 1350 },
      },
      {
        id: "instagram-story",
        groupId: "instagram",
        label: "Story",
        size: { width: 1080, height: 1920 },
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
        label: "Landscape Post",
        size: { width: 1200, height: 628 },
      },
      {
        id: "linkedin-square-post",
        groupId: "linkedin",
        label: "Square Post",
        size: { width: 1200, height: 1200 },
      },
    ],
  },
];

const canvasPresets = canvasPresetGroups.flatMap((group) => group.presets);

const canvasBackgroundPresets: CanvasBackgroundPreset[] = [
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

export const DEFAULT_CANVAS_PRESET_ID: CanvasPresetId = "general-square";
export const DEFAULT_BACKGROUND_PRESET_ID = "solid-white";

export const useConfigStore = create<ConfigState>(() => ({
  defaultCanvasPresetId: DEFAULT_CANVAS_PRESET_ID,
  defaultBackgroundPresetId: DEFAULT_BACKGROUND_PRESET_ID,
  canvasPresetGroups,
  canvasPresets,
  canvasBackgroundPresets,
  canvasPresetGroupIcons: {
    twitter: "ri:twitter-x-fill",
    linkedin: "mdi:linkedin",
    instagram: "mdi:instagram",
    pinterest: "mdi:pinterest",
    general: "solar:ruler-angular-linear",
  },
}));

const getConfigState = () => useConfigStore.getState();

export const useCanvasPresetGroups = () =>
  useConfigStore((state) => state.canvasPresetGroups);

export const useCanvasBackgroundPresets = () =>
  useConfigStore((state) => state.canvasBackgroundPresets);

export const findCanvasPresetById = (
  presetId: CanvasPresetId | null | undefined,
) =>
  presetId
    ? (getConfigState().canvasPresets.find((preset) => preset.id === presetId) ?? null)
    : null;

export const getCanvasPresetById = (presetId: CanvasPresetId) =>
  findCanvasPresetById(presetId) ?? getConfigState().canvasPresets[0];

export const getCanvasPresetGroupById = (groupId: CanvasPresetGroupId) =>
  getConfigState().canvasPresetGroups.find((group) => group.id === groupId) ??
  getConfigState().canvasPresetGroups[0];

export const getCanvasPresetGroupIcon = (groupId: CanvasPresetGroupId) =>
  getConfigState().canvasPresetGroupIcons[groupId];

export const getCanvasPresetBySize = ({ width, height }: CanvasSize) =>
  getConfigState().canvasPresets.find(
    (preset) => preset.size.width === width && preset.size.height === height,
  );

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
  getConfigState().canvasBackgroundPresets.find((preset) => preset.id === presetId) ??
  getConfigState().canvasBackgroundPresets[0];

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
    texts: [],
  };
};
