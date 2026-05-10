/* eslint-disable react-refresh/only-export-components */
import type { WebsiteLinkCardMetadata } from "@/libs/linkCards";

import {
  PixiBadge,
  PixiIcon,
  PixiImageBox,
  PixiRect,
  PixiTextBlock,
  hostnameFromMetadata,
} from "@/components/cards/pixiPrimitives";
import type { LinkCardPreset } from "@/config/linkCardPresets";

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
  const pad = unit * 0.055;
  const host = hostnameFromMetadata(metadata);

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.026}
        fill={0xf8fafc}
      />
      <PixiRect
        box={{ x: pad, y: pad, width: width - pad * 2, height: height - pad * 2 }}
        radius={unit * 0.02}
        fill={0xffffff}
        stroke={{ color: 0xcbd5e1, width: unit * 0.0018 }}
      />
      <PixiRect
        box={{
          x: pad,
          y: pad,
          width: width - pad * 2,
          height: height * 0.36,
        }}
        radius={unit * 0.02}
        fill={0xe2e8f0}
      />
      <PixiImageBox
        src={metadata.faviconUrl}
        box={{
          x: pad + unit * 0.04,
          y: pad + unit * 0.05,
          width: unit * 0.12,
          height: unit * 0.12,
        }}
        radius={unit * 0.026}
        fit="contain"
        background={0xffffff}
      />
      <PixiIcon
        kind="globe"
        x={width - pad - unit * 0.12}
        y={pad + unit * 0.06}
        size={unit * 0.08}
        color={0x475569}
      />
      <PixiTextBlock
        text={host.toUpperCase()}
        box={{
          x: pad + unit * 0.04,
          y: height * 0.42,
          width: unit * 0.74,
          height: unit * 0.03,
        }}
        color={0x64748b}
        fontSize={unit * 0.012}
        fontWeight={820}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{
          x: pad + unit * 0.04,
          y: height * 0.49,
          width: unit * 0.72,
          height: unit * 0.085,
        }}
        color={0x0f172a}
        fontSize={unit * 0.03}
        fontWeight={900}
        maxLines={2}
      />
      <PixiTextBlock
        text={metadata.description}
        box={{
          x: pad + unit * 0.04,
          y: height * 0.64,
          width: unit * 0.72,
          height: unit * 0.075,
        }}
        color={0x475569}
        fontSize={unit * 0.015}
        lineHeight={1.25}
        maxLines={2}
      />
      <PixiBadge
        text="Open link"
        x={pad + unit * 0.04}
        y={height - pad - unit * 0.07}
        width={unit * 0.16}
        height={unit * 0.046}
        radius={unit * 0.023}
        background={0x0f172a}
        color={0xffffff}
        fontSize={unit * 0.012}
        fontWeight={900}
      />
    </pixiContainer>
  );
};

export const websiteSocialGlassPreset: LinkCardPreset = {
  id: "website-social-glass",
  label: "Link Preview",
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
