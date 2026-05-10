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

export type LinkCardBorder = {
  color: string;
  widthRatio: number;
};

export type LinkCardShadow = {
  color: string;
  blurRatio: number;
  offsetXRatio: number;
  offsetYRatio: number;
};

export type LinkCardLayer =
  | {
      id: string;
      kind: "rect";
      box: LinkCardBox;
      background: string;
      opacity?: number;
      radiusRatio?: number;
      border?: LinkCardBorder;
      shadow?: LinkCardShadow;
    }
  | {
      id: string;
      kind: "image";
      slot: LinkCardSlot;
      box: LinkCardBox;
      fit?: "cover" | "contain";
      background?: string;
      radiusRatio?: number;
      opacity?: number;
      border?: LinkCardBorder;
      shadow?: LinkCardShadow;
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
        id: "youtube-cinematic-glass",
        label: "Cinematic Glass",
        source: "youtube",
        aspectRatio: 16 / 9,
        initialWidthRatio: 0.68,
        background:
          "radial-gradient(circle at 22% 14%, #ff375f 0%, #201018 34%, #050507 100%)",
        borderRadiusRatio: 0.026,
        layers: [
          {
            id: "thumbnail",
            kind: "image",
            slot: "thumbnailUrl",
            box: { x: 0.045, y: 0.08, width: 0.91, height: 0.78 },
            fit: "cover",
            radiusRatio: 0.022,
            shadow: {
              color: "rgba(0,0,0,0.44)",
              blurRatio: 0.055,
              offsetXRatio: 0,
              offsetYRatio: 0.025,
            },
          },
          {
            id: "vignette",
            kind: "rect",
            box: { x: 0.045, y: 0.42, width: 0.91, height: 0.44 },
            background:
              "linear-gradient(180deg, rgba(5,5,7,0) 0%, rgba(5,5,7,0.9) 100%)",
            radiusRatio: 0.022,
          },
          {
            id: "glass-panel",
            kind: "rect",
            box: { x: 0.08, y: 0.58, width: 0.72, height: 0.25 },
            background: "rgba(8,8,12,0.62)",
            radiusRatio: 0.018,
            border: { color: "rgba(255,255,255,0.16)", widthRatio: 0.0018 },
          },
          {
            id: "play",
            kind: "icon",
            icon: "mingcute:play-circle-fill",
            box: { x: 0.43, y: 0.28, width: 0.14, height: 0.249 },
            color: "#ffffff",
            opacity: 0.92,
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.105, y: 0.62, width: 0.61, height: 0.13 },
            style: {
              color: "#ffffff",
              fontSizeRatio: 0.035,
              fontWeight: 900,
              lineHeight: 1.08,
              lineClamp: 2,
            },
          },
          {
            id: "channel",
            kind: "text",
            slot: "subtitle",
            box: { x: 0.105, y: 0.77, width: 0.42, height: 0.045 },
            style: {
              color: "#f6c5cf",
              fontSizeRatio: 0.015,
              fontWeight: 760,
              lineClamp: 1,
            },
          },
          {
            id: "time",
            kind: "badge",
            slot: "startTimeLabel",
            box: { x: 0.82, y: 0.09, width: 0.1, height: 0.055 },
            hiddenWhenEmpty: true,
            style: {
              background: "rgba(0,0,0,0.72)",
              color: "#ffffff",
              fontSizeRatio: 0.014,
              fontWeight: 850,
              paddingXRatio: 0.014,
              paddingYRatio: 0.007,
              radiusRatio: 0.008,
            },
          },
        ],
      },
      {
        id: "youtube-creator-bento",
        label: "Creator Bento",
        source: "youtube",
        aspectRatio: 16 / 10,
        initialWidthRatio: 0.66,
        background:
          "radial-gradient(circle at 82% 18%, #ff0033 0%, #151515 38%, #070707 100%)",
        borderRadiusRatio: 0.028,
        layers: [
          {
            id: "media",
            kind: "image",
            slot: "thumbnailUrl",
            box: { x: 0.05, y: 0.08, width: 0.58, height: 0.55 },
            fit: "cover",
            radiusRatio: 0.018,
            border: { color: "rgba(255,255,255,0.14)", widthRatio: 0.0016 },
            shadow: {
              color: "rgba(255,0,51,0.25)",
              blurRatio: 0.05,
              offsetXRatio: 0,
              offsetYRatio: 0.018,
            },
          },
          {
            id: "side-card",
            kind: "rect",
            box: { x: 0.67, y: 0.08, width: 0.28, height: 0.55 },
            background: "rgba(255,255,255,0.09)",
            radiusRatio: 0.018,
            border: { color: "rgba(255,255,255,0.16)", widthRatio: 0.0016 },
          },
          {
            id: "youtube",
            kind: "icon",
            icon: "simple-icons:youtube",
            box: { x: 0.73, y: 0.16, width: 0.16, height: 0.256 },
            color: "#ff0033",
          },
          {
            id: "title-panel",
            kind: "rect",
            box: { x: 0.05, y: 0.68, width: 0.9, height: 0.22 },
            background: "rgba(255,255,255,0.94)",
            radiusRatio: 0.018,
            shadow: {
              color: "rgba(0,0,0,0.28)",
              blurRatio: 0.04,
              offsetXRatio: 0,
              offsetYRatio: 0.018,
            },
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.09, y: 0.72, width: 0.62, height: 0.1 },
            style: {
              color: "#111111",
              fontSizeRatio: 0.027,
              fontWeight: 900,
              lineHeight: 1.12,
              lineClamp: 2,
            },
          },
          {
            id: "channel",
            kind: "text",
            slot: "subtitle",
            box: { x: 0.73, y: 0.73, width: 0.16, height: 0.055 },
            style: {
              color: "#525252",
              fontSizeRatio: 0.014,
              fontWeight: 800,
              align: "center",
              lineClamp: 1,
            },
          },
        ],
      },
      {
        id: "youtube-poster-frame",
        label: "Poster Frame",
        source: "youtube",
        aspectRatio: 4 / 5,
        initialWidthRatio: 0.42,
        background:
          "radial-gradient(circle at 50% 15%, #ffd1dc 0%, #fc466b 36%, #1f0b12 100%)",
        borderRadiusRatio: 0.034,
        layers: [
          {
            id: "poster",
            kind: "image",
            slot: "thumbnailUrl",
            box: { x: 0.09, y: 0.08, width: 0.82, height: 0.52 },
            fit: "cover",
            radiusRatio: 0.024,
            border: { color: "rgba(255,255,255,0.72)", widthRatio: 0.006 },
            shadow: {
              color: "rgba(0,0,0,0.38)",
              blurRatio: 0.08,
              offsetXRatio: 0,
              offsetYRatio: 0.035,
            },
          },
          {
            id: "play",
            kind: "icon",
            icon: "mingcute:play-circle-fill",
            box: { x: 0.4, y: 0.27, width: 0.2, height: 0.16 },
            color: "#ffffff",
            opacity: 0.94,
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.1, y: 0.68, width: 0.8, height: 0.14 },
            style: {
              color: "#ffffff",
              fontSizeRatio: 0.043,
              fontWeight: 900,
              lineHeight: 1.04,
              align: "center",
              lineClamp: 3,
            },
          },
          {
            id: "channel-chip",
            kind: "badge",
            slot: "subtitle",
            box: { x: 0.22, y: 0.86, width: 0.56, height: 0.055 },
            style: {
              background: "rgba(255,255,255,0.9)",
              color: "#c1123e",
              fontSizeRatio: 0.017,
              fontWeight: 850,
              paddingXRatio: 0.018,
              paddingYRatio: 0.008,
              radiusRatio: 0.02,
            },
          },
        ],
      },
      {
        id: "youtube-studio-console",
        label: "Studio Console",
        source: "youtube",
        aspectRatio: 16 / 7,
        initialWidthRatio: 0.7,
        background: "#0a0a0a",
        borderRadiusRatio: 0.022,
        layers: [
          {
            id: "strip",
            kind: "rect",
            box: { x: 0, y: 0, width: 1, height: 1 },
            background:
              "linear-gradient(110deg, #0a0a0a 0%, #221014 54%, #3b050f 100%)",
          },
          {
            id: "thumb",
            kind: "image",
            slot: "thumbnailUrl",
            box: { x: 0.035, y: 0.12, width: 0.36, height: 0.76 },
            fit: "cover",
            radiusRatio: 0.014,
            border: { color: "rgba(255,255,255,0.14)", widthRatio: 0.0015 },
          },
          {
            id: "panel",
            kind: "rect",
            box: { x: 0.43, y: 0.14, width: 0.52, height: 0.72 },
            background: "rgba(255,255,255,0.08)",
            radiusRatio: 0.016,
            border: { color: "rgba(255,255,255,0.14)", widthRatio: 0.0015 },
          },
          {
            id: "icon",
            kind: "icon",
            icon: "simple-icons:youtube",
            box: { x: 0.47, y: 0.22, width: 0.055, height: 0.126 },
            color: "#ff0033",
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.55, y: 0.23, width: 0.35, height: 0.18 },
            style: {
              color: "#ffffff",
              fontSizeRatio: 0.026,
              fontWeight: 900,
              lineHeight: 1.12,
              lineClamp: 2,
            },
          },
          {
            id: "channel",
            kind: "text",
            slot: "subtitle",
            box: { x: 0.55, y: 0.53, width: 0.24, height: 0.06 },
            style: {
              color: "#fca5a5",
              fontSizeRatio: 0.014,
              fontWeight: 780,
              lineClamp: 1,
            },
          },
          {
            id: "time",
            kind: "badge",
            slot: "startTimeLabel",
            box: { x: 0.55, y: 0.67, width: 0.12, height: 0.075 },
            hiddenWhenEmpty: true,
            style: {
              background: "#ffffff",
              color: "#111111",
              fontSizeRatio: 0.012,
              fontWeight: 900,
              paddingXRatio: 0.014,
              paddingYRatio: 0.006,
              radiusRatio: 0.008,
            },
          },
        ],
      },
      {
        id: "youtube-neon-feature",
        label: "Neon Feature",
        source: "youtube",
        aspectRatio: 16 / 9,
        initialWidthRatio: 0.68,
        background:
          "radial-gradient(circle at 75% 20%, #ff0033 0%, #111827 42%, #020617 100%)",
        borderRadiusRatio: 0.026,
        layers: [
          {
            id: "halo",
            kind: "rect",
            box: { x: 0.09, y: 0.1, width: 0.82, height: 0.66 },
            background: "rgba(255,0,51,0.2)",
            radiusRatio: 0.022,
            shadow: {
              color: "rgba(255,0,51,0.42)",
              blurRatio: 0.09,
              offsetXRatio: 0,
              offsetYRatio: 0,
            },
          },
          {
            id: "thumbnail",
            kind: "image",
            slot: "thumbnailUrl",
            box: { x: 0.12, y: 0.13, width: 0.76, height: 0.58 },
            fit: "cover",
            radiusRatio: 0.018,
            border: { color: "rgba(255,255,255,0.28)", widthRatio: 0.002 },
          },
          {
            id: "glass-footer",
            kind: "rect",
            box: { x: 0.12, y: 0.65, width: 0.76, height: 0.22 },
            background: "rgba(2,6,23,0.82)",
            radiusRatio: 0.018,
            border: { color: "rgba(255,255,255,0.16)", widthRatio: 0.0016 },
          },
          {
            id: "play",
            kind: "icon",
            icon: "mingcute:play-circle-fill",
            box: { x: 0.78, y: 0.72, width: 0.07, height: 0.124 },
            color: "#ffeff3",
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.16, y: 0.69, width: 0.52, height: 0.1 },
            style: {
              color: "#ffffff",
              fontSizeRatio: 0.027,
              fontWeight: 900,
              lineHeight: 1.1,
              lineClamp: 2,
            },
          },
          {
            id: "channel",
            kind: "text",
            slot: "subtitle",
            box: { x: 0.16, y: 0.82, width: 0.36, height: 0.04 },
            style: {
              color: "#fda4af",
              fontSizeRatio: 0.014,
              fontWeight: 800,
              lineClamp: 1,
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
        id: "github-repo-bento",
        label: "Repo Bento",
        source: "github",
        aspectRatio: 16 / 10,
        initialWidthRatio: 0.66,
        background:
          "radial-gradient(circle at 80% 15%, #2dd4bf 0%, #10241f 36%, #0d1117 100%)",
        borderRadiusRatio: 0.026,
        layers: [
          {
            id: "main",
            kind: "rect",
            box: { x: 0.055, y: 0.08, width: 0.62, height: 0.72 },
            background: "rgba(255,255,255,0.08)",
            radiusRatio: 0.02,
            border: { color: "rgba(255,255,255,0.13)", widthRatio: 0.0016 },
            shadow: {
              color: "rgba(0,0,0,0.38)",
              blurRatio: 0.05,
              offsetXRatio: 0,
              offsetYRatio: 0.024,
            },
          },
          {
            id: "side",
            kind: "rect",
            box: { x: 0.705, y: 0.08, width: 0.24, height: 0.72 },
            background: "rgba(45,212,191,0.13)",
            radiusRatio: 0.02,
            border: { color: "rgba(45,212,191,0.28)", widthRatio: 0.0016 },
          },
          {
            id: "icon",
            kind: "icon",
            icon: "simple-icons:github",
            box: { x: 0.09, y: 0.13, width: 0.08, height: 0.128 },
            color: "#ffffff",
            opacity: 0.86,
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.09, y: 0.33, width: 0.49, height: 0.09 },
            style: {
              color: "#ffffff",
              fontSizeRatio: 0.031,
              fontWeight: 900,
              lineClamp: 1,
            },
          },
          {
            id: "description",
            kind: "text",
            slot: "description",
            box: { x: 0.09, y: 0.47, width: 0.5, height: 0.14 },
            style: {
              color: "#cbd5e1",
              fontSizeRatio: 0.018,
              lineHeight: 1.32,
              lineClamp: 3,
            },
          },
          {
            id: "stats",
            kind: "statList",
            slot: "stats",
            box: { x: 0.09, y: 0.68, width: 0.49, height: 0.08 },
            gapRatio: 0.01,
            maxItems: 3,
            item: {
              background: "rgba(255,255,255,0.12)",
              color: "#ffffff",
              fontSizeRatio: 0.013,
              fontWeight: 800,
              paddingXRatio: 0.015,
              paddingYRatio: 0.008,
              radiusRatio: 0.008,
            },
          },
          {
            id: "code",
            kind: "icon",
            icon: "mingcute:code-line",
            box: { x: 0.77, y: 0.22, width: 0.1, height: 0.16 },
            color: "#5eead4",
          },
        ],
      },
      {
        id: "github-og-gallery",
        label: "OG Gallery",
        source: "github",
        aspectRatio: 16 / 9,
        initialWidthRatio: 0.68,
        background: "#05070a",
        borderRadiusRatio: 0.024,
        layers: [
          {
            id: "og-back",
            kind: "image",
            slot: "openGraphUrl",
            box: { x: 0.09, y: 0.11, width: 0.78, height: 0.58 },
            fit: "cover",
            opacity: 0.38,
            radiusRatio: 0.02,
          },
          {
            id: "og-front",
            kind: "image",
            slot: "openGraphUrl",
            box: { x: 0.13, y: 0.16, width: 0.74, height: 0.5 },
            fit: "cover",
            radiusRatio: 0.018,
            border: { color: "rgba(255,255,255,0.2)", widthRatio: 0.002 },
            shadow: {
              color: "rgba(0,0,0,0.5)",
              blurRatio: 0.055,
              offsetXRatio: 0,
              offsetYRatio: 0.026,
            },
          },
          {
            id: "footer",
            kind: "rect",
            box: { x: 0.08, y: 0.71, width: 0.84, height: 0.18 },
            background: "rgba(255,255,255,0.08)",
            radiusRatio: 0.018,
            border: { color: "rgba(255,255,255,0.14)", widthRatio: 0.0015 },
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.13, y: 0.745, width: 0.52, height: 0.055 },
            style: {
              color: "#ffffff",
              fontSizeRatio: 0.023,
              fontWeight: 900,
              lineClamp: 1,
            },
          },
          {
            id: "stats",
            kind: "statList",
            slot: "stats",
            box: { x: 0.13, y: 0.82, width: 0.56, height: 0.045 },
            gapRatio: 0.01,
            maxItems: 2,
            item: {
              background: "rgba(45,212,191,0.18)",
              color: "#99f6e4",
              fontSizeRatio: 0.012,
              fontWeight: 850,
              paddingXRatio: 0.014,
              paddingYRatio: 0.006,
              radiusRatio: 0.007,
            },
          },
          {
            id: "icon",
            kind: "icon",
            icon: "simple-icons:github",
            box: { x: 0.79, y: 0.755, width: 0.065, height: 0.116 },
            color: "#ffffff",
            opacity: 0.78,
          },
        ],
      },
      {
        id: "github-glass-profile",
        label: "Glass Profile",
        source: "github",
        aspectRatio: 4 / 5,
        initialWidthRatio: 0.42,
        background:
          "radial-gradient(circle at 30% 10%, #94a3b8 0%, #1e293b 38%, #020617 100%)",
        borderRadiusRatio: 0.032,
        layers: [
          {
            id: "panel",
            kind: "rect",
            box: { x: 0.08, y: 0.09, width: 0.84, height: 0.82 },
            background: "rgba(255,255,255,0.1)",
            radiusRatio: 0.028,
            border: { color: "rgba(255,255,255,0.18)", widthRatio: 0.002 },
          },
          {
            id: "avatar",
            kind: "image",
            slot: "avatarUrl",
            box: { x: 0.34, y: 0.16, width: 0.32, height: 0.256 },
            fit: "cover",
            radiusRatio: 0.5,
            background: "rgba(255,255,255,0.16)",
            border: { color: "rgba(255,255,255,0.72)", widthRatio: 0.006 },
            shadow: {
              color: "rgba(0,0,0,0.34)",
              blurRatio: 0.055,
              offsetXRatio: 0,
              offsetYRatio: 0.02,
            },
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.12, y: 0.48, width: 0.76, height: 0.07 },
            style: {
              color: "#ffffff",
              fontSizeRatio: 0.04,
              fontWeight: 900,
              align: "center",
              lineClamp: 1,
            },
          },
          {
            id: "subtitle",
            kind: "text",
            slot: "subtitle",
            box: { x: 0.16, y: 0.58, width: 0.68, height: 0.045 },
            style: {
              color: "#cbd5e1",
              fontSizeRatio: 0.021,
              fontWeight: 760,
              align: "center",
              lineClamp: 1,
            },
          },
          {
            id: "description",
            kind: "text",
            slot: "description",
            box: { x: 0.16, y: 0.69, width: 0.68, height: 0.09 },
            style: {
              color: "#e2e8f0",
              fontSizeRatio: 0.02,
              lineHeight: 1.3,
              align: "center",
              lineClamp: 3,
            },
          },
          {
            id: "stats",
            kind: "statList",
            slot: "stats",
            box: { x: 0.16, y: 0.83, width: 0.68, height: 0.06 },
            gapRatio: 0.012,
            maxItems: 3,
            item: {
              background: "rgba(255,255,255,0.14)",
              color: "#ffffff",
              fontSizeRatio: 0.015,
              fontWeight: 800,
              paddingXRatio: 0.014,
              paddingYRatio: 0.007,
              radiusRatio: 0.01,
            },
          },
        ],
      },
      {
        id: "github-terminal-pro",
        label: "Terminal Pro",
        source: "github",
        aspectRatio: 16 / 9,
        initialWidthRatio: 0.64,
        background:
          "radial-gradient(circle at 85% 10%, #22c55e 0%, #052e16 34%, #020617 100%)",
        borderRadiusRatio: 0.024,
        layers: [
          {
            id: "terminal",
            kind: "rect",
            box: { x: 0.06, y: 0.09, width: 0.88, height: 0.78 },
            background: "#020617",
            radiusRatio: 0.018,
            border: { color: "rgba(34,197,94,0.34)", widthRatio: 0.0018 },
            shadow: {
              color: "rgba(34,197,94,0.18)",
              blurRatio: 0.07,
              offsetXRatio: 0,
              offsetYRatio: 0.018,
            },
          },
          {
            id: "bar",
            kind: "rect",
            box: { x: 0.06, y: 0.09, width: 0.88, height: 0.13 },
            background: "#0f172a",
            radiusRatio: 0.018,
          },
          {
            id: "repo",
            kind: "text",
            slot: "title",
            box: { x: 0.11, y: 0.32, width: 0.72, height: 0.08 },
            style: {
              color: "#bbf7d0",
              fontSizeRatio: 0.032,
              fontWeight: 900,
              lineClamp: 1,
            },
          },
          {
            id: "description",
            kind: "text",
            slot: "description",
            box: { x: 0.11, y: 0.47, width: 0.7, height: 0.12 },
            style: {
              color: "#94a3b8",
              fontSizeRatio: 0.018,
              lineHeight: 1.3,
              lineClamp: 2,
            },
          },
          {
            id: "stats",
            kind: "statList",
            slot: "stats",
            box: { x: 0.11, y: 0.68, width: 0.72, height: 0.08 },
            gapRatio: 0.012,
            maxItems: 3,
            item: {
              background: "rgba(34,197,94,0.14)",
              color: "#86efac",
              fontSizeRatio: 0.014,
              fontWeight: 850,
              paddingXRatio: 0.016,
              paddingYRatio: 0.008,
              radiusRatio: 0.006,
            },
          },
          {
            id: "branch",
            kind: "icon",
            icon: "mingcute:git-branch-line",
            box: { x: 0.82, y: 0.315, width: 0.06, height: 0.107 },
            color: "#22c55e",
          },
        ],
      },
      {
        id: "github-neo-repo",
        label: "Neo Repo",
        source: "github",
        aspectRatio: 16 / 9,
        initialWidthRatio: 0.64,
        background: "#fef08a",
        borderRadiusRatio: 0.018,
        layers: [
          {
            id: "card",
            kind: "rect",
            box: { x: 0.06, y: 0.1, width: 0.84, height: 0.74 },
            background: "#ffffff",
            radiusRatio: 0.012,
            border: { color: "#111111", widthRatio: 0.004 },
            shadow: {
              color: "#111111",
              blurRatio: 0,
              offsetXRatio: 0.022,
              offsetYRatio: 0.026,
            },
          },
          {
            id: "chip",
            kind: "rect",
            box: { x: 0.1, y: 0.16, width: 0.12, height: 0.1 },
            background: "#2dd4bf",
            radiusRatio: 0.01,
            border: { color: "#111111", widthRatio: 0.003 },
          },
          {
            id: "github",
            kind: "icon",
            icon: "simple-icons:github",
            box: { x: 0.79, y: 0.17, width: 0.07, height: 0.124 },
            color: "#111111",
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.1, y: 0.34, width: 0.66, height: 0.08 },
            style: {
              color: "#111111",
              fontSizeRatio: 0.034,
              fontWeight: 900,
              lineClamp: 1,
            },
          },
          {
            id: "description",
            kind: "text",
            slot: "description",
            box: { x: 0.1, y: 0.49, width: 0.68, height: 0.12 },
            style: {
              color: "#27272a",
              fontSizeRatio: 0.018,
              lineHeight: 1.24,
              lineClamp: 2,
            },
          },
          {
            id: "stats",
            kind: "statList",
            slot: "stats",
            box: { x: 0.1, y: 0.68, width: 0.64, height: 0.07 },
            gapRatio: 0.01,
            maxItems: 3,
            item: {
              background: "#ffedd5",
              color: "#111111",
              fontSizeRatio: 0.013,
              fontWeight: 900,
              paddingXRatio: 0.014,
              paddingYRatio: 0.007,
              radiusRatio: 0.004,
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
        id: "website-social-glass",
        label: "Social Glass",
        source: "website",
        aspectRatio: 16 / 9,
        initialWidthRatio: 0.64,
        background:
          "radial-gradient(circle at 20% 20%, #60a5fa 0%, #312e81 42%, #111827 100%)",
        borderRadiusRatio: 0.026,
        layers: [
          {
            id: "panel",
            kind: "rect",
            box: { x: 0.07, y: 0.1, width: 0.86, height: 0.76 },
            background: "rgba(255,255,255,0.12)",
            radiusRatio: 0.024,
            border: { color: "rgba(255,255,255,0.22)", widthRatio: 0.0018 },
            shadow: {
              color: "rgba(0,0,0,0.34)",
              blurRatio: 0.06,
              offsetXRatio: 0,
              offsetYRatio: 0.025,
            },
          },
          {
            id: "favicon",
            kind: "image",
            slot: "faviconUrl",
            box: { x: 0.12, y: 0.17, width: 0.13, height: 0.231 },
            fit: "contain",
            background: "#ffffff",
            radiusRatio: 0.018,
            border: { color: "rgba(255,255,255,0.62)", widthRatio: 0.002 },
          },
          {
            id: "globe",
            kind: "icon",
            icon: "mingcute:globe-line",
            box: { x: 0.8, y: 0.17, width: 0.07, height: 0.124 },
            color: "#bfdbfe",
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.12, y: 0.49, width: 0.68, height: 0.1 },
            style: {
              color: "#ffffff",
              fontSizeRatio: 0.036,
              fontWeight: 900,
              lineClamp: 2,
            },
          },
          {
            id: "description",
            kind: "text",
            slot: "description",
            box: { x: 0.12, y: 0.65, width: 0.68, height: 0.08 },
            style: {
              color: "#dbeafe",
              fontSizeRatio: 0.016,
              lineHeight: 1.25,
              lineClamp: 2,
            },
          },
          {
            id: "hostname",
            kind: "badge",
            slot: "hostname",
            box: { x: 0.12, y: 0.78, width: 0.42, height: 0.055 },
            style: {
              background: "rgba(255,255,255,0.18)",
              color: "#ffffff",
              fontSizeRatio: 0.013,
              fontWeight: 820,
              paddingXRatio: 0.015,
              paddingYRatio: 0.007,
              radiusRatio: 0.012,
            },
          },
        ],
      },
      {
        id: "website-browser-premium",
        label: "Browser Premium",
        source: "website",
        aspectRatio: 16 / 10,
        initialWidthRatio: 0.64,
        background: "#e0f2fe",
        borderRadiusRatio: 0.026,
        layers: [
          {
            id: "window",
            kind: "rect",
            box: { x: 0.06, y: 0.1, width: 0.88, height: 0.76 },
            background: "#ffffff",
            radiusRatio: 0.02,
            border: { color: "rgba(15,23,42,0.1)", widthRatio: 0.0015 },
            shadow: {
              color: "rgba(15,23,42,0.18)",
              blurRatio: 0.06,
              offsetXRatio: 0,
              offsetYRatio: 0.03,
            },
          },
          {
            id: "bar",
            kind: "rect",
            box: { x: 0.06, y: 0.1, width: 0.88, height: 0.15 },
            background: "#f8fafc",
            radiusRatio: 0.02,
          },
          {
            id: "address",
            kind: "badge",
            slot: "hostname",
            box: { x: 0.22, y: 0.145, width: 0.52, height: 0.06 },
            style: {
              background: "#e2e8f0",
              color: "#334155",
              fontSizeRatio: 0.013,
              fontWeight: 760,
              paddingXRatio: 0.014,
              paddingYRatio: 0.006,
              radiusRatio: 0.01,
            },
          },
          {
            id: "favicon",
            kind: "image",
            slot: "faviconUrl",
            box: { x: 0.12, y: 0.37, width: 0.12, height: 0.192 },
            fit: "contain",
            background: "#f8fafc",
            radiusRatio: 0.014,
            border: { color: "#e2e8f0", widthRatio: 0.0015 },
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.29, y: 0.36, width: 0.52, height: 0.08 },
            style: {
              color: "#0f172a",
              fontSizeRatio: 0.032,
              fontWeight: 900,
              lineClamp: 1,
            },
          },
          {
            id: "description",
            kind: "text",
            slot: "description",
            box: { x: 0.29, y: 0.49, width: 0.54, height: 0.13 },
            style: {
              color: "#475569",
              fontSizeRatio: 0.017,
              lineHeight: 1.28,
              lineClamp: 3,
            },
          },
          {
            id: "link-icon",
            kind: "icon",
            icon: "mingcute:link-line",
            box: { x: 0.82, y: 0.7, width: 0.055, height: 0.088 },
            color: "#2563eb",
          },
        ],
      },
      {
        id: "website-brand-poster",
        label: "Brand Poster",
        source: "website",
        aspectRatio: 1,
        initialWidthRatio: 0.48,
        background:
          "radial-gradient(circle at 50% 10%, #fef3c7 0%, #fb923c 44%, #7c2d12 100%)",
        borderRadiusRatio: 0.035,
        layers: [
          {
            id: "badge",
            kind: "image",
            slot: "faviconUrl",
            box: { x: 0.31, y: 0.17, width: 0.38, height: 0.38 },
            fit: "contain",
            background: "#ffffff",
            radiusRatio: 0.06,
            border: { color: "rgba(255,255,255,0.74)", widthRatio: 0.006 },
            shadow: {
              color: "rgba(124,45,18,0.36)",
              blurRatio: 0.08,
              offsetXRatio: 0,
              offsetYRatio: 0.035,
            },
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.12, y: 0.64, width: 0.76, height: 0.09 },
            style: {
              color: "#ffffff",
              fontSizeRatio: 0.042,
              fontWeight: 900,
              align: "center",
              lineClamp: 2,
            },
          },
          {
            id: "hostname",
            kind: "text",
            slot: "hostname",
            box: { x: 0.14, y: 0.8, width: 0.72, height: 0.045 },
            style: {
              color: "#ffedd5",
              fontSizeRatio: 0.019,
              fontWeight: 800,
              align: "center",
              lineClamp: 1,
            },
          },
        ],
      },
      {
        id: "website-editorial-cover",
        label: "Editorial Cover",
        source: "website",
        aspectRatio: 4 / 5,
        initialWidthRatio: 0.43,
        background: "#111827",
        borderRadiusRatio: 0.03,
        layers: [
          {
            id: "accent",
            kind: "rect",
            box: { x: 0.08, y: 0.08, width: 0.84, height: 0.2 },
            background:
              "linear-gradient(100deg, #22c55e 0%, #0ea5e9 54%, #a855f7 100%)",
            radiusRatio: 0.02,
          },
          {
            id: "favicon",
            kind: "image",
            slot: "faviconUrl",
            box: { x: 0.12, y: 0.19, width: 0.16, height: 0.128 },
            fit: "contain",
            background: "#ffffff",
            radiusRatio: 0.014,
          },
          {
            id: "hostname",
            kind: "text",
            slot: "hostname",
            box: { x: 0.12, y: 0.37, width: 0.72, height: 0.045 },
            style: {
              color: "#93c5fd",
              fontSizeRatio: 0.021,
              fontWeight: 850,
              lineClamp: 1,
            },
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.12, y: 0.48, width: 0.74, height: 0.16 },
            style: {
              color: "#ffffff",
              fontSizeRatio: 0.045,
              fontWeight: 900,
              lineHeight: 1.06,
              lineClamp: 3,
            },
          },
          {
            id: "description",
            kind: "text",
            slot: "description",
            box: { x: 0.12, y: 0.74, width: 0.72, height: 0.11 },
            style: {
              color: "#d1d5db",
              fontSizeRatio: 0.02,
              lineHeight: 1.28,
              lineClamp: 3,
            },
          },
        ],
      },
      {
        id: "website-command-link",
        label: "Command Link",
        source: "website",
        aspectRatio: 16 / 7,
        initialWidthRatio: 0.68,
        background: "#020617",
        borderRadiusRatio: 0.024,
        layers: [
          {
            id: "command",
            kind: "rect",
            box: { x: 0.05, y: 0.16, width: 0.9, height: 0.68 },
            background: "rgba(15,23,42,0.92)",
            radiusRatio: 0.018,
            border: { color: "rgba(148,163,184,0.22)", widthRatio: 0.0015 },
            shadow: {
              color: "rgba(0,0,0,0.38)",
              blurRatio: 0.05,
              offsetXRatio: 0,
              offsetYRatio: 0.024,
            },
          },
          {
            id: "favicon",
            kind: "image",
            slot: "faviconUrl",
            box: { x: 0.09, y: 0.32, width: 0.11, height: 0.251 },
            fit: "contain",
            background: "#ffffff",
            radiusRatio: 0.012,
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.24, y: 0.3, width: 0.48, height: 0.09 },
            style: {
              color: "#ffffff",
              fontSizeRatio: 0.026,
              fontWeight: 900,
              lineClamp: 1,
            },
          },
          {
            id: "url",
            kind: "text",
            slot: "originalUrl",
            box: { x: 0.24, y: 0.5, width: 0.54, height: 0.06 },
            style: {
              color: "#94a3b8",
              fontSizeRatio: 0.014,
              lineClamp: 1,
            },
          },
          {
            id: "link",
            kind: "icon",
            icon: "mingcute:link-line",
            box: { x: 0.83, y: 0.36, width: 0.06, height: 0.137 },
            color: "#38bdf8",
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
        id: "screenshot-floating-browser",
        label: "Floating Browser",
        source: "screenshot",
        aspectRatio: 16 / 10,
        initialWidthRatio: 0.68,
        background:
          "radial-gradient(circle at 20% 15%, #c4b5fd 0%, #dbeafe 44%, #f8fafc 100%)",
        borderRadiusRatio: 0.026,
        layers: [
          {
            id: "window",
            kind: "rect",
            box: { x: 0.06, y: 0.11, width: 0.88, height: 0.76 },
            background: "#ffffff",
            radiusRatio: 0.02,
            border: { color: "rgba(15,23,42,0.1)", widthRatio: 0.0015 },
            shadow: {
              color: "rgba(67,56,202,0.22)",
              blurRatio: 0.07,
              offsetXRatio: 0,
              offsetYRatio: 0.032,
            },
          },
          {
            id: "bar",
            kind: "rect",
            box: { x: 0.06, y: 0.11, width: 0.88, height: 0.12 },
            background: "#eef2ff",
            radiusRatio: 0.02,
          },
          {
            id: "image",
            kind: "image",
            slot: "imageUrl",
            box: { x: 0.09, y: 0.26, width: 0.82, height: 0.56 },
            fit: "contain",
            background: "#f8fafc",
            radiusRatio: 0.012,
          },
          {
            id: "browser",
            kind: "icon",
            icon: "mingcute:browser-line",
            box: { x: 0.82, y: 0.145, width: 0.05, height: 0.08 },
            color: "#4f46e5",
          },
        ],
      },
      {
        id: "screenshot-glass-device",
        label: "Glass Device",
        source: "screenshot",
        aspectRatio: 9 / 16,
        initialWidthRatio: 0.34,
        background:
          "radial-gradient(circle at 50% 8%, #38bdf8 0%, #1e3a8a 45%, #020617 100%)",
        borderRadiusRatio: 0.045,
        layers: [
          {
            id: "device",
            kind: "rect",
            box: { x: 0.12, y: 0.06, width: 0.76, height: 0.88 },
            background: "rgba(255,255,255,0.13)",
            radiusRatio: 0.055,
            border: { color: "rgba(255,255,255,0.26)", widthRatio: 0.004 },
            shadow: {
              color: "rgba(0,0,0,0.36)",
              blurRatio: 0.12,
              offsetXRatio: 0,
              offsetYRatio: 0.04,
            },
          },
          {
            id: "screen",
            kind: "image",
            slot: "imageUrl",
            box: { x: 0.18, y: 0.12, width: 0.64, height: 0.72 },
            fit: "contain",
            background: "#020617",
            radiusRatio: 0.035,
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.18, y: 0.86, width: 0.64, height: 0.04 },
            style: {
              color: "#e0f2fe",
              fontSizeRatio: 0.019,
              fontWeight: 850,
              align: "center",
              lineClamp: 1,
            },
          },
        ],
      },
      {
        id: "screenshot-gallery-matte",
        label: "Gallery Matte",
        source: "screenshot",
        aspectRatio: 4 / 5,
        initialWidthRatio: 0.44,
        background: "#f8f5ef",
        borderRadiusRatio: 0.018,
        layers: [
          {
            id: "matte",
            kind: "rect",
            box: { x: 0.07, y: 0.06, width: 0.86, height: 0.82 },
            background: "#ffffff",
            radiusRatio: 0.012,
            border: { color: "#e7ded0", widthRatio: 0.002 },
            shadow: {
              color: "rgba(83,63,42,0.18)",
              blurRatio: 0.06,
              offsetXRatio: 0,
              offsetYRatio: 0.026,
            },
          },
          {
            id: "image",
            kind: "image",
            slot: "imageUrl",
            box: { x: 0.13, y: 0.12, width: 0.74, height: 0.58 },
            fit: "contain",
            background: "#f3f4f6",
          },
          {
            id: "caption",
            kind: "text",
            slot: "title",
            box: { x: 0.16, y: 0.77, width: 0.68, height: 0.045 },
            style: {
              color: "#44403c",
              fontSizeRatio: 0.021,
              fontWeight: 800,
              align: "center",
              lineClamp: 1,
            },
          },
          {
            id: "image-icon",
            kind: "icon",
            icon: "mingcute:image-line",
            box: { x: 0.46, y: 0.895, width: 0.08, height: 0.064 },
            color: "#a8a29e",
          },
        ],
      },
      {
        id: "screenshot-dark-stage",
        label: "Dark Stage",
        source: "screenshot",
        aspectRatio: 16 / 9,
        initialWidthRatio: 0.68,
        background:
          "radial-gradient(circle at 50% 45%, #334155 0%, #0f172a 44%, #020617 100%)",
        borderRadiusRatio: 0.026,
        layers: [
          {
            id: "glow",
            kind: "rect",
            box: { x: 0.12, y: 0.16, width: 0.76, height: 0.62 },
            background: "rgba(56,189,248,0.12)",
            radiusRatio: 0.022,
            shadow: {
              color: "rgba(56,189,248,0.28)",
              blurRatio: 0.1,
              offsetXRatio: 0,
              offsetYRatio: 0,
            },
          },
          {
            id: "image",
            kind: "image",
            slot: "imageUrl",
            box: { x: 0.1, y: 0.13, width: 0.8, height: 0.65 },
            fit: "contain",
            background: "#020617",
            radiusRatio: 0.016,
            border: { color: "rgba(148,163,184,0.24)", widthRatio: 0.0018 },
          },
          {
            id: "caption-panel",
            kind: "rect",
            box: { x: 0.22, y: 0.75, width: 0.56, height: 0.12 },
            background: "rgba(15,23,42,0.88)",
            radiusRatio: 0.014,
            border: { color: "rgba(255,255,255,0.12)", widthRatio: 0.0015 },
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.28, y: 0.79, width: 0.44, height: 0.04 },
            style: {
              color: "#e2e8f0",
              fontSizeRatio: 0.016,
              fontWeight: 850,
              align: "center",
              lineClamp: 1,
            },
          },
        ],
      },
      {
        id: "screenshot-product-hero",
        label: "Product Hero",
        source: "screenshot",
        aspectRatio: 16 / 9,
        initialWidthRatio: 0.68,
        background:
          "radial-gradient(circle at 18% 22%, #fde68a 0%, #f8fafc 42%, #dbeafe 100%)",
        borderRadiusRatio: 0.026,
        layers: [
          {
            id: "back-card",
            kind: "rect",
            box: { x: 0.13, y: 0.16, width: 0.74, height: 0.58 },
            background: "rgba(255,255,255,0.58)",
            radiusRatio: 0.018,
            shadow: {
              color: "rgba(15,23,42,0.16)",
              blurRatio: 0.06,
              offsetXRatio: 0,
              offsetYRatio: 0.03,
            },
          },
          {
            id: "image",
            kind: "image",
            slot: "imageUrl",
            box: { x: 0.1, y: 0.1, width: 0.8, height: 0.64 },
            fit: "contain",
            background: "#ffffff",
            radiusRatio: 0.016,
            border: { color: "rgba(15,23,42,0.08)", widthRatio: 0.0015 },
          },
          {
            id: "title",
            kind: "text",
            slot: "title",
            box: { x: 0.18, y: 0.82, width: 0.64, height: 0.045 },
            style: {
              color: "#0f172a",
              fontSizeRatio: 0.018,
              fontWeight: 900,
              align: "center",
              lineClamp: 1,
            },
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
