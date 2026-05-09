export type BackgroundPreset = {
  id: string;
  label: string;
  background: string;
};

export type BackgroundPresetCategory = {
  id: string;
  label: string;
  presets: BackgroundPreset[];
};

export const BACKGROUND_PRESET_CATEGORIES = [
  {
    id: "solid",
    label: "Solid",
    presets: [
      {
        id: "canvas-white",
        label: "White",
        background: "#ffffff",
      },
      {
        id: "graphite",
        label: "Graphite",
        background: "#1e1e1e",
      },
    ],
  },
  {
    id: "gradients",
    label: "Gradients",
    presets: [
      {
        id: "aurora",
        label: "Aurora",
        background:
          "linear-gradient(135deg, #f7e8ff 0%, #bcd7ff 48%, #9ff4d5 100%)",
      },
      {
        id: "blush",
        label: "Blush",
        background:
          "linear-gradient(135deg, #fff1e6 0%, #f8c7d8 44%, #c58cff 100%)",
      },

      {
        id: "duskline",
        label: "Duskline",
        background:
          "linear-gradient(145deg, #1e1f4b 0%, #5a2a7a 46%, #f06c54 100%)",
      },
      {
        id: "tropic",
        label: "Tropic",
        background:
          "linear-gradient(135deg, #083d77 0%, #2bb3c0 52%, #d9f7a6 100%)",
      },
    ],
  },
] satisfies BackgroundPresetCategory[];

export const BACKGROUND_PRESETS = BACKGROUND_PRESET_CATEGORIES.flatMap(
  (category) => category.presets,
);

export const DEFAULT_BACKGROUND_PRESET_ID = BACKGROUND_PRESETS[0].id;

export const getBackgroundPresetById = (presetId: string) =>
  BACKGROUND_PRESETS.find((preset) => preset.id === presetId) ??
  BACKGROUND_PRESETS[0];
