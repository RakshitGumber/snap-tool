import { useEffect, useMemo } from "react";

import clsx from "clsx";

import {
  CANVAS_BACKGROUND_EFFECT_CONTROLS,
  CANVAS_BACKGROUND_EFFECT_ORDER,
  DEFAULT_CANVAS_BACKGROUND_EFFECTS,
  formatCanvasBackgroundEffectValue,
} from "@/canvas/backgroundEffects";
import { formatCanvasBackgroundKind } from "@/canvas/backgrounds";
import { useEditorUiStore } from "@/stores/useEditorUiStore";
import {
  useActiveCanvasBackground,
  useCanvasShell,
  useCanvasStore,
} from "@/stores/useCanvasStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import type {
  BoardImageItem,
  BoardImagePositionPreset,
  BoardTextItem,
} from "@/types/canvas";

import { BoardBackgroundPreview } from "./BackgroundPreview";

const formatImageDimensions = (image: BoardImageItem) =>
  `${image.width} x ${image.height}`;

const truncateText = (value: string) =>
  value.length > 48 ? `${value.slice(0, 45).trimEnd()}...` : value;

const IMAGE_POSITION_PRESETS: Array<{
  id: BoardImagePositionPreset;
  label: string;
}> = [
  { id: "center", label: "Center" },
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
];

