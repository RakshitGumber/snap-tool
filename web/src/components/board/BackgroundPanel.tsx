import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import {
  CANVAS_BACKGROUND_EFFECT_CONTROLS,
  CANVAS_BACKGROUND_EFFECT_ORDER,
  DEFAULT_CANVAS_BACKGROUND_EFFECTS,
  formatCanvasBackgroundEffectValue,
  type CanvasBackgroundEffectKey,
} from "@/canvas/backgroundEffects";
import {
  cycleCanvasBackgroundImageFit,
  formatCanvasBackgroundKind,
  isCanvasBackgroundImage,
  isCanvasBackgroundImageMovable,
} from "@/canvas/backgrounds";
import {
  useCanvasBackgroundPresetGroups,
  useConfigStore,
} from "@/stores/useConfigStore";
import { useEditorUiStore } from "@/stores/useEditorUiStore";
import {
  useActiveCanvasBackground,
  useCanvasShell,
  useCanvasStore,
} from "@/stores/useCanvasStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";

import { BoardBackgroundPreview } from "./BackgroundPreview";

const BACKGROUND_EFFECT_ICONS: Record<CanvasBackgroundEffectKey, string> = {
  hue: "solar:pallete-2-linear",
  saturation: "solar:tuning-2-linear",
  blur: "solar:filters-linear",
  brightness: "solar:sun-2-linear",
  contrast: "solar:slider-minimalistic-horizontal-linear",
  opacity: "solar:droplets-minimalistic-linear",
};

const formatFitLabel = (value: string) =>
  value.slice(0, 1).toUpperCase() + value.slice(1);

