// Review note: Background editing panel for presets, custom colors, uploaded images, fit controls, and effects.
// The comments in this file are intentionally dense to support the requested review pass.

import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import {
  CANVAS_BACKGROUND_EFFECT_CONTROLS,
  CANVAS_BACKGROUND_EFFECT_ORDER,
  DEFAULT_CANVAS_BACKGROUND_EFFECTS,
  // Walk each item deliberately because order and accumulated state matter here.
  formatCanvasBackgroundEffectValue,
  type CanvasBackgroundEffectKey,
} from "@/canvas/backgroundEffects";
import {
  cycleCanvasBackgroundImageFit,
  // Walk each item deliberately because order and accumulated state matter here.
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

/**
 * Keeps background_effect_icons in one named constant so related calculations stay consistent.
 */
const BACKGROUND_EFFECT_ICONS: Record<CanvasBackgroundEffectKey, string> = {
  hue: "solar:pallete-2-linear",
  saturation: "solar:tuning-2-linear",
  blur: "solar:filters-linear",
  brightness: "solar:sun-2-linear",
  contrast: "solar:slider-minimalistic-horizontal-linear",
  opacity: "solar:droplets-minimalistic-linear",
};

/**
 * Formats format fit label for compact UI display.
 */
const formatFitLabel = (value: string) =>
  value.slice(0, 1).toUpperCase() + value.slice(1);

/**
 * Renders every background editing affordance and commits changes through the canvas store.
 */
export const BoardBackgroundPanel = () => {
  // Store mutable interaction state in a ref so pointer handlers can read it without re-rendering.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Select this store or hook value close to where the component uses it.
  const backgroundPresetGroups = useCanvasBackgroundPresetGroups();
  // Select this store or hook value close to where the component uses it.
  const canvasShell = useCanvasShell();
  // Select this store or hook value close to where the component uses it.
  const activeBackgroundPreset = useActiveCanvasBackground();
  // Store mutable interaction state in a ref so pointer handlers can read it without re-rendering.
  const backgroundEffectDragActiveRef = useRef(false);
  // Keep this local UI state in React because it only affects the current component instance.
  const [isBackgroundExpanded, setIsBackgroundExpanded] = useState(false);
  const [activeBackgroundEffect, setActiveBackgroundEffect] =
    useState<CanvasBackgroundEffectKey>("hue");
  // Keep this local UI state in React because it only affects the current component instance.
  const [isUploading, setIsUploading] = useState(false);
  // Select this store or hook value close to where the component uses it.
  const setDefaultBackgroundPresetId = useConfigStore(
    (state) => state.setDefaultBackgroundPresetId,
  );
  // Select this store or hook value close to where the component uses it.
  const isBackgroundMoveMode = useEditorUiStore(
    (state) => state.isBackgroundMoveMode,
  );
  // Select this store or hook value close to where the component uses it.
  const setBackgroundMoveMode = useEditorUiStore(
    (state) => state.setBackgroundMoveMode,
  );
  // Select this store or hook value close to where the component uses it.
  const applyBackgroundToCanvas = useCanvasStore(
    (state) => state.applyBackgroundToCanvas,
  );
  // Select this store or hook value close to where the component uses it.
  const applySolidColorBackground = useCanvasStore(
    (state) => state.applySolidColorBackground,
  );
  // Select this store or hook value close to where the component uses it.
  const applyAssetBackgroundToCanvas = useCanvasStore(
    (state) => state.applyAssetBackgroundToCanvas,
  );
  // Select this store or hook value close to where the component uses it.
  const updateCanvasBackgroundEffects = useCanvasStore(
    (state) => state.updateCanvasBackgroundEffects,
  );
  // Select this store or hook value close to where the component uses it.
  const resetCanvasBackgroundEffects = useCanvasStore(
    (state) => state.resetCanvasBackgroundEffects,
  );
  // Select this store or hook value close to where the component uses it.
  const updateCanvasBackgroundImage = useCanvasStore(
    (state) => state.updateCanvasBackgroundImage,
  );
  // Select this store or hook value close to where the component uses it.
  const beginHistoryTransaction = useCanvasStore(
    (state) => state.beginHistoryTransaction,
  );
  // Select this store or hook value close to where the component uses it.
  const endHistoryTransaction = useCanvasStore(
    (state) => state.endHistoryTransaction,
  );
  // Select this store or hook value close to where the component uses it.
  const assetMetaById = useUploadLibraryStore((state) => state.assetMetaById);
  // Select this store or hook value close to where the component uses it.
  const resolvedMediaByAssetId = useUploadLibraryStore(
    (state) => state.resolvedMediaByAssetId,
  );
  // Select this store or hook value close to where the component uses it.
  const resolveAssetMedia = useUploadLibraryStore(
    (state) => state.resolveAssetMedia,
  );
  // Select this store or hook value close to where the component uses it.
  const addLocalFiles = useUploadLibraryStore((state) => state.addLocalFiles);
  // Select this store or hook value close to where the component uses it.
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
    // Keep this conditional branch explicit because it changes the user-visible editor behavior.
    if (activeBackgroundPreset) {
      // Return the resolved value to the caller after all guards and transformations.
      return activeBackgroundPreset.label;
    }

    if (activeBackgroundAsset) {
      // Return the resolved value to the caller after all guards and transformations.
      return activeBackgroundAsset.name;
    }

    if (background?.kind === "solid") {
      // Return the resolved value to the caller after all guards and transformations.
      return "Custom Color";
    }

    if (background?.kind === "gradient") {
      // Return the resolved value to the caller after all guards and transformations.
      return "Gradient background";
    }

    if (background?.kind === "image") {
      // Return the resolved value to the caller after all guards and transformations.
      return "Image background";
    }

    return "Background";
  }, [activeBackgroundAsset, activeBackgroundPreset, background]);

  useEffect(() => {
    // Keep this conditional branch explicit because it changes the user-visible editor behavior.
    if (
      activeBackgroundAssetId &&
      !resolvedMediaByAssetId[activeBackgroundAssetId]?.preview
    ) {
      void resolveAssetMedia(activeBackgroundAssetId, "preview");
    }
  }, [activeBackgroundAssetId, resolveAssetMedia, resolvedMediaByAssetId]);

  useEffect(
    () => () => {
      // Guard this branch so missing or invalid state does not flow into the main path.
      if (!backgroundEffectDragActiveRef.current) {
        // Return the resolved value to the caller after all guards and transformations.
        return;
      }

      backgroundEffectDragActiveRef.current = false;
      endHistoryTransaction();
    },
    [endHistoryTransaction],
  );

  const beginBackgroundEffectDrag = () => {
    // Guard this branch so missing or invalid state does not flow into the main path.
    if (backgroundEffectDragActiveRef.current || !canvasShell) {
      // Return the resolved value to the caller after all guards and transformations.
      return;
    }

    backgroundEffectDragActiveRef.current = true;
    beginHistoryTransaction();
  };

  const endBackgroundEffectDrag = () => {
    // Guard this branch so missing or invalid state does not flow into the main path.
    if (!backgroundEffectDragActiveRef.current) {
      // Return the resolved value to the caller after all guards and transformations.
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
      // Return the resolved value to the caller after all guards and transformations.
      return;
    }

    clearError();
    setIsUploading(true);

    try {
      const [asset] = await addLocalFiles([file]);
      // Keep this conditional branch explicit because it changes the user-visible editor behavior.
      if (asset) {
        applyAssetBackgroundToCanvas(asset.id);
      }
    } catch {
      // Return the resolved value to the caller after all guards and transformations.
      return;
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetBackground = () => {
    applySolidColorBackground("#ffffff");
    setBackgroundMoveMode(false);
  };

  return (
    <div className="space-y-5 font-sans select-none">
      <section className="space-y-3">
        <div className="w-full overflow-hidden rounded-xl bg-card-foreground border border-border-color shadow-lg transition-all hover:shadow-xl">
          <BoardBackgroundPreview
            background={background}
            effects={backgroundEffects}
            imageSrc={activeBackgroundImageSrc}
            imageWidth={activeBackgroundImageWidth}
            imageHeight={activeBackgroundImageHeight}
            className="h-28 w-full border-b border-border-color/20 bg-card-foreground"
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

            <button
              type="button"
              onClick={handleResetBackground}
              disabled={!canvasShell}
              className={clsx(
                "w-full rounded-xl border border-border-color/60 px-3 py-2 text-sm font-semibold text-title-color transition",
                canvasShell
                  ? "hover:border-accent/70 hover:text-accent"
                  : "cursor-not-allowed opacity-50",
              )}
            >
              Reset to white
            </button>

            {isCanvasBackgroundImage(background) ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextFit = cycleCanvasBackgroundImageFit(
                      background.fit,
                    );
                    updateCanvasBackgroundImage({ fit: nextFit });
                    // Keep this conditional branch explicit because it changes the user-visible editor behavior.
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
                    const isDirty =
                      backgroundEffects[effectId] !==
                      DEFAULT_CANVAS_BACKGROUND_EFFECTS[effectId];

                    return (
                      <div
                        key={effectId}
                        className={clsx(
                          "rounded-xl border px-3 py-2 transition",
                          isActive
                            ? "border-accent/70 bg-accent/10 text-accent"
                            : "border-border-color/50 text-title-color hover:border-accent/60 hover:text-accent",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveBackgroundEffect(effectId)}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          >
                            <Icon
                              icon={BACKGROUND_EFFECT_ICONS[effectId]}
                              className="text-base"
                            />
                            <span className="text-sm font-semibold">
                              {control.label}
                            </span>
                          </button>

                          {isDirty ? (
                            <button
                              type="button"
                              onClick={() =>
                                updateCanvasBackgroundEffects({
                                  [effectId]:
                                    DEFAULT_CANVAS_BACKGROUND_EFFECTS[effectId],
                                })
                              }
                              className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold outline outline-border-color/60 transition hover:outline-accent/70"
                            >
                              Reset
                            </button>
                          ) : null}
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
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-border-color/50 bg-card-foreground/70 p-4">
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

        <div className="flex items-center gap-3 rounded-xl border border-border-color/70 bg-card-foreground px-3 py-2">
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
