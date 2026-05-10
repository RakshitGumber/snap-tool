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

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.028}
        fill={0xeef2ff}
      />
      <PixiRect
        box={{ x: unit * 0.06, y: unit * 0.07, width: unit * 0.88, height: height - unit * 0.14 }}
        radius={unit * 0.024}
        fill={0xffffff}
        stroke={{ color: 0xcbd5e1, width: unit * 0.002 }}
      />
      <PixiImageBox
        src={image}
        box={{ x: unit * 0.095, y: unit * 0.12, width: unit * 0.46, height: unit * 0.265 }}
        radius={unit * 0.018}
        fit="cover"
        background={0x0f172a}
      />
      <PixiIcon
        kind="github"
        x={unit * 0.77}
        y={unit * 0.13}
        size={unit * 0.095}
        color={0x111827}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{ x: unit * 0.6, y: unit * 0.28, width: unit * 0.27, height: unit * 0.11 }}
        color={0x111827}
        fontSize={unit * 0.028}
        fontWeight={900}
        maxLines={2}
      />
      <PixiTextBlock
        text={textOrFallback(metadata.description, "GitHub repository")}
        box={{ x: unit * 0.1, y: unit * 0.48, width: unit * 0.66, height: unit * 0.1 }}
        color={0x475569}
        fontSize={unit * 0.017}
        maxLines={2}
        lineHeight={1.25}
      />
      <PixiStats
        stats={metadata.stats}
        x={unit * 0.1}
        y={unit * 0.63}
        maxWidth={unit * 0.19}
        color={0x111827}
        background={0xffedd5}
        fontSize={unit * 0.013}
        gap={unit * 0.012}
      />
    </pixiContainer>
  );
};

export const githubOgGalleryPreset: LinkCardPreset = {
  id: "github-og-gallery",
  label: "OG Gallery",
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
