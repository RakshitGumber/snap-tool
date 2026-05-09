export type LinkCardSourceKind =
  | "youtube"
  | "github"
  | "website"
  | "screenshot";

export type LinkCardSlot =
  | "title"
  | "subtitle"
  | "description"
  | "originalUrl"
  | "hostname"
  | "thumbnailUrl"
  | "avatarUrl"
  | "openGraphUrl"
  | "faviconUrl"
  | "imageUrl"
  | "startTimeLabel"
  | "stats";

export type LinkCardBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LinkCardTextStyle = {
  color: string;
  fontSizeRatio: number;
  fontWeight?: number;
  lineHeight?: number;
  align?: "left" | "center" | "right";
  lineClamp?: number;
  opacity?: number;
};

export type LinkCardLayer =
  | {
      id: string;
      kind: "rect";
      box: LinkCardBox;
      background: string;
      opacity?: number;
      radiusRatio?: number;
    }
  | {
      id: string;
      kind: "image";
      slot: LinkCardSlot;
      box: LinkCardBox;
      fit?: "cover" | "contain";
      background?: string;
      radiusRatio?: number;
    }
  | {
      id: string;
      kind: "text";
      slot: LinkCardSlot;
      box: LinkCardBox;
      style: LinkCardTextStyle;
      fallback?: string;
    }
  | {
      id: string;
      kind: "badge";
      slot: LinkCardSlot;
      box: LinkCardBox;
      style: LinkCardTextStyle & {
        background: string;
        paddingXRatio: number;
        paddingYRatio: number;
        radiusRatio: number;
      };
      hiddenWhenEmpty?: boolean;
      fallback?: string;
    }
  | {
      id: string;
      kind: "icon";
      icon: string;
      box: LinkCardBox;
      color: string;
      opacity?: number;
    }
  | {
      id: string;
      kind: "statList";
      slot: "stats";
      box: LinkCardBox;
      gapRatio: number;
      maxItems?: number;
      item: {
        background: string;
        color: string;
        fontSizeRatio: number;
        fontWeight?: number;
        paddingXRatio: number;
        paddingYRatio: number;
        radiusRatio: number;
      };
    };

export type LinkCardPreset = {
  id: string;
  label: string;
  source: LinkCardSourceKind;
  aspectRatio: number;
  initialWidthRatio: number;
  background: string;
  borderRadiusRatio: number;
  layers: LinkCardLayer[];
};

export type LinkCardPresetGroup = {
  id: LinkCardSourceKind;
  label: string;
  presets: LinkCardPreset[];
};

