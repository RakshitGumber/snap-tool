/* eslint-disable react-refresh/only-export-components */
import type { YouTubeLinkCardMetadata } from "@/libs/linkCards";

import { useEffect, useMemo } from "react";
import { FillGradient } from "pixi.js";

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
  const unit = width;
  const pad = unit * 0.042;

  const titleFade = useMemo(
    () =>
      new FillGradient({
        type: "linear",
        start: { x: 0.5, y: 0.55 },
        end: { x: 0.5, y: 1 },
        colorStops: [
          { offset: 0, color: "rgba(0,0,0,0)" },
          { offset: 1, color: "rgba(0,0,0,0.86)" },
        ],
        textureSpace: "local",
      }),
    [],
  );

  useEffect(() => () => titleFade.destroy(), [titleFade]);

  return (
    <PixiImageBox
      src={metadata.thumbnailUrl}
      box={{
        x: pad,
        y: pad,
        width: width - pad * 3.55,
        height: height - pad * 2,
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
