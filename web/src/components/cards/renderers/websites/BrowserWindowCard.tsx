/* eslint-disable react-refresh/only-export-components */
import type { WebsiteLinkCardMetadata } from "@/libs/linkCards";

import {
  PixiBadge,
  PixiIcon,
  PixiImageBox,
  PixiRect,
  PixiTextBlock,
  hostnameFromMetadata,
  shortUrl,
} from "@/components/cards/pixiPrimitives";
import type { LinkCardPreset } from "@/config/linkCardPresets";

const BrowserWindowCard = ({
  metadata,
  width,
  height,
}: {
  metadata: WebsiteLinkCardMetadata;
  width: number;
  height: number;
}) => {
  const unit = width;
  const pad = unit * 0.045;
  const chromeHeight = unit * 0.12;
  const host = hostnameFromMetadata(metadata);

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.026}
        fill={0xffffff}
      />
      <PixiRect
        box={{ x: pad, y: pad, width: width - pad * 2, height: height - pad * 2 }}
        radius={unit * 0.018}
        fill={0xf8fafc}
        stroke={{ color: 0xd0d7de, width: unit * 0.0018 }}
      />
      <PixiRect
        box={{ x: pad, y: pad, width: width - pad * 2, height: chromeHeight }}
        radius={unit * 0.018}
        fill={0xeaeef2}
      />
      {[0xe5534b, 0xf6c445, 0x57c785].map((color, index) => (
        <PixiRect
          key={color}
          box={{
            x: pad + unit * 0.028 + index * unit * 0.035,
            y: pad + unit * 0.043,
            width: unit * 0.016,
            height: unit * 0.016,
          }}
          radius={unit * 0.008}
          fill={color}
        />
      ))}
      <PixiBadge
        text={host}
        x={unit * 0.21}
        y={pad + unit * 0.027}
        width={unit * 0.56}
        height={unit * 0.045}
        radius={unit * 0.022}
        background={0xffffff}
        color={0x475569}
        fontSize={unit * 0.012}
        fontWeight={800}
      />
      <PixiImageBox
        src={metadata.faviconUrl}
        box={{
          x: pad + unit * 0.055,
          y: pad + chromeHeight + unit * 0.07,
          width: unit * 0.115,
          height: unit * 0.115,
        }}
        radius={unit * 0.024}
        fit="contain"
        background={0xffffff}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{
          x: pad + unit * 0.2,
          y: pad + chromeHeight + unit * 0.07,
          width: unit * 0.56,
          height: unit * 0.06,
        }}
        color={0x0f172a}
        fontSize={unit * 0.026}
        fontWeight={900}
      />
      <PixiTextBlock
        text={shortUrl(metadata.originalUrl)}
        box={{
          x: pad + unit * 0.2,
          y: pad + chromeHeight + unit * 0.13,
          width: unit * 0.52,
          height: unit * 0.032,
        }}
        color={0x64748b}
        fontSize={unit * 0.013}
      />
      <PixiTextBlock
        text={metadata.description}
        box={{
          x: pad + unit * 0.055,
          y: pad + chromeHeight + unit * 0.22,
          width: unit * 0.7,
          height: unit * 0.11,
        }}
        color={0x475569}
        fontSize={unit * 0.017}
        maxLines={3}
        lineHeight={1.28}
      />
      <PixiIcon
        kind="link"
        x={width - pad - unit * 0.12}
        y={height - pad - unit * 0.1}
        size={unit * 0.065}
        color={0x2563eb}
      />
    </pixiContainer>
  );
};

export const websiteBrowserWindowPreset: LinkCardPreset = {
  id: "website-browser-window",
  label: "Browser Preview",
  source: "website",
  aspectRatio: 16 / 10,
  initialWidthRatio: 0.64,
  imageSlots: ["faviconUrl"],
  Component: (props) => (
    <BrowserWindowCard
      metadata={props.metadata as WebsiteLinkCardMetadata}
      width={props.width}
      height={props.height}
    />
  ),
};
