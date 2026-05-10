/* eslint-disable react-refresh/only-export-components */
import type { WebsiteLinkCardMetadata } from "@/libs/linkCards";

import {
  PixiBadge,
  PixiIcon,
  PixiImageBox,
  PixiRect,
  PixiTextBlock,
  hostnameFromMetadata,
} from "../shared";
import type { LinkCardPreset } from "../types";

const SocialGlassCard = ({
  metadata,
  width,
  height,
}: {
  metadata: WebsiteLinkCardMetadata;
  width: number;
  height: number;
}) => {
  const unit = width;

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.03}
        fill={0x0f172a}
      />
      <PixiRect
        box={{ x: unit * 0.07, y: unit * 0.08, width: unit * 0.86, height: height - unit * 0.16 }}
        radius={unit * 0.03}
        fill={0xffffff}
        alpha={0.12}
        stroke={{ color: 0xffffff, width: unit * 0.002, alpha: 0.22 }}
      />
      <PixiImageBox
        src={metadata.faviconUrl}
        box={{ x: unit * 0.12, y: unit * 0.16, width: unit * 0.13, height: unit * 0.13 }}
        radius={unit * 0.02}
        fit="contain"
        background={0xffffff}
      />
      <PixiIcon
        kind="globe"
        x={unit * 0.8}
        y={unit * 0.16}
        size={unit * 0.08}
        color={0xbfdbfe}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{ x: unit * 0.12, y: unit * 0.4, width: unit * 0.68, height: unit * 0.11 }}
        color={0xffffff}
        fontSize={unit * 0.036}
        fontWeight={900}
        maxLines={2}
      />
      <PixiTextBlock
        text={metadata.description}
        box={{ x: unit * 0.12, y: unit * 0.58, width: unit * 0.68, height: unit * 0.08 }}
        color={0xdbeafe}
        fontSize={unit * 0.016}
        lineHeight={1.25}
        maxLines={2}
      />
      <PixiBadge
        text={hostnameFromMetadata(metadata)}
        x={unit * 0.12}
        y={height - unit * 0.13}
        width={unit * 0.42}
        height={unit * 0.055}
        radius={unit * 0.015}
        background={0x334155}
        color={0xffffff}
        fontSize={unit * 0.013}
        fontWeight={820}
      />
    </pixiContainer>
  );
};

export const websiteSocialGlassPreset: LinkCardPreset = {
  id: "website-social-glass",
  label: "Social Glass",
  source: "website",
  aspectRatio: 16 / 9,
  initialWidthRatio: 0.64,
  imageSlots: ["faviconUrl"],
  Component: (props) => (
    <SocialGlassCard
      metadata={props.metadata as WebsiteLinkCardMetadata}
      width={props.width}
      height={props.height}
    />
  ),
};
