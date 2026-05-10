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
} from "@/components/cards/pixiPrimitives";
import type { LinkCardPreset } from "@/config/linkCardPresets";

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
  const pad = unit * 0.075;

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.05}
        fill={0xf6f8fa}
      />
      <PixiRect
        box={{
          x: pad,
          y: pad,
          width: width - pad * 2,
          height: height - pad * 2,
        }}
        radius={unit * 0.03}
        fill={0xffffff}
        stroke={{ color: 0xd0d7de, width: unit * 0.002 }}
      />
      <PixiImageBox
        src={avatar}
        box={{
          x: unit * 0.5 - unit * 0.13,
          y: pad + unit * 0.055,
          width: unit * 0.26,
          height: unit * 0.26,
        }}
        radius={unit * 0.13}
        fit="cover"
        background={0xd0d7de}
      />
      <PixiIcon
        kind="github"
        x={unit * 0.5 - unit * 0.035}
        y={pad + unit * 0.35}
        size={unit * 0.07}
        color={0x24292f}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{
          x: pad + unit * 0.05,
          y: pad + unit * 0.45,
          width: width - pad * 2 - unit * 0.1,
          height: unit * 0.055,
        }}
        color={0x24292f}
        fontSize={unit * 0.031}
        fontWeight={900}
        align="center"
      />
      <PixiTextBlock
        text={metadata.subtitle}
        box={{
          x: pad + unit * 0.05,
          y: pad + unit * 0.505,
          width: width - pad * 2 - unit * 0.1,
          height: unit * 0.035,
        }}
        color={0x57606a}
        fontSize={unit * 0.016}
        fontWeight={700}
        align="center"
      />
      <PixiTextBlock
        text={textOrFallback(metadata.description, "GitHub profile")}
        box={{
          x: pad + unit * 0.07,
          y: pad + unit * 0.58,
          width: width - pad * 2 - unit * 0.14,
          height: unit * 0.1,
        }}
        color={0x24292f}
        fontSize={unit * 0.017}
        lineHeight={1.26}
        maxLines={3}
        align="center"
      />
      <PixiStats
        stats={metadata.stats}
        x={pad + unit * 0.06}
        y={height - pad - unit * 0.12}
        maxWidth={unit * 0.2}
        color={0x24292f}
        background={0xf6f8fa}
        fontSize={unit * 0.0125}
        gap={unit * 0.01}
      />
      <PixiRect
        box={{
          x: pad + unit * 0.07,
          y: height - pad - unit * 0.18,
          width: width - pad * 2 - unit * 0.14,
          height: unit * 0.002,
        }}
        fill={0xd8dee4}
      />
    </pixiContainer>
  );
};

export const githubProfileBadgePreset: LinkCardPreset = {
  id: "github-profile-badge",
  label: "GitHub Profile",
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
