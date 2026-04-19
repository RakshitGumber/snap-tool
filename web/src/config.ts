import type {
  BoardTextInput,
  CanvasBackgroundPreset,
  CanvasPresetGroup,
  CanvasPresetGroupId,
  CanvasPresetId,
} from "@/types/canvas";

export type BoardLayoutConfig = {
  accessPanelWidth: number;
  designPanelWidth: number;
  sidebarWidth: number;
};

export type BoardDefaultsConfig = {
  canvasPresetId: CanvasPresetId;
  backgroundPresetId: string;
  canvasTitle: string;
};

export type BoardTextConfig = {
  defaultInput: BoardTextInput;
  weightOptions: number[];
};

export type BoardConfig = {
  layout: BoardLayoutConfig;
  defaults: BoardDefaultsConfig;
  text: BoardTextConfig;
  canvasPresetGroups: CanvasPresetGroup[];
  canvasPresetGroupIcons: Record<CanvasPresetGroupId, string>;
  canvasBackgroundPresets: CanvasBackgroundPreset[];
};

export const BOARD_CONFIG = {
  layout: {
    accessPanelWidth: 76,
    designPanelWidth: 304,
    sidebarWidth: 380,
  },
  defaults: {
    canvasPresetId: "general-square",
    backgroundPresetId: "solid-white",
    canvasTitle: "Canvas",
  },
  text: {
    defaultInput: {
      text: "",
      fontFamily: "Inter",
      fontSize: 24,
      fontWeight: 400,
      color: "#000000",
      align: "left",
      maxWidth: 320,
    },
    weightOptions: [300, 400, 500, 600, 700, 800, 900],
  },
  canvasPresetGroups: [
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
          size: { width: 1080, height: 1080 },
        },
        {
          id: "general-landscape",
          groupId: "general",
          label: "Landscape",
          size: { width: 1920, height: 1080 },
        },
        {
          id: "general-portrait",
          groupId: "general",
          label: "Portrait",
          size: { width: 1080, height: 1920 },
        },
      ],
    },
  ],
  canvasPresetGroupIcons: {
    twitter: "ri:twitter-x-fill",
    linkedin: "mdi:linkedin",
    instagram: "mdi:instagram",
    pinterest: "mdi:pinterest",
    general: "solar:ruler-angular-linear",
  },
  canvasBackgroundPresets: [
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
  ],
} satisfies BoardConfig;
