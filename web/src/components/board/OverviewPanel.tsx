import { useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@iconify/react";

import clsx from "clsx";

import {
  CANVAS_BACKGROUND_EFFECT_CONTROLS,
  DEFAULT_CANVAS_BACKGROUND_EFFECTS,
  formatCanvasBackgroundEffectValue,
  type CanvasBackgroundEffectKey,
} from "@/canvas/backgroundEffects";
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

const BACKGROUND_EFFECT_ORDER: CanvasBackgroundEffectKey[] = [
  "hue",
  "saturation",
  "blur",
  "brightness",
  "contrast",
  "opacity",
];

const BACKGROUND_EFFECT_ICONS: Record<CanvasBackgroundEffectKey, string> = {
  hue: "solar:pallete-2-linear",
  saturation: "solar:tuning-2-linear",
  blur: "solar:filters-linear",
  brightness: "solar:sun-2-linear",
  contrast: "solar:slider-minimalistic-horizontal-linear",
  opacity: "solar:droplets-minimalistic-linear",
};

export const BoardOverviewPanel = () => {
  const canvasShell = useCanvasShell();
  const activeBackground = useActiveCanvasBackground();
  const [isBackgroundExpanded, setIsBackgroundExpanded] = useState(false);
  const [activeBackgroundEffect, setActiveBackgroundEffect] =
    useState<CanvasBackgroundEffectKey>("hue");
  const backgroundEffectDragActiveRef = useRef(false);
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
  const updateCanvasBackgroundEffects = useCanvasStore(
    (state) => state.updateCanvasBackgroundEffects,
  );
  const beginHistoryTransaction = useCanvasStore(
    (state) => state.beginHistoryTransaction,
  );
  const endHistoryTransaction = useCanvasStore(
    (state) => state.endHistoryTransaction,
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
  const activeEffectControl =
    CANVAS_BACKGROUND_EFFECT_CONTROLS[activeBackgroundEffect];
  const activeEffectValue = backgroundEffects[activeBackgroundEffect];
  const activeBackgroundEffectSummary = BACKGROUND_EFFECT_ORDER.filter(
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

  useEffect(
    () => () => {
      if (backgroundEffectDragActiveRef.current) {
        backgroundEffectDragActiveRef.current = false;
        endHistoryTransaction();
      }
    },
    [endHistoryTransaction],
  );

  const beginBackgroundEffectDrag = () => {
    if (backgroundEffectDragActiveRef.current || !canvasShell) {
      return;
    }

    backgroundEffectDragActiveRef.current = true;
    beginHistoryTransaction();
  };

  const endBackgroundEffectDrag = () => {
    if (!backgroundEffectDragActiveRef.current) {
      return;
    }

    backgroundEffectDragActiveRef.current = false;
    endHistoryTransaction();
  };

  return (
    <div className="space-y-8 font-sans">
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-title-color">Background</h3>

        {canvasShell ? (
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-border-color shadow-lg transition-all hover:shadow-xl">
            <BoardBackgroundPreview
              background={canvasShell.background}
              effects={backgroundEffects}
              className="h-28 w-full border-b border-border-color/20"
            />
            <div className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-title-color">
                    {activeBackground?.label ?? "Unknown background"}
                  </p>
                  <p className="text-sm capitalize text-secondary-text">
                    {activeBackground?.kind ?? "custom"}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label={
                    isBackgroundExpanded
                      ? "Collapse background effects"
                      : "Expand background effects"
                  }
                  aria-expanded={isBackgroundExpanded}
                  onClick={() =>
                    setIsBackgroundExpanded((currentValue) => !currentValue)
                  }
                  className={clsx(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-color/60 text-title-color transition hover:border-accent/70 hover:text-accent",
                    isBackgroundExpanded && "border-accent/70 text-accent",
                  )}
                >
                  <Icon
                    icon={
                      isBackgroundExpanded
                        ? "solar:alt-arrow-up-linear"
                        : "solar:alt-arrow-down-linear"
                    }
                    className="text-lg"
                  />
                </button>
              </div>
            </div>

            <div
              className={clsx(
                "grid transition-all duration-300 ease-out motion-reduce:transition-none",
                isBackgroundExpanded
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="border-t border-border-color/50 px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {BACKGROUND_EFFECT_ORDER.map((effectId) => {
                      const control =
                        CANVAS_BACKGROUND_EFFECT_CONTROLS[effectId];
                      const isActive = activeBackgroundEffect === effectId;

                      return (
                        <button
                          key={effectId}
                          type="button"
                          onClick={() => setActiveBackgroundEffect(effectId)}
                          className={clsx(
                            "rounded-xl border px-3 py-2 text-left transition",
                            isActive
                              ? "border-accent/70 bg-accent/10 text-accent"
                              : "border-border-color/50 text-title-color hover:border-accent/60 hover:text-accent",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon
                              icon={BACKGROUND_EFFECT_ICONS[effectId]}
                              className="text-base"
                            />
                            <span className="text-sm font-semibold">
                              {control.label}
                            </span>
                          </div>
                          <p
                            className={clsx(
                              "mt-2 text-xs",
                              isActive
                                ? "text-accent/90"
                                : "text-secondary-text",
                            )}
                          >
                            {formatCanvasBackgroundEffectValue(
                              effectId,
                              backgroundEffects[effectId],
                            )}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-2xl border border-border-color/50 bg-card-bg/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon={BACKGROUND_EFFECT_ICONS[activeBackgroundEffect]}
                          className="text-lg text-title-color"
                        />
                        <div>
                          <p className="text-sm font-semibold text-title-color">
                            {activeEffectControl.label}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                        {formatCanvasBackgroundEffectValue(
                          activeBackgroundEffect,
                          activeEffectValue,
                        )}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={activeEffectControl.min}
                      max={activeEffectControl.max}
                      step={activeEffectControl.step}
                      value={activeEffectValue}
                      onPointerDown={beginBackgroundEffectDrag}
                      onPointerUp={endBackgroundEffectDrag}
                      onPointerCancel={endBackgroundEffectDrag}
                      onBlur={endBackgroundEffectDrag}
                      onChange={(event) =>
                        updateCanvasBackgroundEffects({
                          [activeBackgroundEffect]: Number(event.target.value),
                        })
                      }
                      className="mt-4 w-full accent-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-28 w-full max-w-sm items-center justify-center rounded-xl border border-dashed border-border-color/60 bg-black/5">
            <p className="text-sm text-secondary-text">No canvas selected.</p>
          </div>
        )}
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
