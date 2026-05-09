// Review note: Configuration store and lookup helpers for presets, backgrounds, and default text settings.
// The comments in this file are intentionally dense to support the requested review pass.

import { create } from "zustand";

import { DEFAULT_CANVAS_BACKGROUND_EFFECTS } from "@/canvas/backgroundEffects";
import {
  createCanvasBackgroundFromPreset,
  normalizeCanvasBackgroundPresetValue,
} from "@/canvas/backgrounds";
import {
  BOARD_CONFIG,
  type BoardLayoutConfig,
  type BoardTextConfig,
} from "@/config/config";
import type {
  BoardTextInput,
  CanvasBackgroundPreset,
  CanvasBackgroundPresetGroup,
  CanvasBackgroundValue,
  CanvasFrame,
  CanvasPreset,
  CanvasPresetGroup,
  CanvasPresetGroupId,
  CanvasPresetId,
  CanvasSize,
  ResolvedCanvasPreset,
} from "@/types/canvas";

/**
 * Documents the config state contract used by the surrounding feature.
 */
type ConfigState = {
  layout: BoardLayoutConfig;
  text: BoardTextConfig;
  defaultCanvasPresetId: CanvasPresetId;
  defaultBackgroundPresetId: string;
  canvasPresetGroups: CanvasPresetGroup[];
  canvasPresets: CanvasPreset[];
  canvasPresetGroupIcons: Record<CanvasPresetGroupId, string>;
  canvasBackgroundPresetGroups: CanvasBackgroundPresetGroup[];
  canvasBackgroundPresets: CanvasBackgroundPreset[];
};

/**
 * Documents the config actions contract used by the surrounding feature.
 */
type ConfigActions = {
  setDefaultCanvasPresetId: (presetId: CanvasPresetId) => void;
  setDefaultBackgroundPresetId: (presetId: string) => void;
  resetConfigDefaults: () => void;
};

/**
 * Normalizes normalize presets before the value is stored or rendered.
 */
const normalizePresets = (groups: CanvasPresetGroup[]) =>
  groups.flatMap((group) => group.presets);

/**
 * Normalizes normalize background preset groups before the value is stored or rendered.
 */
const normalizeBackgroundPresetGroups = (
  groups: CanvasBackgroundPresetGroup[],
) =>
  groups.map((group) => ({
    ...group,
    presets: group.presets.map((preset) => ({
      ...preset,
      value: normalizeCanvasBackgroundPresetValue(preset.value),
    })),
  }));

/**
 * Handles the flatten background preset groups behavior for this module.
 */
const flattenBackgroundPresetGroups = (groups: CanvasBackgroundPresetGroup[]) =>
  groups.flatMap((group) => group.presets);

/**
 * Keeps normalized_background_preset_groups in one named constant so related calculations stay consistent.
 */
const NORMALIZED_BACKGROUND_PRESET_GROUPS = normalizeBackgroundPresetGroups(
  BOARD_CONFIG.canvasBackgroundPresetGroups,
);

/**
 * Builds create default text input from normalized inputs.
 */
const createDefaultTextInput = (): BoardTextInput => ({
  ...BOARD_CONFIG.text.defaultInput,
});

/**
 * Normalizes normalize board text family internal before the value is stored or rendered.
 */
const normalizeBoardTextFamilyInternal = (value: string) =>
  value
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\s+/g, " ");

/**
 * Exposes static editor configuration through a Zustand store and selector hooks.
 */
export const useConfigStore = create<ConfigState & ConfigActions>((set) => ({
  layout: BOARD_CONFIG.layout,
  text: BOARD_CONFIG.text,
  defaultCanvasPresetId: BOARD_CONFIG.defaults.canvasPresetId,
  defaultBackgroundPresetId: BOARD_CONFIG.defaults.backgroundPresetId,
  canvasPresetGroups: BOARD_CONFIG.canvasPresetGroups,
  canvasPresets: normalizePresets(BOARD_CONFIG.canvasPresetGroups),
  canvasPresetGroupIcons: BOARD_CONFIG.canvasPresetGroupIcons,
  canvasBackgroundPresetGroups: NORMALIZED_BACKGROUND_PRESET_GROUPS,
  canvasBackgroundPresets: flattenBackgroundPresetGroups(
    NORMALIZED_BACKGROUND_PRESET_GROUPS,
  ),

  setDefaultCanvasPresetId: (presetId) =>
    set({ defaultCanvasPresetId: presetId }),
  setDefaultBackgroundPresetId: (presetId) =>
    set({ defaultBackgroundPresetId: presetId }),
  resetConfigDefaults: () =>
    set({
      defaultCanvasPresetId: BOARD_CONFIG.defaults.canvasPresetId,
      defaultBackgroundPresetId: BOARD_CONFIG.defaults.backgroundPresetId,
    }),
}));

