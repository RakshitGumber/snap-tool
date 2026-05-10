/* eslint-disable react-refresh/only-export-components */
import type { YouTubeLinkCardMetadata } from "@/libs/linkCards";

import {
  PixiBadge,
  PixiIcon,
  PixiImageBox,
  PixiRect,
  PixiTextBlock,
} from "../shared";
import type { LinkCardPreset } from "../types";

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

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.04}
        fill={0x450a0a}
      />
      <PixiImageBox
        src={metadata.thumbnailUrl}
        box={{ x: unit * 0.09, y: unit * 0.1, width: unit * 0.82, height: height * 0.48 }}
        radius={unit * 0.027}
        fit="cover"
        background={0x111111}
      />
      <PixiIcon
        kind="play"
        x={unit * 0.405}
        y={height * 0.28}
        size={unit * 0.19}
        color={0xffffff}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{ x: unit * 0.1, y: height * 0.67, width: unit * 0.8, height: unit * 0.18 }}
        color={0xffffff}
        fontSize={unit * 0.045}
        fontWeight={900}
        lineHeight={1.05}
        maxLines={3}
        align="center"
      />
      <PixiBadge
        text={metadata.subtitle}
        x={unit * 0.22}
        y={height * 0.88}
        width={unit * 0.56}
        height={unit * 0.065}
        radius={unit * 0.025}
        background={0xfff1f2}
        color={0xc1123e}
        fontSize={unit * 0.017}
        fontWeight={850}
      />
    </pixiContainer>
  );
};

export const youtubePosterFramePreset: LinkCardPreset = {
  id: "youtube-poster-frame",
  label: "Poster Frame",
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
