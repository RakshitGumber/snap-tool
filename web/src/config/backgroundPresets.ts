import type { CSSProperties } from "react";

export type BackgroundPresetStyle = CSSProperties;
export type BackgroundContrastColor = "#111111" | "#FFFFFF";

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
  contrast?: BackgroundContrastColor;
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

const stopOffsetToPercent = (offset: number) =>
  // Keep stable, readable CSS while preserving non-integer stops when needed.
  `${Math.round(offset * 1000) / 10}%`;

const linearGradientCss = (angle: number, stops: BackgroundGradientStop[]) =>
  `linear-gradient(${angle}deg, ${stops
    .map((stop) => `${stop.color} ${stopOffsetToPercent(stop.offset)}`)
    .join(", ")})`;

const linearGradientPreset = (input: {
  id: string;
  label: string;
  angle: number;
  stops: BackgroundGradientStop[];
}): BackgroundPreset => ({
  id: input.id,
  label: input.label,
  ...linearGradientBackground(
    linearGradientCss(input.angle, input.stops),
    input.angle,
    input.stops,
  ),
});

const solidLayer = (color: string): BackgroundLayer[] => [
  { type: "solid", color },
];

const getContrastColorForHex = (hex: string): BackgroundContrastColor => {
  const normalizedHex = hex.replace("#", "");
  const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.52 ? "#111111" : "#FFFFFF";
};

const hexToRgb = (hex: string) => {
  const normalizedHex = hex.replace("#", "");
  return {
    r: Number.parseInt(normalizedHex.slice(0, 2), 16),
    g: Number.parseInt(normalizedHex.slice(2, 4), 16),
    b: Number.parseInt(normalizedHex.slice(4, 6), 16),
  };
};

const srgbToLinear = (channel: number) => {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
};

const relativeLuminanceForHex = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const red = srgbToLinear(r);
  const green = srgbToLinear(g);
  const blue = srgbToLinear(b);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const getContrastColorForLinearGradientStops = (
  stops: BackgroundGradientStop[],
): BackgroundContrastColor => {
  const validStops = stops
    .filter((stop) => typeof stop.color === "string" && HEX_COLOR_PATTERN.test(stop.color))
    .map((stop) => ({
      offset: Math.min(1, Math.max(0, stop.offset)),
      luminance: relativeLuminanceForHex(stop.color),
    }))
    .sort((a, b) => a.offset - b.offset);

  if (!validStops.length) return "#FFFFFF";
  if (validStops.length === 1) {
    return validStops[0].luminance > 0.52 ? "#111111" : "#FFFFFF";
  }

  // Approximate gradient luminance by sampling across the stop offsets.
  const samples = 7;
  let total = 0;

  for (let index = 0; index < samples; index += 1) {
    const t = index / (samples - 1);
    let right = validStops.findIndex((stop) => stop.offset >= t);
    if (right === -1) right = validStops.length - 1;
    const left = Math.max(0, right - 1);
    const leftStop = validStops[left];
    const rightStop = validStops[right];

    if (!leftStop || !rightStop) continue;

    if (leftStop.offset === rightStop.offset) {
      total += rightStop.luminance;
      continue;
    }

    const localT = (t - leftStop.offset) / (rightStop.offset - leftStop.offset);
    total += leftStop.luminance + (rightStop.luminance - leftStop.luminance) * localT;
  }

  const average = total / samples;
  return average > 0.52 ? "#111111" : "#FFFFFF";
};

const getContrastColorForBackground = (
  background: string,
): BackgroundContrastColor =>
  HEX_COLOR_PATTERN.test(background)
    ? getContrastColorForHex(background)
    : "#FFFFFF";

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

export const getBackgroundContrastColor = (
  preset: BackgroundPreset,
): BackgroundContrastColor =>
  preset.contrast ??
  (preset.layers?.some((layer) => layer.type === "linear-gradient")
    ? getContrastColorForLinearGradientStops(
        preset.layers
          ?.filter(
            (layer): layer is Extract<BackgroundLayer, { type: "linear-gradient" }> =>
              layer.type === "linear-gradient",
          )[0]?.stops ?? [],
      )
    : getContrastColorForBackground(preset.background));

export const getOppositeContrastColor = (
  color: BackgroundContrastColor,
): BackgroundContrastColor => (color === "#FFFFFF" ? "#111111" : "#FFFFFF");

