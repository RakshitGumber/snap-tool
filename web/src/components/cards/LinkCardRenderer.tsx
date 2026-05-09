import type { CSSProperties } from "react";
import { Icon } from "@iconify/react";

import type {
  LinkCardBox,
  LinkCardLayer,
  LinkCardPreset,
  LinkCardSlot,
  LinkCardTextStyle,
} from "@/config/linkCardPresets";
import type { LinkCardMetadata } from "@/libs/linkCards";

type LinkCardRendererProps = {
  preset: LinkCardPreset;
  metadata: LinkCardMetadata;
  width: number;
  height: number;
  className?: string;
};

const px = (value: number) => `${Math.max(0, value)}px`;

const metric = (width: number, ratio = 0) => width * ratio;

const getLayerBoxStyle = (
  box: LinkCardBox,
  width: number,
  height: number,
): CSSProperties => ({
  position: "absolute",
  left: px(box.x * width),
  top: px(box.y * height),
  width: px(box.width * width),
  height: px(box.height * height),
});

const getRadius = (ratio: number | undefined, width: number) =>
  ratio === undefined ? undefined : px(metric(width, ratio));

const getTextValue = (
  metadata: LinkCardMetadata,
  slot: LinkCardSlot,
) => {
  switch (slot) {
    case "title":
      return metadata.title;
    case "subtitle":
      return metadata.subtitle;
    case "description":
      return metadata.description;
    case "originalUrl":
      return metadata.originalUrl;
    case "hostname":
      return "hostname" in metadata ? metadata.hostname : "";
    case "startTimeLabel":
      return "startTimeLabel" in metadata ? metadata.startTimeLabel ?? "" : "";
    default:
      return "";
  }
};

const getImageValue = (
  metadata: LinkCardMetadata,
  slot: LinkCardSlot,
) => {
  switch (slot) {
    case "thumbnailUrl":
      return "thumbnailUrl" in metadata ? metadata.thumbnailUrl : "";
    case "avatarUrl":
      return "avatarUrl" in metadata ? metadata.avatarUrl ?? "" : "";
    case "openGraphUrl":
      return "openGraphUrl" in metadata ? metadata.openGraphUrl : "";
    case "faviconUrl":
      return "faviconUrl" in metadata ? metadata.faviconUrl : "";
    case "imageUrl":
      return "imageUrl" in metadata ? metadata.imageUrl : "";
    default:
      return "";
  }
};

const getStats = (metadata: LinkCardMetadata) => metadata.stats;

const getTextStyle = (
  style: LinkCardTextStyle,
  width: number,
): CSSProperties => ({
  color: style.color,
  fontSize: px(metric(width, style.fontSizeRatio)),
  fontWeight: style.fontWeight,
  lineHeight: style.lineHeight ?? 1.15,
  textAlign: style.align,
  opacity: style.opacity,
});

const getLineClampStyle = (
  lineClamp: number | undefined,
): CSSProperties =>
  lineClamp
    ? {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: lineClamp,
        overflow: "hidden",
      }
    : {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      };

const renderLayer = ({
  layer,
  metadata,
  width,
  height,
}: {
  layer: LinkCardLayer;
  metadata: LinkCardMetadata;
  width: number;
  height: number;
}) => {
  const boxStyle = getLayerBoxStyle(layer.box, width, height);

  switch (layer.kind) {
    case "rect":
      return (
        <div
          key={layer.id}
          style={{
            ...boxStyle,
            background: layer.background,
            borderRadius: getRadius(layer.radiusRatio, width),
            opacity: layer.opacity,
          }}
        />
      );

    case "image": {
      const src = getImageValue(metadata, layer.slot);

      return (
        <div
          key={layer.id}
          style={{
            ...boxStyle,
            overflow: "hidden",
            background: layer.background,
            borderRadius: getRadius(layer.radiusRatio, width),
          }}
        >
          {src ? (
            <img
              src={src}
              alt=""
              className="h-full w-full"
              style={{ objectFit: layer.fit ?? "cover" }}
              draggable={false}
            />
          ) : null}
        </div>
      );
    }

    case "text": {
      const value = getTextValue(metadata, layer.slot) || layer.fallback || "";

      return (
        <div
          key={layer.id}
          style={{
            ...boxStyle,
            ...getTextStyle(layer.style, width),
            ...getLineClampStyle(layer.style.lineClamp),
          }}
        >
          {value}
        </div>
      );
    }

    case "badge": {
      const value = getTextValue(metadata, layer.slot) || layer.fallback || "";

      if (layer.hiddenWhenEmpty && !value) return null;

      return (
        <div
          key={layer.id}
          style={{
            ...boxStyle,
            ...getTextStyle(layer.style, width),
            alignItems: "center",
            background: layer.style.background,
            borderRadius: getRadius(layer.style.radiusRatio, width),
            display: "flex",
            justifyContent: "center",
            overflow: "hidden",
            padding: `${px(metric(width, layer.style.paddingYRatio))} ${px(
              metric(width, layer.style.paddingXRatio),
            )}`,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
      );
    }

    case "icon":
      return (
        <div
          key={layer.id}
          style={{
            ...boxStyle,
            alignItems: "center",
            color: layer.color,
            display: "flex",
            justifyContent: "center",
            opacity: layer.opacity,
          }}
        >
          <Icon
            icon={layer.icon}
            fontSize={Math.min(layer.box.width * width, layer.box.height * height)}
          />
        </div>
      );

    case "statList": {
      const stats = getStats(metadata).slice(0, layer.maxItems);

      return (
        <div
          key={layer.id}
          style={{
            ...boxStyle,
            alignContent: "flex-start",
            display: "flex",
            flexWrap: "wrap",
            gap: px(metric(width, layer.gapRatio)),
            overflow: "hidden",
          }}
        >
          {stats.map((stat) => (
            <span
              key={stat}
              style={{
                background: layer.item.background,
                borderRadius: getRadius(layer.item.radiusRatio, width),
                color: layer.item.color,
                fontSize: px(metric(width, layer.item.fontSizeRatio)),
                fontWeight: layer.item.fontWeight,
                lineHeight: 1.1,
                padding: `${px(metric(width, layer.item.paddingYRatio))} ${px(
                  metric(width, layer.item.paddingXRatio),
                )}`,
                whiteSpace: "nowrap",
              }}
            >
              {stat}
            </span>
          ))}
        </div>
      );
    }
  }
};

export const LinkCardRenderer = ({
  preset,
  metadata,
  width,
  height,
  className,
}: LinkCardRendererProps) => {
  return (
    <div
      className={className}
      style={{
        background: preset.background,
        borderRadius: getRadius(preset.borderRadiusRatio, width),
        height,
        overflow: "hidden",
        position: "relative",
        width,
      }}
    >
      {preset.layers.map((layer) =>
        renderLayer({
          layer,
          metadata,
          width,
          height,
        }),
      )}
    </div>
  );
};
