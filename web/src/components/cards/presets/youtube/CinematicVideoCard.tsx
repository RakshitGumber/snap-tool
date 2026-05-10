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

const CinematicVideoCard = ({
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
        radius={unit * 0.028}
        fill={0x08080c}
      />
      <PixiImageBox
        src={metadata.thumbnailUrl}
        box={{ x: unit * 0.045, y: unit * 0.05, width: unit * 0.91, height: height - unit * 0.1 }}
        radius={unit * 0.025}
        fit="cover"
        background={0x111111}
      />
      <PixiRect
        box={{ x: unit * 0.045, y: height * 0.58, width: unit * 0.91, height: height * 0.37 }}
        radius={unit * 0.025}
        fill={0x050507}
        alpha={0.72}
      />
      <PixiIcon
        kind="play"
        x={unit * 0.43}
        y={height * 0.3}
        size={unit * 0.14}
        color={0xffffff}
        alpha={0.94}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{ x: unit * 0.105, y: height * 0.66, width: unit * 0.62, height: unit * 0.11 }}
        color={0xffffff}
        fontSize={unit * 0.032}
        fontWeight={900}
        lineHeight={1.08}
        maxLines={2}
      />
      <PixiTextBlock
        text={metadata.subtitle}
        box={{ x: unit * 0.105, y: height * 0.84, width: unit * 0.42, height: unit * 0.04 }}
        color={0xfca5a5}
        fontSize={unit * 0.015}
        fontWeight={800}
      />
      <PixiBadge
        text={metadata.startTimeLabel ?? ""}
        x={unit * 0.815}
        y={unit * 0.075}
        width={unit * 0.105}
        height={unit * 0.045}
        radius={unit * 0.009}
        background={0x000000}
        color={0xffffff}
        fontSize={unit * 0.014}
        hiddenWhenEmpty
      />
    </pixiContainer>
  );
};

export const youtubeCinematicPreset: LinkCardPreset = {
  id: "youtube-cinematic-video",
  label: "Cinematic Video",
  source: "youtube",
  aspectRatio: 16 / 9,
  initialWidthRatio: 0.68,
  imageSlots: ["thumbnailUrl"],
  Component: (props) => (
    <CinematicVideoCard
      metadata={props.metadata as YouTubeLinkCardMetadata}
      width={props.width}
      height={props.height}
    />
  ),
};