export const LINK_CARD_PRESET_GROUPS: LinkCardPresetGroup[] = [
  {
    id: "youtube",
    label: "YouTube",
    presets: [
      {
        id: "youtube-featured",
        label: "Thumbnail Details",
        source: "youtube",
        aspectRatio: 16 / 10,
        initialWidthRatio: 0.62,
        background: "#111111",
        borderRadiusRatio: 0.018,
        layers: [
          {
            id: "thumbnail",
            kind: "image",
            slot: "thumbnailUrl",
            box: { x: 0, y: 0, width: 1, height: 1 },
            fit: "cover",
          },
          {
            id: "bottom-shade",
            kind: "rect",
            box: { x: 0, y: 0.48, width: 1, height: 0.52 },
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.86) 100%)",
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.05, y: 0.66, width: 0.78, height: 0.2 },
            style: {
              color: "#ffffff",
              fontSizeRatio: 0.036,
              fontWeight: 800,
              lineHeight: 1.12,
              lineClamp: 2,
            },
          },
          {
            id: "channel",
            kind: "text",
            slot: "subtitle",
            box: { x: 0.05, y: 0.86, width: 0.6, height: 0.08 },
            style: {
              color: "#d7d7d7",
              fontSizeRatio: 0.018,
              fontWeight: 650,
              lineClamp: 1,
            },
          },
          {
            id: "time",
            kind: "badge",
            slot: "startTimeLabel",
            box: { x: 0.82, y: 0.05, width: 0.12, height: 0.06 },
            hiddenWhenEmpty: true,
            style: {
              background: "rgba(0,0,0,0.84)",
              color: "#ffffff",
              fontSizeRatio: 0.015,
              fontWeight: 800,
              paddingXRatio: 0.018,
              paddingYRatio: 0.008,
              radiusRatio: 0.006,
            },
          },
        ],
      },
      {
        id: "youtube-title-strip",
        label: "Title Below",
        source: "youtube",
        aspectRatio: 16 / 11,
        initialWidthRatio: 0.62,
        background: "#111111",
        borderRadiusRatio: 0.018,
        layers: [
          {
            id: "thumbnail",
            kind: "image",
            slot: "thumbnailUrl",
            box: { x: 0, y: 0, width: 1, height: 0.74 },
            fit: "cover",
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.05, y: 0.8, width: 0.86, height: 0.15 },
            style: {
              color: "#ffffff",
              fontSizeRatio: 0.032,
              fontWeight: 800,
              lineHeight: 1.16,
              lineClamp: 2,
            },
          },
        ],
      },
    ],
  },
  {
    id: "github",
    label: "GitHub",
    presets: [
      {
        id: "github-og",
        label: "GitHub Preview",
        source: "github",
        aspectRatio: 2,
        initialWidthRatio: 0.7,
        background: "#0d1117",
        borderRadiusRatio: 0.014,
        layers: [
          {
            id: "og-image",
            kind: "image",
            slot: "openGraphUrl",
            box: { x: 0, y: 0, width: 1, height: 1 },
            fit: "cover",
          },
        ],
      },
      {
        id: "github-styled",
        label: "Styled Profile",
        source: "github",
        aspectRatio: 7 / 4,
        initialWidthRatio: 0.62,
        background: "#0d1117",
        borderRadiusRatio: 0.018,
        layers: [
          {
            id: "avatar",
            kind: "image",
            slot: "avatarUrl",
            box: { x: 0.06, y: 0.09, width: 0.13, height: 0.2275 },
            fit: "cover",
            radiusRatio: 0.5,
            background: "rgba(255,255,255,0.10)",
          },
          {
            id: "github-icon",
            kind: "icon",
            icon: "simple-icons:github",
            box: { x: 0.84, y: 0.09, width: 0.08, height: 0.14 },
            color: "#ffffff",
            opacity: 0.6,
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.23, y: 0.1, width: 0.55, height: 0.1 },
            style: {
              color: "#ffffff",
              fontSizeRatio: 0.04,
              fontWeight: 800,
              lineClamp: 1,
            },
          },
          {
            id: "subtitle",
            kind: "text",
            slot: "subtitle",
            box: { x: 0.23, y: 0.22, width: 0.5, height: 0.06 },
            style: {
              color: "#8b949e",
              fontSizeRatio: 0.02,
              fontWeight: 550,
              lineClamp: 1,
            },
          },
          {
            id: "description",
            kind: "text",
            slot: "description",
            box: { x: 0.06, y: 0.45, width: 0.84, height: 0.22 },
            style: {
              color: "#c9d1d9",
              fontSizeRatio: 0.023,
              lineHeight: 1.3,
              lineClamp: 3,
            },
          },
          {
            id: "stats",
            kind: "statList",
            slot: "stats",
            box: { x: 0.06, y: 0.78, width: 0.86, height: 0.11 },
            gapRatio: 0.012,
            maxItems: 3,
            item: {
              background: "rgba(255,255,255,0.10)",
              color: "#ffffff",
              fontSizeRatio: 0.015,
              fontWeight: 700,
              paddingXRatio: 0.018,
              paddingYRatio: 0.01,
              radiusRatio: 0.008,
            },
          },
        ],
      },
    ],
  },
  {
    id: "website",
    label: "Website",
    presets: [
      {
        id: "website-compact",
        label: "Compact Link",
        source: "website",
        aspectRatio: 15 / 7,
        initialWidthRatio: 0.58,
        background: "#ffffff",
        borderRadiusRatio: 0.018,
        layers: [
          {
            id: "favicon",
            kind: "image",
            slot: "faviconUrl",
            box: { x: 0.07, y: 0.27, width: 0.16, height: 0.342 },
            fit: "contain",
            radiusRatio: 0.022,
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.28, y: 0.26, width: 0.62, height: 0.16 },
            style: {
              color: "#1f2328",
              fontSizeRatio: 0.048,
              fontWeight: 800,
              lineClamp: 1,
            },
          },
          {
            id: "hostname",
            kind: "text",
            slot: "hostname",
            box: { x: 0.28, y: 0.53, width: 0.55, height: 0.1 },
            style: {
              color: "#57606a",
              fontSizeRatio: 0.022,
              fontWeight: 650,
              lineClamp: 1,
            },
          },
        ],
      },
    ],
  },
  {
    id: "screenshot",
    label: "Screenshot",
    presets: [
      {
        id: "screenshot-raw",
        label: "Raw Image",
        source: "screenshot",
        aspectRatio: 3 / 2,
        initialWidthRatio: 0.62,
        background: "transparent",
        borderRadiusRatio: 0.012,
        layers: [
          {
            id: "image",
            kind: "image",
            slot: "imageUrl",
            box: { x: 0, y: 0, width: 1, height: 1 },
            fit: "contain",
          },
        ],
      },
    ],
  },
];

export const LINK_CARD_PRESETS = LINK_CARD_PRESET_GROUPS.flatMap(
  (group) => group.presets,
);

export const getLinkCardPresetById = (presetId: string) =>
  LINK_CARD_PRESETS.find((preset) => preset.id === presetId) ??
  LINK_CARD_PRESETS[0];

export const getLinkCardPresetsBySource = (source: LinkCardSourceKind) =>
  LINK_CARD_PRESET_GROUPS.find((group) => group.id === source)?.presets ?? [];