/**
 * Resolves get config state from the available editor state.
 */
const getConfigState = () => useConfigStore.getState();

/**
 * Normalizes font family choices back to a supported configured family.
 */
export const normalizeBoardTextFamily = (value: string) =>
  normalizeBoardTextFamilyInternal(value);

/**
 * Returns a fresh default text input object for insertion flows.
 */
export const getDefaultBoardTextInput = () => createDefaultTextInput();

/**
 * Selects text configuration for panels that render font controls.
 */
export const useTextConfig = () => useConfigStore((state) => state.text);

/**
 * Selects grouped canvas presets for preset controls.
 */
export const useCanvasPresetGroups = () =>
  useConfigStore((state) => state.canvasPresetGroups);

/**
 * Selects flattened background presets for lookup-heavy consumers.
 */
export const useCanvasBackgroundPresets = () =>
  useConfigStore((state) => state.canvasBackgroundPresets);

/**
 * Selects grouped background presets for the background panel.
 */
export const useCanvasBackgroundPresetGroups = () =>
  useConfigStore((state) => state.canvasBackgroundPresetGroups);

/**
 * Resolves find canvas preset by id from the available editor state.
 */
export const findCanvasPresetById = (
  presetId: CanvasPresetId | null | undefined,
) =>
  presetId
    ? (getConfigState().canvasPresets.find(
        (preset) => preset.id === presetId,
      ) ?? null)
    : null;

/**
 * Resolves get canvas preset by id from the available editor state.
 */
export const getCanvasPresetById = (presetId: CanvasPresetId) =>
  findCanvasPresetById(presetId) ?? getConfigState().canvasPresets[0];

/**
 * Resolves get canvas preset group by id from the available editor state.
 */
export const getCanvasPresetGroupById = (groupId: CanvasPresetGroupId) =>
  getConfigState().canvasPresetGroups.find((group) => group.id === groupId) ??
  getConfigState().canvasPresetGroups[0];

/**
 * Resolves get canvas preset group icon from the available editor state.
 */
export const getCanvasPresetGroupIcon = (groupId: CanvasPresetGroupId) =>
  getConfigState().canvasPresetGroupIcons[groupId];

/**
 * Resolves get canvas preset by size from the available editor state.
 */
export const getCanvasPresetBySize = ({ width, height }: CanvasSize) =>
  getConfigState().canvasPresets.find(
    (preset) => preset.size.width === width && preset.size.height === height,
  );

/**
 * Resolves resolve canvas preset from the available editor state.
 */
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
    // Return the resolved value to the caller after all guards and transformations.
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

/**
 * Resolves get canvas background by id from the available editor state.
 */
export const getCanvasBackgroundById = (presetId: string) =>
  getConfigState().canvasBackgroundPresets.find(
    (preset) => preset.id === presetId,
  ) ?? getConfigState().canvasBackgroundPresets[0];

/**
 * Resolves find canvas background by id from the available editor state.
 */
export const findCanvasBackgroundById = (
  presetId: string | null | undefined,
) =>
  presetId
    ? (getConfigState().canvasBackgroundPresets.find(
        (preset) => preset.id === presetId,
      ) ?? null)
    : null;

/**
 * Resolves get canvas background value by id from the available editor state.
 */
export const getCanvasBackgroundValueById = (
  presetId: string | null | undefined,
): CanvasBackgroundValue | null => {
  const preset = findCanvasBackgroundById(presetId);

  return preset ? createCanvasBackgroundFromPreset(preset) : null;
};

/**
 * Creates a normalized canvas frame from a preset, title, and default background.
 */
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
    layoutAxisMode: "none",
    background: createCanvasBackgroundFromPreset(backgroundPreset),
    backgroundPresetId: backgroundPreset.id,
    backgroundEffects: { ...DEFAULT_CANVAS_BACKGROUND_EFFECTS },
    objectOrder: [],
    images: [],
    texts: [],
  };
};
