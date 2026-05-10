import type { CSSProperties } from "react";

export type BackgroundPresetStyle = CSSProperties;

export type BackgroundGradientStop = {
  offset: number;
  color: string;
};

export type BackgroundLayer =
  | {
      type: "solid";
      color: string;
    }
  | {
      type: "linear-gradient";
      angle: number;
      stops: BackgroundGradientStop[];
    }
  | {
      type: "radial-gradient";
      center: { x: number; y: number };
      radius: number;
      stops: BackgroundGradientStop[];
    }
  | {
      type: "image";
      src: string;
    };

export type BackgroundPreset = {
  id: string;
  label: string;
  background: string;
  style?: BackgroundPresetStyle;
  layers?: BackgroundLayer[];
};

export type BackgroundPresetCategory = {
  id: string;
  label: string;
  presets: BackgroundPreset[];
};

const CUSTOM_BACKGROUND_PREFIX = "custom-color:";
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const unsplashImageSrc = (imageId: string) =>
  `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=1800&q=80`;

const imageBackground = (src: string) => ({
  background: `url("${src}") center / cover no-repeat`,
  layers: [
    { type: "solid" as const, color: "#f8fafc" },
    { type: "image" as const, src },
  ],
});

const unsplashBackground = (imageId: string) =>
  imageBackground(unsplashImageSrc(imageId));

const linearGradientBackground = (
  background: string,
  angle: number,
  stops: BackgroundGradientStop[],
) => ({
  background,
  layers: [{ type: "linear-gradient" as const, angle, stops }],
});

const solidLayer = (color: string): BackgroundLayer[] => [
  { type: "solid", color },
];

export const getBackgroundPresetStyle = (
  preset: BackgroundPreset,
): CSSProperties => ({
  background: preset.background,
  ...preset.style,
});

export const getBackgroundPresetBackground = (preset: BackgroundPreset) => {
  const styleBackground = preset.style?.background;

  if (typeof styleBackground === "string") return styleBackground;

  const styleBackgroundImage = preset.style?.backgroundImage;

  if (typeof styleBackgroundImage === "string") return styleBackgroundImage;

  return preset.background;
};

export const getBackgroundPresetLayers = (
  preset: BackgroundPreset,
): BackgroundLayer[] => preset.layers ?? solidLayer(preset.background);

