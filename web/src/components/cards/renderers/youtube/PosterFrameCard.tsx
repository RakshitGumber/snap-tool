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

const PosterFrameCard = ({
  metadata,
  width,
  height,
}: {
  metadata: YouTubeLinkCardMetadata;
  width: number;
  height: number;
}) => {
  const unit = width;
  const pad = unit * 0.055;

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.048}
        fill={0x0f0f0f}
      />
      <PixiImageBox
        src={metadata.thumbnailUrl}
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.048}
        fit="cover"
        background={0x111111}
      />
      <PixiRect
        box={{ x: 0, y: height * 0.44, width, height: height * 0.56 }}
        fill={0x000000}
        alpha={0.72}
      />
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.048}
        fill={0x000000}
        alpha={0.16}
      />
      <PixiIcon
        kind="youtube"
        x={pad}
        y={pad}
        size={unit * 0.082}
        color={0xff0000}
      />
      <PixiBadge
        text="Shorts"
        x={width - pad - unit * 0.17}
        y={pad + unit * 0.008}
        width={unit * 0.17}
        height={unit * 0.052}
        radius={unit * 0.026}
        background={0xffffff}
        color={0x0f0f0f}
        fontSize={unit * 0.018}
        fontWeight={900}
      />
      <PixiIcon
        kind="play"
        x={unit * 0.395}
        y={height * 0.31}
        size={unit * 0.21}
        color={0xffffff}
        alpha={0.92}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{
          x: pad,
          y: height * 0.62,
          width: width - pad * 2,
          height: unit * 0.25,
        }}
        color={0xffffff}
        fontSize={unit * 0.046}
        fontWeight={900}
        lineHeight={1.08}
        maxLines={3}
      />
      <PixiImageBox
        src={metadata.thumbnailUrl}
        box={{
          x: pad,
          y: height - unit * 0.15,
          width: unit * 0.075,
          height: unit * 0.075,
        }}
        radius={unit * 0.038}
        fit="cover"
        background={0x272727}
      />
      <PixiTextBlock
        text={textOrFallback(metadata.subtitle, "YouTube")}
        box={{
          x: pad + unit * 0.095,
          y: height - unit * 0.14,
          width: unit * 0.45,
          height: unit * 0.035,
        }}
        color={0xffffff}
        fontSize={unit * 0.018}
        fontWeight={800}
      />
      <PixiTextBlock
        text="Swipe style video card"
        box={{
          x: pad + unit * 0.095,
          y: height - unit * 0.1,
          width: unit * 0.45,
          height: unit * 0.03,
        }}
        color={0xd4d4d4}
        fontSize={unit * 0.014}
      />
      <PixiBadge
        text={metadata.startTimeLabel ?? "0:31"}
        x={width - pad - unit * 0.11}
        y={height - unit * 0.13}
        width={unit * 0.11}
        height={unit * 0.047}
        radius={unit * 0.014}
        background={0x0f0f0f}
        color={0xffffff}
        fontSize={unit * 0.016}
        fontWeight={900}
      />
    </pixiContainer>
  );
};

export const youtubePosterFramePreset: LinkCardPreset = {
  id: "youtube-poster-frame",
  label: "YouTube Shorts",
  source: "youtube",
  aspectRatio: 4 / 5,
  initialWidthRatio: 0.42,
  imageSlots: ["thumbnailUrl"],
  Component: (props) => (
    <PosterFrameCard
      metadata={props.metadata as YouTubeLinkCardMetadata}
      width={props.width}
      height={props.height}
    />
  ),
};
