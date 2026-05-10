/* eslint-disable react-refresh/only-export-components */
import type { GitHubLinkCardMetadata } from "@/libs/linkCards";

import {
  PixiIcon,
  PixiRect,
  PixiStats,
  PixiTextBlock,
  textOrFallback,
} from "@/components/cards/pixiPrimitives";
import type { LinkCardPreset } from "@/config/linkCardPresets";

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
  const pad = unit * 0.055;

  return (
    <pixiContainer>
      <PixiRect
        box={{ x: 0, y: 0, width, height }}
        radius={unit * 0.028}
        fill={0x0d1117}
      />
      <PixiRect
        box={{
          x: pad,
          y: pad,
          width: width - pad * 2,
          height: height - pad * 2,
        }}
        radius={unit * 0.018}
        fill={0x161b22}
        stroke={{ color: 0x30363d, width: unit * 0.002 }}
      />
      <PixiIcon
        kind="github"
        x={pad + unit * 0.03}
        y={pad + unit * 0.032}
        size={unit * 0.07}
        color={0xf0f6fc}
      />
      <PixiTextBlock
        text={metadata.title}
        box={{
          x: pad + unit * 0.12,
          y: pad + unit * 0.035,
          width: unit * 0.55,
          height: unit * 0.055,
        }}
        color={0x58a6ff}
        fontSize={unit * 0.027}
        fontWeight={800}
      />
      <PixiTextBlock
        text="Public repository"
        box={{
          x: width - pad - unit * 0.19,
          y: pad + unit * 0.043,
          width: unit * 0.15,
          height: unit * 0.03,
        }}
        color={0x8b949e}
        fontSize={unit * 0.012}
        fontWeight={700}
        align="right"
      />
      <PixiTextBlock
        text={textOrFallback(metadata.description, "GitHub project")}
        box={{
          x: pad + unit * 0.03,
          y: pad + unit * 0.13,
          width: unit * 0.62,
          height: unit * 0.1,
        }}
        color={0xc9d1d9}
        fontSize={unit * 0.017}
        lineHeight={1.28}
        maxLines={3}
      />
      <PixiStats
        stats={metadata.stats}
        x={pad + unit * 0.03}
        y={pad + unit * 0.28}
        maxWidth={unit * 0.18}
        color={0xc9d1d9}
        background={0x21262d}
        fontSize={unit * 0.012}
        gap={unit * 0.012}
      />
      <PixiRect
        box={{
          x: pad + unit * 0.03,
          y: height - pad - unit * 0.13,
          width: width - pad * 2 - unit * 0.06,
          height: unit * 0.1,
        }}
        radius={unit * 0.012}
        fill={0x0d1117}
        stroke={{ color: 0x30363d, width: unit * 0.0015 }}
      />
      <PixiTextBlock
        text={`$ git clone ${metadata.title}`}
        box={{
          x: pad + unit * 0.055,
          y: height - pad - unit * 0.1,
          width: unit * 0.55,
          height: unit * 0.028,
        }}
        color={0x7ee787}
        fontSize={unit * 0.014}
        fontWeight={700}
      />
      <PixiTextBlock
        text={metadata.subtitle}
        box={{
          x: pad + unit * 0.055,
          y: height - pad - unit * 0.063,
          width: unit * 0.55,
          height: unit * 0.026,
        }}
        color={0x8b949e}
        fontSize={unit * 0.012}
      />
      <PixiIcon
        kind="code"
        x={width - pad - unit * 0.13}
        y={height - pad - unit * 0.105}
        size={unit * 0.07}
        color={0x58a6ff}
      />
    </pixiContainer>
  );
};

export const githubRepoTerminalPreset: LinkCardPreset = {
  id: "github-repo-terminal",
  label: "GitHub Repo",
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
