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
    {
      id: "vector",
      label: "Vector",
      presets: [
        {
          id: "vector-01",
          label: "Orbit",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "/images/bg-vector-01.svg",
            previewSrc: "/images/bg-vector-01.svg",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "vector-02",
          label: "Ribbon",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "/images/bg-vector-02.svg",
            previewSrc: "/images/bg-vector-02.svg",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "vector-03",
          label: "Summit",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "/images/bg-vector-03.svg",
            previewSrc: "/images/bg-vector-03.svg",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "vector-04",
          label: "Signal",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "/images/bg-vector-04.svg",
            previewSrc: "/images/bg-vector-04.svg",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "vector-05",
          label: "Facet",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "/images/bg-vector-05.svg",
            previewSrc: "/images/bg-vector-05.svg",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "vector-06",
          label: "Canopy",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "/images/bg-vector-06.svg",
            previewSrc: "/images/bg-vector-06.svg",
            width: 1600,
            height: 1000,
          },
        },
      ],
    },
    {
      id: "abstract",
      label: "Abstract",
      presets: [
        {
          id: "abstract-01",
          label: "Pulse",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "/images/bg-abstract-01.svg",
            previewSrc: "/images/bg-abstract-01.svg",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "abstract-02",
          label: "Drift",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "/images/bg-abstract-02.svg",
            previewSrc: "/images/bg-abstract-02.svg",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "abstract-03",
          label: "Monsoon",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "/images/bg-abstract-03.svg",
            previewSrc: "/images/bg-abstract-03.svg",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "abstract-04",
          label: "Prism",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "/images/bg-abstract-04.svg",
            previewSrc: "/images/bg-abstract-04.svg",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "abstract-05",
          label: "Echo",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "/images/bg-abstract-05.svg",
            previewSrc: "/images/bg-abstract-05.svg",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "abstract-06",
          label: "Strata",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "/images/bg-abstract-06.svg",
            previewSrc: "/images/bg-abstract-06.svg",
            width: 1600,
            height: 1000,
          },
        },
      ],
    },
    {
      id: "unsplash",
      label: "Unsplash",
      presets: [
        {
          id: "unsplash-01",
          label: "Coast",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&h=1000&q=80",
            previewSrc:
              "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&h=500&q=70",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "unsplash-02",
          label: "Canyon",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&h=1000&q=80",
            previewSrc:
              "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&h=500&q=70",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "unsplash-03",
          label: "Forest",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&h=1000&q=80",
            previewSrc:
              "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&h=500&q=70",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "unsplash-04",
          label: "Desert",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&h=1000&q=80",
            previewSrc:
              "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&h=500&q=70",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "unsplash-05",
          label: "Seafoam",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&h=1000&q=80",
            previewSrc:
              "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&h=500&q=70",
            width: 1600,
            height: 1000,
          },
        },
        {
          id: "unsplash-06",
          label: "Range",
          value: {
            kind: "image",
            fit: "cover",
            offsetX: 0,
            offsetY: 0,
            src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&h=1000&q=80",
            previewSrc:
              "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&h=500&q=70",
            width: 1600,
            height: 1000,
          },
        },
      ],
    },
  ],
} satisfies BoardConfig;
