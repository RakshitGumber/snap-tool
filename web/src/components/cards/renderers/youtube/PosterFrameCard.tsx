/* eslint-disable react-refresh/only-export-components */
import type { YouTubeLinkCardMetadata } from "@/libs/linkCards";

import { useEffect, useMemo } from "react";
import { FillGradient } from "pixi.js";

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
  const radius = unit * 0.052;

  const titleFade = useMemo(
    () =>
      new FillGradient({
        type: "linear",
        start: { x: 0.5, y: 0.4 },
        end: { x: 0.5, y: 1 },
        colorStops: [
          { offset: 0, color: "rgba(0,0,0,0)" },
          { offset: 1, color: "rgba(0,0,0,0.9)" },
        ],
        textureSpace: "local",
      }),
    [],
  );

  useEffect(() => () => titleFade.destroy(), [titleFade]);

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={radius}
        fill={0x0d0e11}
        stroke={{ color: 0xffffff, width: unit * 0.0016, alpha: 0.08 }}
      />
      <PixiImageBox
        src={metadata.thumbnailUrl}
        box={{ x: 0, y: 0, width, height }}
        radius={radius}
        fit="cover"
        background={0x101114}
      />
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={radius}
        fill={0x000000}
        alpha={0.14}
      />
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={radius}
        fill={titleFade}
      />
      <PixiRect
        box={{
          x: pad,
          y: pad,
          width: unit * 0.18,
          height: unit * 0.055,
        }}
        radius={unit * 0.028}
        fill={"rgba(0,0,0,0.5)"}
      />
      <PixiIcon
        kind="youtube"
        x={pad + unit * 0.02}
        y={pad + unit * 0.016}
        size={unit * 0.032}
        color={0xff1a1a}
      />
      <PixiTextBlock
        text="Shorts"
        box={{
          x: pad + unit * 0.058,
          y: pad + unit * 0.018,
          width: unit * 0.11,
          height: unit * 0.03,
        }}
        color={0xffffff}
        fontSize={unit * 0.016}
        fontWeight={900}
      />
      <PixiRect
        box={{
          x: width - pad - unit * 0.145,
          y: pad,
          width: unit * 0.145,
          height: unit * 0.055,
        }}
        radius={unit * 0.028}
        fill={"rgba(255,255,255,0.92)"}
        stroke={{ color: 0xff1a1a, width: unit * 0.0018, alpha: 0.9 }}
      />
      <PixiTextBlock
        text="SHORTS"
        box={{
          x: width - pad - unit * 0.145,
          y: pad + unit * 0.016,
          width: unit * 0.145,
          height: unit * 0.03,
        }}
        color={0x0d0e11}
        fontSize={unit * 0.015}
        fontWeight={900}
        align="center"
      />
      <PixiIcon
        kind="play"
        x={unit * 0.41}
        y={height * 0.28}
        size={unit * 0.18}
        color={0xffffff}
        alpha={0.86}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{
          x: pad,
          y: height * 0.6,
          width: width - pad * 2,
          height: unit * 0.25,
        }}
        color={0xffffff}
        fontSize={unit * 0.043}
        fontWeight={900}
        lineHeight={1.06}
        maxLines={2}
      />
      <PixiTextBlock
        text={textOrFallback(metadata.subtitle, "YouTube")}
        box={{
          x: pad,
          y: height - unit * 0.106,
          width: unit * 0.62,
          height: unit * 0.035,
        }}
        color={"rgba(255,255,255,0.88)"}
        fontSize={unit * 0.0185}
        fontWeight={800}
      />
      <PixiBadge
        text={metadata.startTimeLabel ?? "0:31"}
        x={width - pad - unit * 0.11}
        y={height - unit * 0.112}
        width={unit * 0.11}
        height={unit * 0.047}
        radius={unit * 0.016}
        background={"rgba(0,0,0,0.72)"}
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
