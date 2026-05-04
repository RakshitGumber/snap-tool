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
      value: {
        kind: "solid",
        color: "#FFFFFF",
      },
    },
    {
      id: "solid-slate",
      label: "Soft slate",
      value: {
        kind: "solid",
        color: "#F4F6FF",
      },
    },
    {
      id: "solid-ink",
      label: "Ink",
      value: {
        kind: "solid",
        color: "#1A1A1E",
      },
    },
    {
      id: "solid-mint",
      label: "Mint",
      value: {
        kind: "solid",
        color: "#E8FFF4",
      },
    },
    {
      id: "gradient-cloud",
      label: "Cloud",
      value: {
        kind: "gradient",
        css: "linear-gradient(135deg, #FFFFFF 0%, #F4F6FF 100%)",
      },
    },
    {
      id: "gradient-fresh",
      label: "Fresh",
      value: {
        kind: "gradient",
        css: "linear-gradient(135deg, #E8FFF4 0%, #BDEED9 100%)",
      },
    },
    {
      id: "gradient-warm",
      label: "Warm",
      value: {
        kind: "gradient",
        css: "linear-gradient(135deg, #FFF3E8 0%, #FFD8B5 100%)",
      },
    },
    {
      id: "gradient-night",
      label: "Night",
      value: {
        kind: "gradient",
        css: "linear-gradient(135deg, #1A1A1E 0%, #33333C 100%)",
      },
    },
    {
      id: "image-orbit",
      label: "Orbit",
      value: {
        kind: "image",
        fit: "contain",
        offsetX: 0,
        offsetY: 0,
        src: "/images/bg-orbit.svg",
        previewSrc: "/images/bg-orbit.svg",
        width: 1600,
        height: 900,
      },
    },
    {
      id: "image-cascade",
      label: "Cascade",
      value: {
        kind: "image",
        fit: "contain",
        offsetX: 0,
        offsetY: 0,
        src: "/images/bg-cascade.svg",
        previewSrc: "/images/bg-cascade.svg",
        width: 1080,
        height: 1350,
      },
    },
  ],
} satisfies BoardConfig;
