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
  const radius = unit * 0.032;
  const thumbRadius = unit * 0.022;

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
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={radius}
        fill={0x0d0e11}
        stroke={{ color: 0xffffff, width: unit * 0.0016, alpha: 0.08 }}
      />
      <PixiImageBox
        src={metadata.thumbnailUrl}
        box={{
          x: pad,
          y: pad,
          width: width - pad * 2,
          height: height - pad * 2,
        }}
        radius={thumbRadius}
        fit="cover"
        background={0x101114}
      />
      <PixiRect
        box={{
          x: pad,
          y: pad,
          width: width - pad * 2,
          height: height - pad * 2,
        }}
        radius={thumbRadius}
        fill={0x000000}
        alpha={0.16}
      />
      <PixiRect
        box={{
          x: pad,
          y: pad + (height - pad * 2) * 0.46,
          width: width - pad * 2,
          height: (height - pad * 2) * 0.54,
        }}
        radius={thumbRadius}
        fill={titleFade}
      />
      <PixiIcon
        kind="play"
        x={width * 0.5 - unit * 0.055}
        y={height * 0.5 - unit * 0.055}
        size={unit * 0.11}
        color={0xffffff}
        alpha={0.88}
      />
      <PixiBadge
        text={metadata.startTimeLabel ?? "12:48"}
        x={width - pad - unit * 0.092}
        y={height - pad - unit * 0.048}
        width={unit * 0.08}
        height={unit * 0.034}
        radius={unit * 0.012}
        background={"rgba(0,0,0,0.72)"}
        color={0xffffff}
        fontSize={unit * 0.013}
        fontWeight={800}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{
          x: pad + unit * 0.03,
          y: height - pad - unit * 0.15,
          width: width - pad * 2 - unit * 0.06,
          height: unit * 0.1,
        }}
        color={0xffffff}
        fontSize={unit * 0.034}
        fontWeight={900}
        lineHeight={1.06}
        maxLines={2}
      />
      <PixiTextBlock
        text={textOrFallback(metadata.subtitle, "YouTube")}
        box={{
          x: pad + unit * 0.03,
          y: height - pad - unit * 0.062,
          width: width - pad * 2 - unit * 0.12,
          height: unit * 0.03,
        }}
        color={"rgba(255,255,255,0.82)"}
        fontSize={unit * 0.016}
        fontWeight={800}
      />
      <PixiRect
        box={{
          x: pad + unit * 0.024,
          y: pad + unit * 0.02,
          width: unit * 0.168,
          height: unit * 0.044,
        }}
        radius={unit * 0.022}
        fill={"rgba(0,0,0,0.48)"}
      />
      <PixiIcon
        kind="youtube"
        x={pad + unit * 0.036}
        y={pad + unit * 0.028}
        size={unit * 0.028}
        color={0xff1a1a}
      />
      <PixiTextBlock
        text="YouTube"
        box={{
          x: pad + unit * 0.07,
          y: pad + unit * 0.028,
          width: unit * 0.12,
          height: unit * 0.03,
        }}
        color={0xffffff}
        fontSize={unit * 0.016}
        fontWeight={900}
      />
    </pixiContainer>
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
