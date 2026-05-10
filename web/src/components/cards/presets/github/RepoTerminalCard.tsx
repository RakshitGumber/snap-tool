/* eslint-disable react-refresh/only-export-components */
import type { GitHubLinkCardMetadata } from "@/libs/linkCards";

import {
  PixiIcon,
  PixiRect,
  PixiStats,
  PixiTextBlock,
  textOrFallback,
} from "../shared";
import type { LinkCardPreset } from "../types";

const RepoTerminalCard = ({
  metadata,
  width,
  height,
}: {
  metadata: GitHubLinkCardMetadata;
  width: number;
  height: number;
}) => {
  const unit = width;

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.035}
        fill={0x0b1020}
      />
      <PixiRect
        box={{
          x: unit * 0.055,
          y: unit * 0.06,
          width: unit * 0.89,
          height: height - unit * 0.12,
        }}
        radius={unit * 0.025}
        fill={0x111827}
        stroke={{ color: 0x334155, width: unit * 0.0025, alpha: 0.8 }}
      />
      <PixiIcon
        kind="github"
        x={unit * 0.095}
        y={unit * 0.105}
        size={unit * 0.105}
        color={0xffffff}
        alpha={0.92}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{
          x: unit * 0.235,
          y: unit * 0.115,
          width: unit * 0.58,
          height: unit * 0.08,
        }}
        color={0xffffff}
        fontSize={unit * 0.035}
        fontWeight={900}
      />
      <PixiTextBlock
        text={metadata.subtitle}
        box={{
          x: unit * 0.235,
          y: unit * 0.18,
          width: unit * 0.45,
          height: unit * 0.04,
        }}
        color={0x7dd3fc}
        fontSize={unit * 0.016}
        fontWeight={760}
      />
      <PixiTextBlock
        text={textOrFallback(metadata.description, "GitHub project")}
        box={{
          x: unit * 0.1,
          y: unit * 0.305,
          width: unit * 0.58,
          height: unit * 0.14,
        }}
        color={0xcbd5e1}
        fontSize={unit * 0.019}
        lineHeight={1.28}
        maxLines={3}
      />
      <PixiStats
        stats={metadata.stats}
        x={unit * 0.1}
        y={unit * 0.53}
        maxWidth={unit * 0.2}
        color={0xccfbf1}
        background={0x134e4a}
        fontSize={unit * 0.0135}
        gap={unit * 0.012}
      />
      <PixiRect
        box={{
          x: unit * 0.72,
          y: unit * 0.28,
          width: unit * 0.18,
          height: unit * 0.18,
        }}
        radius={unit * 0.03}
        fill={0x14b8a6}
        alpha={0.18}
      />
      <PixiIcon
        kind="code"
        x={unit * 0.755}
        y={unit * 0.315}
        size={unit * 0.11}
        color={0x5eead4}
      />
    </pixiContainer>
  );
};

export const githubRepoTerminalPreset: LinkCardPreset = {
  id: "github-repo-terminal",
  label: "Repo Terminal",
  source: "github",
  aspectRatio: 16 / 10,
  initialWidthRatio: 0.66,
  imageSlots: [],
  Component: (props) => (
    <RepoTerminalCard
      metadata={props.metadata as GitHubLinkCardMetadata}
      width={props.width}
      height={props.height}
    />
  ),
};
