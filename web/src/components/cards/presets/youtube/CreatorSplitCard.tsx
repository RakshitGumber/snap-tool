/* eslint-disable react-refresh/only-export-components */
import type { YouTubeLinkCardMetadata } from "@/libs/linkCards";

import {
  PixiIcon,
  PixiImageBox,
  PixiRect,
  PixiTextBlock,
} from "../shared";
import type { LinkCardPreset } from "../types";

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

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.03}
        fill={0xffffff}
      />
      <PixiImageBox
        src={metadata.thumbnailUrl}
        box={{ x: unit * 0.055, y: unit * 0.07, width: unit * 0.56, height: height - unit * 0.14 }}
        radius={unit * 0.022}
        fit="cover"
        background={0x111111}
      />
      <PixiRect
        box={{ x: unit * 0.66, y: unit * 0.07, width: unit * 0.285, height: height - unit * 0.14 }}
        radius={unit * 0.022}
        fill={0x111111}
      />
      <PixiIcon
        kind="youtube"
        x={unit * 0.735}
        y={unit * 0.14}
        size={unit * 0.14}
        color={0xff0033}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{ x: unit * 0.7, y: unit * 0.36, width: unit * 0.2, height: unit * 0.16 }}
        color={0xffffff}
        fontSize={unit * 0.022}
        fontWeight={900}
        lineHeight={1.12}
        maxLines={4}
        align="center"
      />
      <PixiTextBlock
        text={metadata.subtitle}
        box={{ x: unit * 0.7, y: height - unit * 0.14, width: unit * 0.2, height: unit * 0.045 }}
        color={0xfca5a5}
        fontSize={unit * 0.014}
        fontWeight={820}
        align="center"
      />
    </pixiContainer>
  );
};

export const youtubeCreatorSplitPreset: LinkCardPreset = {
  id: "youtube-creator-split",
  label: "Creator Split",
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
