/* eslint-disable react-refresh/only-export-components */
import type { GitHubLinkCardMetadata } from "@/libs/linkCards";

import {
  imageForMetadata,
  PixiIcon,
  PixiImageBox,
  PixiRect,
  PixiStats,
  PixiTextBlock,
  textOrFallback,
} from "../shared";
import type { LinkCardPreset } from "../types";

const ProfileBadgeCard = ({
  metadata,
  width,
  height,
}: {
  metadata: GitHubLinkCardMetadata;
  width: number;
  height: number;
}) => {
  const unit = width;
  const avatar = imageForMetadata(metadata, ["avatarUrl", "openGraphUrl"]);

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.04}
        fill={0x052e2b}
      />
      <PixiRect
        box={{ x: unit * 0.08, y: unit * 0.08, width: unit * 0.84, height: height - unit * 0.16 }}
        radius={unit * 0.03}
        fill={0xf8fafc}
      />
      <PixiImageBox
        src={avatar}
        box={{ x: unit * 0.13, y: unit * 0.15, width: unit * 0.19, height: unit * 0.19 }}
        radius={unit * 0.095}
        fit="cover"
        background={0xe2e8f0}
      />
      <PixiIcon
        kind="github"
        x={unit * 0.76}
        y={unit * 0.16}
        size={unit * 0.1}
        color={0x111827}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{ x: unit * 0.13, y: unit * 0.42, width: unit * 0.68, height: unit * 0.08 }}
        color={0x111827}
        fontSize={unit * 0.036}
        fontWeight={900}
      />
      <PixiTextBlock
        text={metadata.subtitle}
        box={{ x: unit * 0.13, y: unit * 0.515, width: unit * 0.62, height: unit * 0.04 }}
        color={0x0f766e}
        fontSize={unit * 0.017}
        fontWeight={820}
      />
      <PixiTextBlock
        text={textOrFallback(metadata.description, "GitHub profile")}
        box={{ x: unit * 0.13, y: unit * 0.6, width: unit * 0.62, height: unit * 0.09 }}
        color={0x334155}
        fontSize={unit * 0.018}
        lineHeight={1.26}
        maxLines={2}
      />
      <PixiStats
        stats={metadata.stats}
        x={unit * 0.13}
        y={unit * 0.75}
        maxWidth={unit * 0.21}
        color={0x052e2b}
        background={0xccfbf1}
        fontSize={unit * 0.013}
        gap={unit * 0.01}
      />
    </pixiContainer>
  );
};

export const githubProfileBadgePreset: LinkCardPreset = {
  id: "github-profile-badge",
  label: "Profile Badge",
  source: "github",
  aspectRatio: 4 / 5,
  initialWidthRatio: 0.43,
  imageSlots: ["avatarUrl", "openGraphUrl"],
  Component: (props) => (
    <ProfileBadgeCard
      metadata={props.metadata as GitHubLinkCardMetadata}
      width={props.width}
      height={props.height}
    />
  ),
};
