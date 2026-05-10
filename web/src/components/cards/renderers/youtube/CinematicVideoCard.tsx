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
  const pad = unit * 0.038;
  const chromeHeight = unit * 0.075;
  const thumbnailHeight = height * 0.63;

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.024}
        fill={0x0f0f0f}
      />
      <PixiRect
        box={{ x: 0, y: 0, width, height: chromeHeight }}
        radius={unit * 0.024}
        fill={0x0f0f0f}
      />
      <PixiIcon
        kind="youtube"
        x={pad}
        y={unit * 0.021}
        size={unit * 0.036}
        color={0xff0000}
      />
      <PixiTextBlock
        text="YouTube"
        box={{
          x: pad + unit * 0.048,
          y: unit * 0.024,
          width: unit * 0.16,
          height: unit * 0.03,
        }}
        color={0xffffff}
        fontSize={unit * 0.019}
        fontWeight={900}
      />
      <PixiBadge
        text="Subscribe"
        x={width - pad - unit * 0.13}
        y={unit * 0.022}
        width={unit * 0.13}
        height={unit * 0.034}
        radius={unit * 0.017}
        background={0xffffff}
        color={0x0f0f0f}
        fontSize={unit * 0.0125}
        fontWeight={800}
      />
      <PixiImageBox
        src={metadata.thumbnailUrl}
        box={{
          x: pad,
          y: chromeHeight,
          width: width - pad * 2,
          height: thumbnailHeight,
        }}
        radius={unit * 0.018}
        fit="cover"
        background={0x111111}
      />
      <PixiRect
        box={{
          x: pad,
          y: chromeHeight + thumbnailHeight - unit * 0.052,
          width: width - pad * 2,
          height: unit * 0.052,
        }}
        fill={0x000000}
        alpha={0.44}
      />
      <PixiRect
        box={{
          x: pad + unit * 0.018,
          y: chromeHeight + thumbnailHeight - unit * 0.028,
          width: width - pad * 2 - unit * 0.036,
          height: unit * 0.006,
        }}
        radius={unit * 0.003}
        fill={0x717171}
      />
      <PixiRect
        box={{
          x: pad + unit * 0.018,
          y: chromeHeight + thumbnailHeight - unit * 0.028,
          width: (width - pad * 2 - unit * 0.036) * 0.38,
          height: unit * 0.006,
        }}
        radius={unit * 0.003}
        fill={0xff0000}
      />
      <PixiIcon
        kind="play"
        x={unit * 0.444}
        y={chromeHeight + thumbnailHeight * 0.39}
        size={unit * 0.11}
        color={0xffffff}
        alpha={0.94}
      />
      <PixiBadge
        text={metadata.startTimeLabel ?? "12:48"}
        x={width - pad - unit * 0.082}
        y={chromeHeight + thumbnailHeight - unit * 0.092}
        width={unit * 0.07}
        height={unit * 0.031}
        radius={unit * 0.006}
        background={0x000000}
        color={0xffffff}
        fontSize={unit * 0.012}
        fontWeight={800}
      />
      <PixiImageBox
        src={metadata.thumbnailUrl}
        box={{
          x: pad,
          y: chromeHeight + thumbnailHeight + unit * 0.035,
          width: unit * 0.054,
          height: unit * 0.054,
        }}
        radius={unit * 0.027}
        fit="cover"
        background={0x272727}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{
          x: pad + unit * 0.072,
          y: chromeHeight + thumbnailHeight + unit * 0.03,
          width: unit * 0.68,
          height: unit * 0.075,
        }}
        color={0xffffff}
        fontSize={unit * 0.024}
        fontWeight={800}
        lineHeight={1.14}
        maxLines={2}
      />
      <PixiTextBlock
        text={`${textOrFallback(metadata.subtitle, "YouTube")} • 128K views • 2 days ago`}
        box={{
          x: pad + unit * 0.072,
          y: chromeHeight + thumbnailHeight + unit * 0.105,
          width: unit * 0.62,
          height: unit * 0.028,
        }}
        color={0xaaaaaa}
        fontSize={unit * 0.013}
        fontWeight={500}
      />
      <PixiBadge
        text="Like"
        x={width - pad - unit * 0.15}
        y={chromeHeight + thumbnailHeight + unit * 0.04}
        width={unit * 0.064}
        height={unit * 0.033}
        radius={unit * 0.016}
        background={0x272727}
        color={0xf1f1f1}
        fontSize={unit * 0.011}
        fontWeight={700}
      />
      <PixiBadge
        text="Share"
        x={width - pad - unit * 0.078}
        y={chromeHeight + thumbnailHeight + unit * 0.04}
        width={unit * 0.074}
        height={unit * 0.033}
        radius={unit * 0.016}
        background={0x272727}
        color={0xf1f1f1}
        fontSize={unit * 0.011}
        fontWeight={700}
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
