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
} from "../shared";
import type { LinkCardPreset } from "../types";

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

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.03}
        fill={0xffffff}
      />
      <PixiRect
        box={{ x: unit * 0.06, y: unit * 0.08, width: unit * 0.88, height: height - unit * 0.16 }}
        radius={unit * 0.024}
        fill={0xf8fafc}
        stroke={{ color: 0xcbd5e1, width: unit * 0.002 }}
      />
      <PixiRect
        box={{ x: unit * 0.06, y: unit * 0.08, width: unit * 0.88, height: unit * 0.115 }}
        radius={unit * 0.024}
        fill={0xe2e8f0}
      />
      <PixiBadge
        text={hostnameFromMetadata(metadata)}
        x={unit * 0.23}
        y={unit * 0.105}
        width={unit * 0.5}
        height={unit * 0.055}
        radius={unit * 0.012}
        background={0xffffff}
        color={0x334155}
        fontSize={unit * 0.013}
        fontWeight={760}
      />
      <PixiImageBox
        src={metadata.faviconUrl}
        box={{ x: unit * 0.12, y: unit * 0.31, width: unit * 0.13, height: unit * 0.13 }}
        radius={unit * 0.019}
        fit="contain"
        background={0xffffff}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{ x: unit * 0.3, y: unit * 0.305, width: unit * 0.52, height: unit * 0.075 }}
        color={0x0f172a}
        fontSize={unit * 0.03}
        fontWeight={900}
      />
      <PixiTextBlock
        text={shortUrl(metadata.originalUrl)}
        box={{ x: unit * 0.3, y: unit * 0.405, width: unit * 0.52, height: unit * 0.04 }}
        color={0x64748b}
        fontSize={unit * 0.014}
      />
      <PixiTextBlock
        text={metadata.description}
        box={{ x: unit * 0.12, y: unit * 0.54, width: unit * 0.68, height: unit * 0.12 }}
        color={0x475569}
        fontSize={unit * 0.017}
        maxLines={3}
        lineHeight={1.28}
      />
      <PixiIcon
        kind="link"
        x={unit * 0.81}
        y={height - unit * 0.17}
        size={unit * 0.065}
        color={0x2563eb}
      />
    </pixiContainer>
  );
};

export const websiteBrowserWindowPreset: LinkCardPreset = {
  id: "website-browser-window",
  label: "Browser Window",
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
