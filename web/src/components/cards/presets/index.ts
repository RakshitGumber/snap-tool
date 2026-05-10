import { githubPresets } from "./github";
import type { LinkCardPreset, LinkCardPresetGroup, LinkCardSourceKind } from "./types";
import { websitePresets } from "./websites";
import { youtubePresets } from "./youtube";

export type {
  LinkCardImageSlot,
  LinkCardPreset,
  LinkCardPresetGroup,
  LinkCardRenderProps,
  LinkCardSourceKind,
} from "./types";

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