export const BACKGROUND_PRESET_CATEGORIES = [
  {
    id: "solid",
    label: "Solid",
    presets: [
      {
        id: "white",
        label: "White",
        background: "#F5F3EE",
        layers: solidLayer("#F5F3EE"),
      },
      {
        id: "graphite",
        label: "Graphite",
        background: "#23252B",
        layers: solidLayer("#23252B"),
      },
      {
        id: "red",
        label: "Energetic",
        background: "#FF3B30",
        layers: solidLayer("#FF3B30"),
      },
      {
        id: "calm",
        label: "Calm",
        background: "#7FA8A4",
        layers: solidLayer("#7FA8A4"),
      },
      {
        id: "author",
        label: "Author",
        background: "#14213D",
        layers: solidLayer("#14213D"),
      },
      {
        id: "ember",
        label: "Ember",
        background: "#E76F51",
        layers: solidLayer("#E76F51"),
      },
      {
        id: "love",
        label: "Love",
        background: "#D6456B",
        layers: solidLayer("#D6456B"),
      },
      {
        id: "sky",
        label: "Sky",
        background: "#4DA8FF",
        layers: solidLayer("#4DA8FF"),
      },
      {
        id: "tech",
        label: "Tech",
        background: "#635BFF",
        layers: solidLayer("#635BFF"),
      },
      {
        id: "rage",
        label: "Rage",
        background: "#6D071A",
        layers: solidLayer("#6D071A"),
      },
      {
        id: "future",
        label: "Future",
        background: "#00BFA6",
        layers: solidLayer("#00BFA6"),
      },
    ],
  },
  {
    id: "soft-gradients",
    label: "Soft Gradients",
    presets: [
      {
        id: "aurora",
        label: "Aurora",
        background: `radial-gradient(
      circle at 70% 80%,
      rgba(255, 90, 200, 0.95) 0%,
      rgba(255, 90, 200, 0.6) 18%,
      transparent 38%
    ),

    radial-gradient(
      circle at 15% 55%,
      rgba(180, 0, 255, 0.9) 0%,
      rgba(180, 0, 255, 0.55) 20%,
      transparent 42%
    ),

    linear-gradient(
      135deg,
      #0b63c9 0%,
      #12b5d0 100%
    )`,
        layers: [
          {
            type: "linear-gradient",
            angle: 135,
            stops: [
              { offset: 0, color: "#0b63c9" },
              { offset: 1, color: "#12b5d0" },
            ],
          },
          {
            type: "radial-gradient",
            center: { x: 0.15, y: 0.55 },
            radius: 0.52,
            stops: [
              { offset: 0, color: "#b400ff" },
              { offset: 0.42, color: "rgba(180, 0, 255, 0)" },
            ],
          },
          {
            type: "radial-gradient",
            center: { x: 0.7, y: 0.8 },
            radius: 0.48,
            stops: [
              { offset: 0, color: "#ff5ac8" },
              { offset: 0.38, color: "rgba(255, 90, 200, 0)" },
            ],
          },
        ],
      },
      {
        id: "blush",
        label: "Blush",
        ...linearGradientBackground(
          "linear-gradient(135deg, #fff1e6 0%, #f8c7d8 44%, #c58cff 100%)",
          135,
          [
            { offset: 0, color: "#fff1e6" },
            { offset: 0.44, color: "#f8c7d8" },
            { offset: 1, color: "#c58cff" },
          ],
        ),
      },

      {
        id: "duskline",
        label: "Duskline",
        ...linearGradientBackground(
          "linear-gradient(145deg, #1e1f4b 0%, #5a2a7a 46%, #f06c54 100%)",
          145,
          [
            { offset: 0, color: "#1e1f4b" },
            { offset: 0.46, color: "#5a2a7a" },
            { offset: 1, color: "#f06c54" },
          ],
        ),
      },
      {
        id: "tropic",
        label: "Tropic",
        ...linearGradientBackground(
          "linear-gradient(135deg, #083d77 0%, #2bb3c0 52%, #d9f7a6 100%)",
          135,
          [
            { offset: 0, color: "#083d77" },
            { offset: 0.52, color: "#2bb3c0" },
            { offset: 1, color: "#d9f7a6" },
          ],
        ),
      },
    ],
  },
  {
    id: "vector",
    label: "Vector Graphic",
    presets: [
      {
        id: "vector-prism",
        label: "Prism",
        ...unsplashBackground("photo-1618005182384-a83a8bd57fbe"),
      },
      {
        id: "vector-paper",
        label: "Paper",
        ...unsplashBackground("photo-1527769929977-c341ee9f2033"),
      },
      {
        id: "vector-mesh",
        label: "Mesh",
        ...unsplashBackground("photo-1487088678257-3a541e6e3922"),
      },
      {
        id: "vector-ribbons",
        label: "Ribbons",
        ...unsplashBackground("photo-1579547621113-e4bb2a19bdd6"),
      },
      {
        id: "vector-waves",
        label: "Waves",
        ...unsplashBackground("photo-1579548122080-c35fd6820ecb"),
      },
    ],
  },
  {
    id: "abstract",
    label: "Abstract Graphic",
    presets: [
      {
        id: "abstract-liquid",
        label: "Liquid",
        ...unsplashBackground("photo-1684139517679-032b7213ad2e"),
      },
      {
        id: "abstract-glass",
        label: "Glass",
        ...unsplashBackground("photo-1669295384050-a1d4357bd1d7"),
      },
      {
        id: "abstract-canvas",
        label: "Canvas",
        ...unsplashBackground("photo-1637825891028-564f672aa42c"),
      },
      {
        id: "abstract-folds",
        label: "Folds",
        ...unsplashBackground("photo-1621947081720-86970823b77a"),
      },
      {
        id: "abstract-spectrum",
        label: "Spectrum",
        ...unsplashBackground("photo-1620812097331-ff636155488f"),
      },
    ],
  },
  {
    id: "background-image",
    label: "Background Image",
    presets: [
      {
        id: "background-studio",
        label: "Studio",
        background:
          'url("https://plus.unsplash.com/premium_photo-1747850152562-bad3f528c924?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        style: {
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        },
        layers: [
          { type: "solid", color: "#f8fafc" },
          {
            type: "image",
            src: "https://plus.unsplash.com/premium_photo-1747850152562-bad3f528c924?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          },
        ],
      },
      {
        id: "background-mountain",
        label: "Mountain",
        ...unsplashBackground("photo-1516617442634-75371039cb3a"),
      },
      {
        id: "background-soft-light",
        label: "Soft Light",
        ...unsplashBackground("photo-1601314167099-232775b3d6fd"),
      },
      {
        id: "background-horizon",
        label: "Horizon",
        ...unsplashBackground("photo-1723384747376-90f201a3bd55"),
      },
      {
        id: "background-texture",
        label: "Texture",
        ...unsplashBackground("photo-1613828330596-982c62f72e9a"),
      },
    ],
  },
] satisfies BackgroundPresetCategory[];

export const BACKGROUND_PRESETS = BACKGROUND_PRESET_CATEGORIES.flatMap(
  (category) => category.presets,
);

export const DEFAULT_BACKGROUND_PRESET_ID = BACKGROUND_PRESETS[0].id;
export const DEFAULT_CUSTOM_BACKGROUND_COLOR =
  BACKGROUND_PRESET_CATEGORIES.find((category) => category.id === "solid")
    ?.presets[0].background ?? BACKGROUND_PRESETS[0].background;

export const createCustomBackgroundId = (color: string) =>
  `${CUSTOM_BACKGROUND_PREFIX}${color.toUpperCase()}`;

export const getCustomBackgroundColor = (presetId: string) => {
  if (!presetId.startsWith(CUSTOM_BACKGROUND_PREFIX)) return null;

  const color = presetId.slice(CUSTOM_BACKGROUND_PREFIX.length);

  return HEX_COLOR_PATTERN.test(color) ? color.toUpperCase() : null;
};

export const getBackgroundPresetById = (presetId: string) => {
  const customColor = getCustomBackgroundColor(presetId);

  if (customColor) {
    return {
      id: presetId,
      label: "Custom",
      background: customColor,
    };
  }

  return (
    BACKGROUND_PRESETS.find((preset) => preset.id === presetId) ??
    BACKGROUND_PRESETS[0]
  );
};
