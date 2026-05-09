import type {
  BoardTextInput,
  CanvasBackgroundPresetGroup,
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
  canvasBackgroundPresetGroups: CanvasBackgroundPresetGroup[];
};

export const BOARD_CONFIG = {
  layout: {
    accessPanelWidth: 76,
    designPanelWidth: 304,
    sidebarWidth: 380,
  },
  defaults: {
    canvasPresetId: "general-square",
    backgroundPresetId: "gradient-01",
    canvasTitle: "untitled",
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
  canvasBackgroundPresetGroups: [
    {
      id: "gradients",
      label: "Gradients",
      presets: [
        {
          id: "gradient-01",
          label: "Aurora",
          value: {
            kind: "gradient",
            css: "linear-gradient(135deg, #F7E8FF 0%, #BCD7FF 48%, #9FF4D5 100%)",
          },
        },
        {
          id: "gradient-02",
          label: "Duskline",
          value: {
            kind: "gradient",
            css: "linear-gradient(145deg, #1E1F4B 0%, #5A2A7A 46%, #F06C54 100%)",
          },
        },
        {
          id: "gradient-03",
          label: "Tropic",
          value: {
            kind: "gradient",
            css: "linear-gradient(135deg, #083D77 0%, #2BB3C0 52%, #D9F7A6 100%)",
          },
        },
        {
          id: "gradient-04",
          label: "Blush",
          value: {
            kind: "gradient",
            css: "linear-gradient(135deg, #FFF1E6 0%, #F8C7D8 44%, #C58CFF 100%)",
          },
        },
        {
          id: "gradient-05",
          label: "Cinder",
          value: {
            kind: "gradient",
            css: "linear-gradient(135deg, #12131A 0%, #394252 55%, #D0A76F 100%)",
          },
        },
        {
          id: "gradient-06",
          label: "Glacier",
          value: {
            kind: "gradient",
            css: "linear-gradient(135deg, #EFF7FF 0%, #A9C6FF 50%, #5B7BE3 100%)",
          },
        },
      ],
    },
  ],
} satisfies BoardConfig;