export const BoardOverviewPanel = () => {
  const canvasShell = useCanvasShell();
  const activeBackgroundPreset = useActiveCanvasBackground();
  const imageOrder = useCanvasStore((state) => state.imageOrder);
  const imagesById = useCanvasStore((state) => state.imagesById);
  const textOrder = useCanvasStore((state) => state.textOrder);
  const textsById = useCanvasStore((state) => state.textsById);
  const assetMetaById = useUploadLibraryStore((state) => state.assetMetaById);
  const resolvedMediaByAssetId = useUploadLibraryStore(
    (state) => state.resolvedMediaByAssetId,
  );
  const resolveAssetMedia = useUploadLibraryStore(
    (state) => state.resolveAssetMedia,
  );
  const selectedImageId = useEditorUiStore((state) => state.selectedImageId);
  const selectImage = useEditorUiStore((state) => state.selectImage);
  const positionImageOnCanvas = useCanvasStore(
    (state) => state.positionImageOnCanvas,
  );
  const images = useMemo(
    () =>
      imageOrder
        .map((imageId) => imagesById[imageId])
        .filter((image): image is BoardImageItem => image !== undefined),
    [imageOrder, imagesById],
  );
  const texts = useMemo(
    () =>
      textOrder
        .map((textId) => textsById[textId])
        .filter((text): text is BoardTextItem => text !== undefined),
    [textOrder, textsById],
  );
  const backgroundEffects =
    canvasShell?.backgroundEffects ?? DEFAULT_CANVAS_BACKGROUND_EFFECTS;
  const background = canvasShell?.background ?? activeBackgroundPreset?.value ?? null;
  const activeBackgroundAssetId =
    background?.kind === "image" ? background.assetId ?? null : null;
  const activeBackgroundAsset = activeBackgroundAssetId
    ? assetMetaById[activeBackgroundAssetId] ?? null
    : null;
  const backgroundPreviewSrc =
    background?.kind === "image"
      ? activeBackgroundAssetId
        ? resolvedMediaByAssetId[activeBackgroundAssetId]?.preview?.src ?? null
        : background.previewSrc ?? background.src ?? null
      : null;
  const backgroundPreviewWidth =
    background?.kind === "image"
      ? activeBackgroundAsset?.width ?? background.width ?? null
      : null;
  const backgroundPreviewHeight =
    background?.kind === "image"
      ? activeBackgroundAsset?.height ?? background.height ?? null
      : null;
  const backgroundLabel =
    activeBackgroundPreset?.label ??
    activeBackgroundAsset?.name ??
    (background?.kind === "solid"
      ? "Solid background"
      : background?.kind === "gradient"
        ? "Gradient background"
        : background?.kind === "image"
          ? "Image background"
          : "White");

  const activeBackgroundEffectSummary = CANVAS_BACKGROUND_EFFECT_ORDER.filter(
    (effectId) =>
      backgroundEffects[effectId] !==
      DEFAULT_CANVAS_BACKGROUND_EFFECTS[effectId],
  ).map(
    (effectId) =>
      `${CANVAS_BACKGROUND_EFFECT_CONTROLS[effectId].label}: ${formatCanvasBackgroundEffectValue(
        effectId,
        backgroundEffects[effectId],
      )}`,
  );

  useEffect(() => {
    for (const image of images) {
      if (!resolvedMediaByAssetId[image.assetId]?.preview) {
        void resolveAssetMedia(image.assetId, "preview");
      }
    }
  }, [images, resolvedMediaByAssetId, resolveAssetMedia]);

  useEffect(() => {
    if (
      activeBackgroundAssetId &&
      !resolvedMediaByAssetId[activeBackgroundAssetId]?.preview
    ) {
      void resolveAssetMedia(activeBackgroundAssetId, "preview");
    }
  }, [activeBackgroundAssetId, resolveAssetMedia, resolvedMediaByAssetId]);

  return (
    <div className="space-y-8 font-sans">
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-title-color">Background</h3>
        <div className="overflow-hidden rounded-xl border border-border-color/40">
          <BoardBackgroundPreview
            background={background}
            effects={backgroundEffects}
            imageSrc={backgroundPreviewSrc}
            imageWidth={backgroundPreviewWidth}
            imageHeight={backgroundPreviewHeight}
            className="h-24 w-full border-b border-border-color/20"
          />
          <div className="space-y-1 px-4 py-3">
            <p className="text-sm font-semibold text-title-color">
              {backgroundLabel}
            </p>
            <p className="text-sm capitalize text-secondary-text">
              {formatCanvasBackgroundKind(background)}
            </p>
            <p className="text-sm text-secondary-text">
              {activeBackgroundEffectSummary.length
                ? activeBackgroundEffectSummary.join(" · ")
                : "No background effects applied."}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-title-color">Images</h3>
        {images.length ? (
          <div className="space-y-3">
            {images.map((image) => {
              const asset = assetMetaById[image.assetId];
              const media = resolvedMediaByAssetId[image.assetId]?.preview;

              return (
                <div
                  key={image.id}
                  className={clsx(
                    "space-y-3 rounded-xl border px-3 py-3",
                    selectedImageId === image.id
                      ? "border-accent/70 bg-accent/5"
                      : "border-border-color/40",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectImage(image.id)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    {media ? (
                      <img
                        src={media.src}
                        alt={image.alt}
                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                        draggable={false}
                      />
                    ) : null}

                    <div className="min-w-0">
                      <p className="truncate text-sm text-title-color">
                        {asset?.name ?? image.alt ?? "Image"}
                      </p>
                      <p className="text-sm text-secondary-text">
                        {formatImageDimensions(image)}
                      </p>
                    </div>
                  </button>

                  <div className="flex flex-wrap gap-2">
                    {IMAGE_POSITION_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          selectImage(image.id);
                          positionImageOnCanvas(image.id, preset.id);
                        }}
                        className="rounded-full border border-border-color/60 px-3 py-1 text-xs font-semibold text-title-color transition hover:border-accent/70 hover:text-accent"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-secondary-text">
            No images on this canvas.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-title-color">Text</h3>
        {texts.length ? (
          <div className="space-y-3">
            {texts.map((text) => (
              <div
                key={text.id}
                className="rounded-xl border border-border-color/40 px-3 py-3"
              >
                <p className="text-sm font-semibold text-title-color">
                  {truncateText(text.text)}
                </p>
                <p className="mt-1 text-sm text-secondary-text">
                  {text.fontFamily} · {text.fontSize}px · {text.align}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-secondary-text">No text on this canvas.</p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-bold text-title-color">
          Effects / Filters
        </h3>
        <p className="text-sm text-secondary-text">
          {activeBackgroundEffectSummary.length
            ? activeBackgroundEffectSummary.join(" · ")
            : "No background effects applied."}
        </p>
      </section>
    </div>
  );
};
