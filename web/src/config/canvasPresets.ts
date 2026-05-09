export type CanvasSize = {
  width: number;
  height: number;
};

export type CanvasPreset = {
  id: string;
  label: string;
  size: CanvasSize;
};

export type CanvasPresetCategory = {
  id: string;
  label: string;
  presets: CanvasPreset[];
};

export const CANVAS_PRESET_CATEGORIES = [
  {
    id: "x",
    label: "X",
    presets: [
      {
        id: "x-landscape-post",
        label: "Landscape Post",
        size: { width: 1600, height: 900 },
      },
      {
        id: "x-square-post",
        label: "Square Post",
        size: { width: 1200, height: 1200 },
      },
      {
        id: "x-header",
        label: "Header",
        size: { width: 1500, height: 500 },
      },
    ],
  },
  {
    id: "instagram",
    label: "Instagram",
    presets: [
      {
        id: "instagram-square-post",
        label: "Square Post",
        size: { width: 1080, height: 1080 },
      },
      {
        id: "instagram-portrait-post",
        label: "Portrait Post",
        size: { width: 1080, height: 1350 },
      },
      {
        id: "instagram-story",
        label: "Story / Reel",
        size: { width: 1080, height: 1920 },
      },
    ],
  },
  {
    id: "facebook",
    label: "Facebook",
    presets: [
      {
        id: "facebook-square-post",
        label: "Square Post",
        size: { width: 1080, height: 1080 },
      },
      {
        id: "facebook-link-post",
        label: "Link Post",
        size: { width: 1200, height: 628 },
      },
      {
        id: "facebook-story",
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
        id: "linkedin-single-image",
        label: "Single Image",
        size: { width: 1200, height: 627 },
      },
    ],
  },
  {
    id: "pinterest",
    label: "Pinterest",
    presets: [
      {
        id: "pinterest-standard-pin",
        label: "Standard Pin",
        size: { width: 1000, height: 1500 },
      },
      {
        id: "pinterest-square-pin",
        label: "Square Pin",
        size: { width: 1000, height: 1000 },
      },
    ],
  },
] satisfies CanvasPresetCategory[];

export const CANVAS_PRESETS = CANVAS_PRESET_CATEGORIES.flatMap(
  (category) => category.presets,
);

export const DEFAULT_CANVAS_PRESET_ID = CANVAS_PRESETS[0].id;

export const getCanvasPresetById = (presetId: string) =>
  CANVAS_PRESETS.find((preset) => preset.id === presetId) ?? CANVAS_PRESETS[0];

export const getCanvasPresetCategoryByPresetId = (presetId: string) =>
  CANVAS_PRESET_CATEGORIES.find((category) =>
    category.presets.some((preset) => preset.id === presetId),
  ) ?? CANVAS_PRESET_CATEGORIES[0];
