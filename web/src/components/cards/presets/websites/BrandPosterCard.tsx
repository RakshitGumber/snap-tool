/* eslint-disable react-refresh/only-export-components */
import type { WebsiteLinkCardMetadata } from "@/libs/linkCards";

import {
  PixiImageBox,
  PixiRect,
  PixiTextBlock,
  hostnameFromMetadata,
} from "../shared";
import type { LinkCardPreset } from "../types";

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

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.045}
        fill={0x7c2d12}
      />
      <PixiRect
        box={{ x: unit * 0.12, y: unit * 0.12, width: unit * 0.76, height: unit * 0.76 }}
        radius={unit * 0.06}
        fill={0xfed7aa}
        alpha={0.16}
      />
      <PixiImageBox
        src={metadata.faviconUrl}
        box={{ x: unit * 0.31, y: unit * 0.17, width: unit * 0.38, height: unit * 0.38 }}
        radius={unit * 0.07}
        fit="contain"
        background={0xffffff}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{ x: unit * 0.12, y: unit * 0.64, width: unit * 0.76, height: unit * 0.1 }}
        color={0xffffff}
        fontSize={unit * 0.043}
        fontWeight={900}
        align="center"
        maxLines={2}
      />
      <PixiTextBlock
        text={hostnameFromMetadata(metadata)}
        box={{ x: unit * 0.14, y: unit * 0.81, width: unit * 0.72, height: unit * 0.045 }}
        color={0xffedd5}
        fontSize={unit * 0.019}
        fontWeight={800}
        align="center"
      />
    </pixiContainer>
  );
};

export const websiteBrandPosterPreset: LinkCardPreset = {
  id: "website-brand-poster",
  label: "Brand Poster",
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
