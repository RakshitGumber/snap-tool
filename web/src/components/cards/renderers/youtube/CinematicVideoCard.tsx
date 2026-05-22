/* eslint-disable react-refresh/only-export-components */
import type { YouTubeLinkCardMetadata } from "@/libs/linkCards";

import { PixiImageBox } from "@/components/cards/pixiPrimitives";
import type { LinkCardPreset } from "@/config/linkCardPresets";

const CinematicVideoCard = ({
  metadata,
  width,
  height,
}: {
  metadata: YouTubeLinkCardMetadata;
  width: number;
  height: number;
}) => {
  return (
      <PixiImageBox
        src={metadata.thumbnailUrl}
        box={{
          x: 0,
          y: 0,
          width,
          height,
        }}
        fit="contain"
        background={0x101114}
      />
  );
};

export const youtubeCinematicPreset: LinkCardPreset = {
  id: "youtube-cinematic-video",
  label: "YouTube Watch",
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
