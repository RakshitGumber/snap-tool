import type { ReactNode } from "react";

import { githubPresets } from "@/components/cards/renderers/github";
import { websitePresets } from "@/components/cards/renderers/websites";
import { youtubePresets } from "@/components/cards/renderers/youtube";
import type { LinkCardMetadata, LinkCardMetadataSource } from "@/libs/linkCards";

export type LinkCardSourceKind = LinkCardMetadataSource;

export type LinkCardImageSlot =
  | "thumbnailUrl"
  | "avatarUrl"
  | "openGraphUrl"
  | "faviconUrl";

export type LinkCardRenderProps = {
  metadata: LinkCardMetadata;
  width: number;
  height: number;
};

export type LinkCardPreset = {
  id: string;
  label: string;
  source: LinkCardSourceKind;
  aspectRatio: number;
  initialWidthRatio: number;
  imageSlots: LinkCardImageSlot[];
  Component: (props: LinkCardRenderProps) => ReactNode;
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
    presets: youtubePresets,
  },
  {
    id: "github",
    label: "GitHub",
    presets: githubPresets,
  },
  {
    id: "website",
    label: "Website",
    presets: websitePresets,
  },
];

export const LINK_CARD_PRESETS = LINK_CARD_PRESET_GROUPS.flatMap(
  (group) => group.presets,
);

export const DEFAULT_LINK_CARD_PRESET_ID = LINK_CARD_PRESETS[0]?.id ?? "";

export const getLinkCardPresetById = (presetId: string): LinkCardPreset =>
  LINK_CARD_PRESETS.find((preset) => preset.id === presetId) ??
  LINK_CARD_PRESETS[0];

export const getLinkCardPresetsBySource = (source: LinkCardSourceKind) =>
  LINK_CARD_PRESET_GROUPS.find((group) => group.id === source)?.presets ?? [];

export const isLinkCardPresetId = (presetId: string) =>
  LINK_CARD_PRESETS.some((preset) => preset.id === presetId);