export const BoardBackgroundPanel = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundPresetGroups = useCanvasBackgroundPresetGroups();
  const canvasShell = useCanvasShell();
  const activeBackgroundPreset = useActiveCanvasBackground();
  const backgroundEffectDragActiveRef = useRef(false);
  const [isBackgroundExpanded, setIsBackgroundExpanded] = useState(false);
  const [activeBackgroundEffect, setActiveBackgroundEffect] =
    useState<CanvasBackgroundEffectKey>("hue");
  const [isUploading, setIsUploading] = useState(false);
  const setDefaultBackgroundPresetId = useConfigStore(
    (state) => state.setDefaultBackgroundPresetId,
  );
  const isBackgroundMoveMode = useEditorUiStore(
    (state) => state.isBackgroundMoveMode,
  );
  const setBackgroundMoveMode = useEditorUiStore(
    (state) => state.setBackgroundMoveMode,
  );
  const applyBackgroundToCanvas = useCanvasStore(
    (state) => state.applyBackgroundToCanvas,
  );
  const applySolidColorBackground = useCanvasStore(
    (state) => state.applySolidColorBackground,
  );
  const applyAssetBackgroundToCanvas = useCanvasStore(
    (state) => state.applyAssetBackgroundToCanvas,
  );
  const updateCanvasBackgroundEffects = useCanvasStore(
    (state) => state.updateCanvasBackgroundEffects,
  );
  const resetCanvasBackgroundEffects = useCanvasStore(
    (state) => state.resetCanvasBackgroundEffects,
  );
  const updateCanvasBackgroundImage = useCanvasStore(
    (state) => state.updateCanvasBackgroundImage,
  );
  const beginHistoryTransaction = useCanvasStore(
    (state) => state.beginHistoryTransaction,
  );
  const endHistoryTransaction = useCanvasStore(
    (state) => state.endHistoryTransaction,
  );
  const assetMetaById = useUploadLibraryStore((state) => state.assetMetaById);
  const resolvedMediaByAssetId = useUploadLibraryStore(
    (state) => state.resolvedMediaByAssetId,
  );
  const resolveAssetMedia = useUploadLibraryStore(
    (state) => state.resolveAssetMedia,
  );
  const addLocalFiles = useUploadLibraryStore((state) => state.addLocalFiles);
  const clearError = useUploadLibraryStore((state) => state.clearError);

  const background =
    canvasShell?.background ?? activeBackgroundPreset?.value ?? null;
  const backgroundEffects =
    canvasShell?.backgroundEffects ?? DEFAULT_CANVAS_BACKGROUND_EFFECTS;
  const activeEffectControl =
    CANVAS_BACKGROUND_EFFECT_CONTROLS[activeBackgroundEffect];
  const activeEffectValue = backgroundEffects[activeBackgroundEffect];
  const activeBackgroundAssetId =
    background?.kind === "image" ? (background.assetId ?? null) : null;
  const activeBackgroundAsset = activeBackgroundAssetId
    ? (assetMetaById[activeBackgroundAssetId] ?? null)
    : null;
  const activeBackgroundImageSrc =
    background?.kind === "image"
      ? activeBackgroundAssetId
        ? (resolvedMediaByAssetId[activeBackgroundAssetId]?.preview?.src ??
          null)
        : (background.previewSrc ?? background.src ?? null)
      : null;
  const activeBackgroundImageWidth =
    background?.kind === "image"
      ? (activeBackgroundAsset?.width ?? background.width ?? null)
      : null;
  const activeBackgroundImageHeight =
    background?.kind === "image"
      ? (activeBackgroundAsset?.height ?? background.height ?? null)
      : null;
  const customColorValue =
    background?.kind === "solid" ? background.color : "#FFFFFF";
  const filtersAreDefault = CANVAS_BACKGROUND_EFFECT_ORDER.every(
    (effectId) =>
      backgroundEffects[effectId] ===
      DEFAULT_CANVAS_BACKGROUND_EFFECTS[effectId],
  );

  const activeBackgroundTitle = useMemo(() => {
    if (activeBackgroundPreset) {
      return activeBackgroundPreset.label;
    }

    if (activeBackgroundAsset) {
      return activeBackgroundAsset.name;
    }

    if (background?.kind === "solid") {
      return "Custom Color";
    }

    if (background?.kind === "gradient") {
      return "Gradient background";
    }

    if (background?.kind === "image") {
      return "Image background";
    }

    return "Background";
  }, [activeBackgroundAsset, activeBackgroundPreset, background]);

  useEffect(() => {
    if (
      activeBackgroundAssetId &&
      !resolvedMediaByAssetId[activeBackgroundAssetId]?.preview
    ) {
      void resolveAssetMedia(activeBackgroundAssetId, "preview");
    }
  }, [activeBackgroundAssetId, resolveAssetMedia, resolvedMediaByAssetId]);

  useEffect(
    () => () => {
      if (!backgroundEffectDragActiveRef.current) {
        return;
      }

      backgroundEffectDragActiveRef.current = false;
      endHistoryTransaction();
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

  const handleBackgroundUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    clearError();
    setIsUploading(true);

    try {
      const [asset] = await addLocalFiles([file]);
      if (asset) {
        applyAssetBackgroundToCanvas(asset.id);
      }
    } catch {
      return;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-5 font-sans select-none">
      <section className="space-y-3">
        <div className="w-full overflow-hidden rounded-xl border border-border-color shadow-lg transition-all hover:shadow-xl">
          <BoardBackgroundPreview
            background={background}
            effects={backgroundEffects}
            imageSrc={activeBackgroundImageSrc}
            imageWidth={activeBackgroundImageWidth}
            imageHeight={activeBackgroundImageHeight}
            className="h-28 w-full border-b border-border-color/20"
          />
          <div className="space-y-3 p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-title-color">
                  {activeBackgroundTitle}
                </p>
                <p className="text-sm capitalize text-secondary-text">
                  {formatCanvasBackgroundKind(background)}
                </p>
              </div>

              <button
                type="button"
                aria-label={
                  isBackgroundExpanded
                    ? "Collapse background filters"
                    : "Expand background filters"
                }
                aria-expanded={isBackgroundExpanded}
                onClick={() =>
                  setIsBackgroundExpanded((currentValue) => !currentValue)
                }
                disabled={!canvasShell}
                className={clsx(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-color/60 text-title-color transition",
                  canvasShell
                    ? "hover:border-accent/70 hover:text-accent"
                    : "cursor-not-allowed opacity-50",
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

            {isCanvasBackgroundImage(background) ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextFit = cycleCanvasBackgroundImageFit(
                      background.fit,
                    );
                    updateCanvasBackgroundImage({ fit: nextFit });
                    if (nextFit === "fill") {
                      setBackgroundMoveMode(false);
                    }
                  }}
                  disabled={!canvasShell}
                  className={clsx(
                    "flex-1 rounded-xl border border-border-color/60 px-3 py-2 text-sm font-semibold text-title-color transition",
                    canvasShell
                      ? "hover:border-accent/70 hover:text-accent"
                      : "cursor-not-allowed opacity-50",
                  )}
                >
                  Fit: {formatFitLabel(background.fit)}
                </button>

                <button
                  type="button"
                  onClick={() => setBackgroundMoveMode(!isBackgroundMoveMode)}
                  disabled={
                    !canvasShell || !isCanvasBackgroundImageMovable(background)
                  }
                  className={clsx(
                    "flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                    isBackgroundMoveMode
                      ? "border-accent/70 bg-accent/10 text-accent"
                      : "border-border-color/60 text-title-color",
                    canvasShell && isCanvasBackgroundImageMovable(background)
                      ? "hover:border-accent/70 hover:text-accent"
                      : "cursor-not-allowed opacity-50",
                  )}
                >
                  {isBackgroundMoveMode
                    ? "Moving background"
                    : "Move background"}
                </button>
              </div>
            ) : null}
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
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
                      Filters
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetCanvasBackgroundEffects}
                    disabled={!canvasShell || filtersAreDefault}
                    className="rounded-xl px-3 py-2 text-xs font-semibold text-title-color outline outline-border-color/60 transition hover:outline-accent/70 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reset filters
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {CANVAS_BACKGROUND_EFFECT_ORDER.map((effectId) => {
                    const control = CANVAS_BACKGROUND_EFFECT_CONTROLS[effectId];
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
                            isActive ? "text-accent/90" : "text-secondary-text",
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
                      <p className="text-sm font-semibold text-title-color">
                        {activeEffectControl.label}
                      </p>
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
                    disabled={!canvasShell}
                    className="mt-4 w-full accent-accent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
            Custom Color
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border-color/70 bg-card-bg px-3 py-2">
          <input
            type="color"
            value={customColorValue}
            onChange={(event) => applySolidColorBackground(event.target.value)}
            className="h-10 w-12 rounded-md border-0 bg-transparent p-0"
          />
          <span className="text-sm font-semibold text-title-color">
            {customColorValue.toUpperCase()}
          </span>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
            Upload Background
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleBackgroundUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => {
            clearError();
            fileInputRef.current?.click();
          }}
          disabled={isUploading}
          className="flex w-full items-center justify-center rounded-2xl border border-dashed border-border-color/70 px-4 py-5 text-sm font-semibold text-title-color transition hover:border-accent/70 hover:text-accent disabled:cursor-wait disabled:opacity-60"
        >
          {isUploading ? "Uploading background..." : "Choose image background"}
        </button>
      </section>

      {backgroundPresetGroups.map((group) => (
        <section key={group.id} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
                {group.label}
              </p>
            </div>
            <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-title-color outline outline-border-color/60">
              {group.presets.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {group.presets.map((backgroundPreset) => (
              <button
                key={backgroundPreset.id}
                type="button"
                onClick={() => {
                  setDefaultBackgroundPresetId(backgroundPreset.id);
                  applyBackgroundToCanvas(backgroundPreset.id);
                }}
                className={clsx(
                  "rounded-xl p-2 text-left outline transition hover:outline-accent/70",
                  backgroundPreset.id === activeBackgroundPreset?.id
                    ? "outline-accent"
                    : "outline-border-color/60",
                )}
              >
                <BoardBackgroundPreview
                  background={backgroundPreset.value}
                  imageSrc={
                    backgroundPreset.value.kind === "image"
                      ? (backgroundPreset.value.previewSrc ??
                        backgroundPreset.value.src ??
                        null)
                      : null
                  }
                  imageWidth={
                    backgroundPreset.value.kind === "image"
                      ? (backgroundPreset.value.width ?? null)
                      : null
                  }
                  imageHeight={
                    backgroundPreset.value.kind === "image"
                      ? (backgroundPreset.value.height ?? null)
                      : null
                  }
                  className="h-16 rounded-md outline outline-border-color/60"
                />
                <span className="mt-2 block text-xs font-semibold text-title-color">
                  {backgroundPreset.label}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