export const BACKGROUND_PRESET_CATEGORIES = [
  {
    id: "solid",
    label: "Solid",
    presets: [
      {
        id: "white",
        label: "White",
        background: "#F5F3EE",
        contrast: "#111111",
        layers: solidLayer("#F5F3EE"),
      },
      {
        id: "graphite",
        label: "Graphite",
        background: "#23252B",
        contrast: "#FFFFFF",
        layers: solidLayer("#23252B"),
      },
      {
        id: "red",
        label: "Energetic",
        background: "#FF3B30",
        contrast: "#FFFFFF",
        layers: solidLayer("#FF3B30"),
      },
      {
        id: "calm",
        label: "Calm",
        background: "#7FA8A4",
        contrast: "#111111",
        layers: solidLayer("#7FA8A4"),
      },
      {
        id: "author",
        label: "Author",
        background: "#14213D",
        contrast: "#FFFFFF",
        layers: solidLayer("#14213D"),
      },
      {
        id: "ember",
        label: "Ember",
        background: "#E76F51",
        contrast: "#111111",
        layers: solidLayer("#E76F51"),
      },
      {
        id: "love",
        label: "Love",
        background: "#D6456B",
        contrast: "#FFFFFF",
        layers: solidLayer("#D6456B"),
      },
      {
        id: "sky",
        label: "Sky",
        background: "#4DA8FF",
        contrast: "#111111",
        layers: solidLayer("#4DA8FF"),
      },
      {
        id: "tech",
        label: "Tech",
        background: "#635BFF",
        contrast: "#FFFFFF",
        layers: solidLayer("#635BFF"),
      },
      {
        id: "rage",
        label: "Rage",
        background: "#6D071A",
        contrast: "#FFFFFF",
        layers: solidLayer("#6D071A"),
      },
      {
        id: "future",
        label: "Future",
        background: "#00BFA6",
        contrast: "#111111",
        layers: solidLayer("#00BFA6"),
      },
    ],
  },
  {
    id: "soft-gradients",
    label: "Gradients",
    presets: [
      linearGradientPreset({
        id: "blush",
        label: "Blush",
        angle: 135,
        stops: [
          { offset: 0, color: "#fff1e6" },
          { offset: 0.44, color: "#f8c7d8" },
          { offset: 1, color: "#c58cff" },
        ],
      }),

      linearGradientPreset({
        id: "duskline",
        label: "Duskline",
        angle: 145,
        stops: [
          { offset: 0, color: "#1e1f4b" },
          { offset: 0.46, color: "#5a2a7a" },
          { offset: 1, color: "#f06c54" },
        ],
      }),

      linearGradientPreset({
        id: "tropic",
        label: "Tropic",
        angle: 135,
        stops: [
          { offset: 0, color: "#083d77" },
          { offset: 0.52, color: "#2bb3c0" },
          { offset: 1, color: "#d9f7a6" },
        ],
      }),

      linearGradientPreset({
        id: "warm-flame",
        label: "Warm Flame",
        angle: 135,
        stops: [
          { offset: 0, color: "#ff9a9e" },
          { offset: 1, color: "#fad0c4" },
        ],
      }),

      linearGradientPreset({
        id: "rare-wind",
        label: "Rare Wind",
        angle: 135,
        stops: [
          { offset: 0, color: "#a8edea" },
          { offset: 1, color: "#fed6e3" },
        ],
      }),

      linearGradientPreset({
        id: "tempting-azure",
        label: "Tempting Azure",
        angle: 135,
        stops: [
          { offset: 0, color: "#84fab0" },
          { offset: 1, color: "#8fd3f4" },
        ],
      }),

      linearGradientPreset({
        id: "malibu",
        label: "Malibu",
        angle: 135,
        stops: [
          { offset: 0, color: "#4facfe" },
          { offset: 1, color: "#00f2fe" },
        ],
      }),

      linearGradientPreset({
        id: "dusty-grass",
        label: "Dusty Grass",
        angle: 135,
        stops: [
          { offset: 0, color: "#d4fc79" },
          { offset: 1, color: "#96e6a1" },
        ],
      }),

      linearGradientPreset({
        id: "desert-hump",
        label: "Desert Hump",
        angle: 135,
        stops: [
          { offset: 0, color: "#c79081" },
          { offset: 1, color: "#dfa579" },
        ],
      }),

      linearGradientPreset({
        id: "true-sunset",
        label: "True Sunset",
        angle: 135,
        stops: [
          { offset: 0, color: "#fa709a" },
          { offset: 1, color: "#fee140" },
        ],
      }),

      linearGradientPreset({
        id: "aqua-splash",
        label: "Aqua Splash",
        angle: 145,
        stops: [
          { offset: 0, color: "#13547a" },
          { offset: 1, color: "#80d0c7" },
        ],
      }),

      linearGradientPreset({
        id: "eternal-constance",
        label: "Eternal Constance",
        angle: 145,
        stops: [
          { offset: 0, color: "#09203f" },
          { offset: 1, color: "#537895" },
        ],
      }),
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
      contrast: getContrastColorForHex(customColor),
    };
  }

  return (
    BACKGROUND_PRESETS.find((preset) => preset.id === presetId) ??
    BACKGROUND_PRESETS[0]
  );
};
