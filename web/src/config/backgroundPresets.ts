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

const unsplashBackground = (imageId: string) =>
  `url("https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=1800&q=80") center / cover no-repeat`;

export const BACKGROUND_PRESET_CATEGORIES = [
  {
    id: "solid",
    label: "Solid",
    presets: [
      {
        id: "white",
        label: "White",
        background: "#F5F3EE",
      },
      {
        id: "graphite",
        label: "Graphite",
        background: "#23252B",
      },
      {
        id: "red",
        label: "Energetic",
        background: "#FF3B30",
      },
      {
        id: "calm",
        label: "Calm",
        background: "#7FA8A4",
      },
      {
        id: "author",
        label: "Author",
        background: "#14213D",
      },
      {
        id: "ember",
        label: "Ember",
        background: "#E76F51",
      },
      {
        id: "love",
        label: "Love",
        background: "#D6456B",
      },
      {
        id: "sky",
        label: "Sky",
        background: "#4DA8FF",
      },
      {
        id: "tech",
        label: "Tech",
        background: "#635BFF",
      },
      {
        id: "rage",
        label: "Rage",
        background: "#6D071A",
      },
      {
        id: "future",
        label: "Future",
        background: "#00BFA6",
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
  {
    id: "vector",
    label: "Vector Graphic",
    presets: [
      {
        id: "vector-prism",
        label: "Prism",
        background: unsplashBackground("photo-1618005182384-a83a8bd57fbe"),
      },
      {
        id: "vector-paper",
        label: "Paper",
        background: unsplashBackground("photo-1527769929977-c341ee9f2033"),
      },
      {
        id: "vector-mesh",
        label: "Mesh",
        background: unsplashBackground("photo-1487088678257-3a541e6e3922"),
      },
      {
        id: "vector-ribbons",
        label: "Ribbons",
        background: unsplashBackground("photo-1579547621113-e4bb2a19bdd6"),
      },
      {
        id: "vector-waves",
        label: "Waves",
        background: unsplashBackground("photo-1579548122080-c35fd6820ecb"),
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
        background: unsplashBackground("photo-1684139517679-032b7213ad2e"),
      },
      {
        id: "abstract-glass",
        label: "Glass",
        background: unsplashBackground("photo-1669295384050-a1d4357bd1d7"),
      },
      {
        id: "abstract-canvas",
        label: "Canvas",
        background: unsplashBackground("photo-1637825891028-564f672aa42c"),
      },
      {
        id: "abstract-folds",
        label: "Folds",
        background: unsplashBackground("photo-1621947081720-86970823b77a"),
      },
      {
        id: "abstract-spectrum",
        label: "Spectrum",
        background: unsplashBackground("photo-1620812097331-ff636155488f"),
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
          "https://plus.unsplash.com/premium_photo-1747850152562-bad3f528c924?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      {
        id: "background-mountain",
        label: "Mountain",
        background: unsplashBackground("photo-1516617442634-75371039cb3a"),
      },
      {
        id: "background-soft-light",
        label: "Soft Light",
        background: unsplashBackground("photo-1601314167099-232775b3d6fd"),
      },
      {
        id: "background-horizon",
        label: "Horizon",
        background: unsplashBackground("photo-1723384747376-90f201a3bd55"),
      },
      {
        id: "background-texture",
        label: "Texture",
        background: unsplashBackground("photo-1613828330596-982c62f72e9a"),
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
