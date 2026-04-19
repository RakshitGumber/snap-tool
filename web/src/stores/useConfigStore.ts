import { create } from "zustand";

import { BOARD_CONFIG, type BoardLayoutConfig, type BoardTextConfig } from "@/config";
import type {
  BoardTextInput,
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
  layout: BoardLayoutConfig;
  text: BoardTextConfig;
  defaultCanvasPresetId: CanvasPresetId;
  defaultBackgroundPresetId: string;
  canvasPresetGroups: CanvasPresetGroup[];
  canvasPresets: CanvasPreset[];
  canvasPresetGroupIcons: Record<CanvasPresetGroupId, string>;
  canvasBackgroundPresets: CanvasBackgroundPreset[];
};

type ConfigActions = {
  setDefaultCanvasPresetId: (presetId: CanvasPresetId) => void;
  setDefaultBackgroundPresetId: (presetId: string) => void;
  resetConfigDefaults: () => void;
};

const normalizePresets = (groups: CanvasPresetGroup[]) =>
  groups.flatMap((group) => group.presets);

const createDefaultTextInput = (): BoardTextInput => ({
  ...BOARD_CONFIG.text.defaultInput,
});

const normalizeBoardTextFamilyInternal = (value: string) =>
  value
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\s+/g, " ");

export const useConfigStore = create<ConfigState & ConfigActions>((set) => ({
  layout: BOARD_CONFIG.layout,
  text: BOARD_CONFIG.text,
  defaultCanvasPresetId: BOARD_CONFIG.defaults.canvasPresetId,
  defaultBackgroundPresetId: BOARD_CONFIG.defaults.backgroundPresetId,
  canvasPresetGroups: BOARD_CONFIG.canvasPresetGroups,
  canvasPresets: normalizePresets(BOARD_CONFIG.canvasPresetGroups),
  canvasPresetGroupIcons: BOARD_CONFIG.canvasPresetGroupIcons,
  canvasBackgroundPresets: BOARD_CONFIG.canvasBackgroundPresets,

  setDefaultCanvasPresetId: (presetId) => set({ defaultCanvasPresetId: presetId }),
  setDefaultBackgroundPresetId: (presetId) =>
    set({ defaultBackgroundPresetId: presetId }),
  resetConfigDefaults: () =>
    set({
      defaultCanvasPresetId: BOARD_CONFIG.defaults.canvasPresetId,
      defaultBackgroundPresetId: BOARD_CONFIG.defaults.backgroundPresetId,
    }),
}));

const getConfigState = () => useConfigStore.getState();

export const normalizeBoardTextFamily = (value: string) =>
  normalizeBoardTextFamilyInternal(value);

export const getDefaultBoardTextInput = () => createDefaultTextInput();

export const useLayoutConfig = () => useConfigStore((state) => state.layout);

export const useTextConfig = () => useConfigStore((state) => state.text);

export const useConfigDefaults = () =>
  useConfigStore((state) => ({
    defaultCanvasPresetId: state.defaultCanvasPresetId,
    defaultBackgroundPresetId: state.defaultBackgroundPresetId,
  }));

export const useCanvasPresetGroups = () =>
  useConfigStore((state) => state.canvasPresetGroups);

export const useCanvasBackgroundPresets = () =>
  useConfigStore((state) => state.canvasBackgroundPresets);

export const useCanvasPresetGroupIcons = () =>
  useConfigStore((state) => state.canvasPresetGroupIcons);

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
  backgroundPresetId: string = getConfigState().defaultBackgroundPresetId,
  presetId: CanvasPresetId | null = getConfigState().defaultCanvasPresetId,
  title: string = BOARD_CONFIG.defaults.canvasTitle,
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
