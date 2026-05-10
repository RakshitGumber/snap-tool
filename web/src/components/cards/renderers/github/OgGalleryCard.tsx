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

const OgGalleryCard = ({
  metadata,
  width,
  height,
}: {
  metadata: GitHubLinkCardMetadata;
  width: number;
  height: number;
}) => {
  const unit = width;
  const image = imageForMetadata(metadata, ["openGraphUrl", "avatarUrl"]);
  const pad = unit * 0.052;

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.026}
        fill={0xf6f8fa}
      />
      <PixiRect
        box={{ x: pad, y: pad, width: width - pad * 2, height: height - pad * 2 }}
        radius={unit * 0.018}
        fill={0xffffff}
        stroke={{ color: 0xd0d7de, width: unit * 0.0018 }}
      />
      <PixiImageBox
        src={image}
        box={{
          x: pad + unit * 0.025,
          y: pad + unit * 0.025,
          width: unit * 0.44,
          height: height - pad * 2 - unit * 0.05,
        }}
        radius={unit * 0.014}
        fit="cover"
        background={0x24292f}
      />
      <PixiIcon
        kind="github"
        x={unit * 0.58}
        y={pad + unit * 0.035}
        size={unit * 0.065}
        color={0x24292f}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{
          x: unit * 0.66,
          y: pad + unit * 0.04,
          width: unit * 0.24,
          height: unit * 0.075,
        }}
        color={0x0969da}
        fontSize={unit * 0.022}
        fontWeight={900}
        maxLines={2}
      />
      <PixiTextBlock
        text={textOrFallback(metadata.description, "GitHub repository")}
        box={{
          x: unit * 0.58,
          y: pad + unit * 0.17,
          width: unit * 0.32,
          height: unit * 0.13,
        }}
        color={0x57606a}
        fontSize={unit * 0.015}
        maxLines={4}
        lineHeight={1.25}
      />
      <PixiStats
        stats={metadata.stats}
        x={unit * 0.58}
        y={height - pad - unit * 0.11}
        maxWidth={unit * 0.15}
        color={0x24292f}
        background={0xf6f8fa}
        fontSize={unit * 0.0115}
        gap={unit * 0.009}
      />
      <PixiTextBlock
        text="github.com"
        box={{
          x: unit * 0.58,
          y: height - pad - unit * 0.045,
          width: unit * 0.2,
          height: unit * 0.025,
        }}
        color={0x6e7781}
        fontSize={unit * 0.0115}
        fontWeight={700}
      />
    </pixiContainer>
  );
};

export const githubOgGalleryPreset: LinkCardPreset = {
  id: "github-og-gallery",
  label: "GitHub Preview",
  source: "github",
  aspectRatio: 16 / 9,
  initialWidthRatio: 0.68,
  imageSlots: ["openGraphUrl", "avatarUrl"],
  Component: (props) => (
    <OgGalleryCard
      metadata={props.metadata as GitHubLinkCardMetadata}
      width={props.width}
      height={props.height}
    />
  ),
};
