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
  const pad = unit * 0.05;
  const radius = unit * 0.03;
  const thumbWidth = unit * 0.6;
  const thumbHeight = height - pad * 2;
  const sideX = pad + thumbWidth + unit * 0.035;
  const sideWidth = width - sideX - pad;

  const sideGlow = useMemo(
    () =>
      new FillGradient({
        type: "linear",
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
        colorStops: [
          { offset: 0, color: "rgba(99,224,160,0.22)" },
          { offset: 0.55, color: "rgba(255,255,255,0)" },
          { offset: 1, color: "rgba(255,26,26,0.14)" },
        ],
        textureSpace: "local",
      }),
    [],
  );

  useEffect(() => () => sideGlow.destroy(), [sideGlow]);

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={radius}
        fill={0xf7f7f9}
        stroke={{ color: 0x0f0f0f, width: unit * 0.0014, alpha: 0.08 }}
      />
      <PixiImageBox
        src={metadata.thumbnailUrl}
        box={{ x: pad, y: pad, width: thumbWidth, height: thumbHeight }}
        radius={unit * 0.022}
        fit="cover"
        background={0xe9eaee}
      />
      <PixiRect
        box={{ x: pad, y: pad, width: thumbWidth, height: thumbHeight }}
        radius={unit * 0.022}
        fill={0x000000}
        alpha={0.06}
      />
      <PixiIcon
        kind="play"
        x={pad + thumbWidth * 0.5 - unit * 0.046}
        y={pad + thumbHeight * 0.5 - unit * 0.046}
        size={unit * 0.092}
        color={0xffffff}
        alpha={0.86}
      />
      <PixiBadge
        text={metadata.startTimeLabel ?? "8:32"}
        x={pad + thumbWidth - unit * 0.095}
        y={pad + thumbHeight - unit * 0.05}
        width={unit * 0.082}
        height={unit * 0.034}
        radius={unit * 0.014}
        background={"rgba(0,0,0,0.72)"}
        color={0xffffff}
        fontSize={unit * 0.013}
        fontWeight={800}
      />
      <PixiRect
        box={{
          x: sideX,
          y: pad,
          width: sideWidth,
          height: thumbHeight,
        }}
        radius={unit * 0.022}
        fill={0xffffff}
        stroke={{ color: 0x0f0f0f, width: unit * 0.0014, alpha: 0.06 }}
      />
      <PixiRect
        box={{
          x: sideX,
          y: pad,
          width: sideWidth,
          height: thumbHeight,
        }}
        radius={unit * 0.022}
        fill={sideGlow}
      />
      <PixiIcon
        kind="youtube"
        x={sideX + unit * 0.02}
        y={pad + unit * 0.026}
        size={unit * 0.035}
        color={0xff1a1a}
      />
      <PixiTextBlock
        text="YouTube"
        box={{
          x: sideX + unit * 0.062,
          y: pad + unit * 0.024,
          width: sideWidth - unit * 0.07,
          height: unit * 0.03,
        }}
        color={0x121316}
        fontSize={unit * 0.016}
        fontWeight={900}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{
          x: sideX + unit * 0.02,
          y: pad + unit * 0.09,
          width: sideWidth - unit * 0.04,
          height: unit * 0.145,
        }}
        color={0x121316}
        fontSize={unit * 0.024}
        fontWeight={900}
        lineHeight={1.08}
        maxLines={4}
      />
      <PixiTextBlock
        text={textOrFallback(metadata.subtitle, "YouTube")}
        box={{
          x: sideX + unit * 0.02,
          y: pad + unit * 0.255,
          width: sideWidth - unit * 0.12,
          height: unit * 0.03,
        }}
        color={0x5b5d68}
        fontSize={unit * 0.015}
        fontWeight={800}
      />
      <PixiBadge
        text="Watch"
        x={sideX + unit * 0.02}
        y={height - pad - unit * 0.058}
        width={Math.min(sideWidth - unit * 0.04, unit * 0.16)}
        height={unit * 0.046}
        radius={unit * 0.023}
        background={0x121316}
        color={0xffffff}
        fontSize={unit * 0.014}
        fontWeight={900}
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
