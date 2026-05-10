/* eslint-disable react-refresh/only-export-components */
import type { WebsiteLinkCardMetadata } from "@/libs/linkCards";

import {
  PixiImageBox,
  PixiRect,
  PixiTextBlock,
  hostnameFromMetadata,
  shortUrl,
} from "@/components/cards/pixiPrimitives";
import type { LinkCardPreset } from "@/config/linkCardPresets";

const BrandPosterCard = ({
  metadata,
  width,
  height,
}: {
  metadata: WebsiteLinkCardMetadata;
  width: number;
  height: number;
}) => {
  const unit = width;
  const pad = unit * 0.075;
  const host = hostnameFromMetadata(metadata);

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.052}
        fill={0xf8fafc}
      />
      <PixiRect
        box={{
          x: pad,
          y: pad,
          width: width - pad * 2,
          height: height - pad * 2,
        }}
        radius={unit * 0.04}
        fill={0xffffff}
        stroke={{ color: 0xdbe3ea, width: unit * 0.002 }}
      />
      <PixiRect
        box={{
          x: pad,
          y: pad,
          width: width - pad * 2,
          height: unit * 0.19,
        }}
        radius={unit * 0.04}
        fill={0xe2e8f0}
      />
      <PixiImageBox
        src={metadata.faviconUrl}
        box={{
          x: unit * 0.5 - unit * 0.12,
          y: pad + unit * 0.12,
          width: unit * 0.24,
          height: unit * 0.24,
        }}
        radius={unit * 0.05}
        fit="contain"
        background={0xffffff}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{
          x: pad + unit * 0.06,
          y: unit * 0.48,
          width: width - pad * 2 - unit * 0.12,
          height: unit * 0.11,
        }}
        color={0x0f172a}
        fontSize={unit * 0.039}
        fontWeight={900}
        align="center"
        maxLines={2}
      />
      <PixiTextBlock
        text={host}
        box={{
          x: pad + unit * 0.08,
          y: unit * 0.66,
          width: width - pad * 2 - unit * 0.16,
          height: unit * 0.04,
        }}
        color={0x475569}
        fontSize={unit * 0.018}
        fontWeight={800}
        align="center"
      />
      <PixiRect
        box={{
          x: pad + unit * 0.07,
          y: unit * 0.76,
          width: width - pad * 2 - unit * 0.14,
          height: unit * 0.08,
        }}
        radius={unit * 0.04}
        fill={0xf1f5f9}
      />
      <PixiTextBlock
        text={shortUrl(metadata.originalUrl)}
        box={{
          x: pad + unit * 0.1,
          y: unit * 0.785,
          width: width - pad * 2 - unit * 0.2,
          height: unit * 0.03,
        }}
        color={0x2563eb}
        fontSize={unit * 0.014}
        fontWeight={800}
        align="center"
      />
    </pixiContainer>
  );
};

export const websiteBrandPosterPreset: LinkCardPreset = {
  id: "website-brand-poster",
  label: "App Tile",
  source: "website",
  aspectRatio: 1,
  initialWidthRatio: 0.48,
  imageSlots: ["faviconUrl"],
  Component: (props) => (
    <BrandPosterCard
      metadata={props.metadata as WebsiteLinkCardMetadata}
      width={props.width}
      height={props.height}
    />
  ),
};
