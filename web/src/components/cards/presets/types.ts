import type { ReactNode } from "react";

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
