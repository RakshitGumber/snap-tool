/* eslint-disable react-refresh/only-export-components */
import type { YouTubeLinkCardMetadata } from "@/libs/linkCards";

import {
  PixiBadge,
  PixiIcon,
  PixiImageBox,
  PixiRect,
  PixiTextBlock,
  textOrFallback,
} from "@/components/cards/pixiPrimitives";
import type { LinkCardPreset } from "@/config/linkCardPresets";

const CreatorSplitCard = ({
  metadata,
  width,
  height,
}: {
  metadata: YouTubeLinkCardMetadata;
  width: number;
  height: number;
}) => {
  const unit = width;
  const pad = unit * 0.045;
  const thumbWidth = unit * 0.54;
  const thumbHeight = height - pad * 2;

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.026}
        fill={0xffffff}
      />
      <PixiImageBox
        src={metadata.thumbnailUrl}
        box={{ x: pad, y: pad, width: thumbWidth, height: thumbHeight }}
        radius={unit * 0.018}
        fit="cover"
        background={0xf1f1f1}
      />
      <PixiIcon
        kind="play"
        x={pad + thumbWidth * 0.42}
        y={pad + thumbHeight * 0.39}
        size={unit * 0.084}
        color={0xffffff}
        alpha={0.9}
      />
      <PixiBadge
        text={metadata.startTimeLabel ?? "8:32"}
        x={pad + thumbWidth - unit * 0.086}
        y={pad + thumbHeight - unit * 0.044}
        width={unit * 0.07}
        height={unit * 0.03}
        radius={unit * 0.006}
        background={0x000000}
        color={0xffffff}
        fontSize={unit * 0.012}
        fontWeight={800}
      />
      <PixiRect
        box={{
          x: pad + thumbWidth + unit * 0.035,
          y: pad,
          width: unit * 0.33,
          height: thumbHeight,
        }}
        radius={unit * 0.018}
        fill={0xf9f9f9}
        stroke={{ color: 0xe5e5e5, width: unit * 0.0015 }}
      />
      <PixiIcon
        kind="youtube"
        x={pad + thumbWidth + unit * 0.055}
        y={pad + unit * 0.035}
        size={unit * 0.052}
        color={0xff0000}
      />
      <PixiTextBlock
        text="Up next"
        box={{
          x: pad + thumbWidth + unit * 0.12,
          y: pad + unit * 0.046,
          width: unit * 0.16,
          height: unit * 0.03,
        }}
        color={0x0f0f0f}
        fontSize={unit * 0.018}
        fontWeight={900}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{
          x: pad + thumbWidth + unit * 0.055,
          y: pad + unit * 0.13,
          width: unit * 0.25,
          height: unit * 0.13,
        }}
        color={0x0f0f0f}
        fontSize={unit * 0.021}
        fontWeight={800}
        lineHeight={1.18}
        maxLines={4}
      />
      <PixiTextBlock
        text={textOrFallback(metadata.subtitle, "YouTube")}
        box={{
          x: pad + thumbWidth + unit * 0.055,
          y: pad + unit * 0.285,
          width: unit * 0.24,
          height: unit * 0.03,
        }}
        color={0x606060}
        fontSize={unit * 0.013}
        fontWeight={700}
      />
      <PixiTextBlock
        text="Recommended for you"
        box={{
          x: pad + thumbWidth + unit * 0.055,
          y: pad + unit * 0.33,
          width: unit * 0.24,
          height: unit * 0.03,
        }}
        color={0x606060}
        fontSize={unit * 0.012}
      />
      <PixiBadge
        text="Watch"
        x={pad + thumbWidth + unit * 0.055}
        y={height - pad - unit * 0.055}
        width={unit * 0.12}
        height={unit * 0.042}
        radius={unit * 0.021}
        background={0x0f0f0f}
        color={0xffffff}
        fontSize={unit * 0.013}
        fontWeight={800}
      />
    </pixiContainer>
  );
};

export const youtubeCreatorSplitPreset: LinkCardPreset = {
  id: "youtube-creator-split",
  label: "YouTube Feed",
  source: "youtube",
  aspectRatio: 16 / 10,
  initialWidthRatio: 0.66,
  imageSlots: ["thumbnailUrl"],
  Component: (props) => (
    <CreatorSplitCard
      metadata={props.metadata as YouTubeLinkCardMetadata}
      width={props.width}
      height={props.height}
    />
  ),
};
