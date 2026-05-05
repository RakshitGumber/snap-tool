import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";

import clsx from "clsx";

import {
  CANVAS_BACKGROUND_EFFECT_CONTROLS,
  CANVAS_BACKGROUND_EFFECT_ORDER,
  DEFAULT_CANVAS_BACKGROUND_EFFECTS,
  formatCanvasBackgroundEffectValue,
} from "@/canvas/backgroundEffects";
import { formatCanvasBackgroundKind } from "@/canvas/backgrounds";
import { getObjectLabel, getObjectRefKey } from "@/canvas/objects";
import { useEditorUiStore } from "@/stores/useEditorUiStore";
import {
  useActiveCanvasBackground,
  useCanvasShell,
  useCanvasStore,
  useOrderedCanvasObjects,
} from "@/stores/useCanvasStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import type {
  BoardImagePositionPreset,
  BoardObjectRef,
} from "@/types/canvas";

import { BoardBackgroundPreview } from "./BackgroundPreview";

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

const truncateText = (value: string) =>
  value.length > 48 ? `${value.slice(0, 45).trimEnd()}...` : value;

const isSelectionModifier = (event: ReactMouseEvent) =>
  event.shiftKey || event.ctrlKey || event.metaKey;

export const BoardOverviewPanel = () => {
  const [openHierarchyKey, setOpenHierarchyKey] = useState<string | null>(null);

  const canvasShell = useCanvasShell();
  const activeBackgroundPreset = useActiveCanvasBackground();
  const orderedObjects = useOrderedCanvasObjects();
  const positionImageOnCanvas = useCanvasStore(
    (state) => state.positionImageOnCanvas,
  );
  const moveObjectUp = useCanvasStore((state) => state.moveObjectUp);
  const moveObjectDown = useCanvasStore((state) => state.moveObjectDown);
  const toggleObjectMovementLock = useCanvasStore(
    (state) => state.toggleObjectMovementLock,
  );
  const setSelectedObjectDistance = useCanvasStore(
    (state) => state.setSelectedObjectDistance,
  );
  const assetMetaById = useUploadLibraryStore((state) => state.assetMetaById);
  const resolvedMediaByAssetId = useUploadLibraryStore(
    (state) => state.resolvedMediaByAssetId,
  );
  const resolveAssetMedia = useUploadLibraryStore(
    (state) => state.resolveAssetMedia,
  );
  const selectedObjects = useEditorUiStore((state) => state.selectedObjects);
  const selectImage = useEditorUiStore((state) => state.selectImage);
  const selectText = useEditorUiStore((state) => state.selectText);
  const backgroundEffects =
    canvasShell?.backgroundEffects ?? DEFAULT_CANVAS_BACKGROUND_EFFECTS;
  const background =
    canvasShell?.background ?? activeBackgroundPreset?.value ?? null;
  const activeBackgroundAssetId =
    background?.kind === "image" ? (background.assetId ?? null) : null;
  const activeBackgroundAsset = activeBackgroundAssetId
    ? (assetMetaById[activeBackgroundAssetId] ?? null)
    : null;
  const backgroundPreviewSrc =
    background?.kind === "image"
      ? activeBackgroundAssetId
        ? (resolvedMediaByAssetId[activeBackgroundAssetId]?.preview?.src ??
          null)
        : (background.previewSrc ?? background.src ?? null)
      : null;
  const backgroundPreviewWidth =
    background?.kind === "image"
      ? (activeBackgroundAsset?.width ?? background.width ?? null)
      : null;
  const backgroundPreviewHeight =
    background?.kind === "image"
      ? (activeBackgroundAsset?.height ?? background.height ?? null)
      : null;
  const backgroundLabel =
    activeBackgroundPreset?.label ??
    activeBackgroundAsset?.name ??
    (background?.kind === "solid"
      ? "Custom Color"
      : background?.kind === "gradient"
        ? "Gradient background"
        : background?.kind === "image"
          ? "Image background"
          : "White");
  const selectedKeySet = useMemo(
    () => new Set(selectedObjects.map((ref) => getObjectRefKey(ref))),
    [selectedObjects],
  );
  const orderedSelectedObjects = useMemo(
    () =>
      orderedObjects.filter((object) =>
        selectedObjects.some(
          (selected) =>
            selected.kind === object.ref.kind && selected.id === object.ref.id,
        ),
      ),
    [orderedObjects, selectedObjects],
  );
  const lowerHierarchyObject =
    orderedSelectedObjects.length === 2 ? orderedSelectedObjects[1] : null;
  const activeAxisLabel = canvasShell?.layoutAxisMode ?? "none";

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
    orderedObjects.forEach((object) => {
      if (
        object.kind === "image" &&
        !resolvedMediaByAssetId[object.item.assetId]?.preview
      ) {
        void resolveAssetMedia(object.item.assetId, "preview");
      }
    });
  }, [orderedObjects, resolvedMediaByAssetId, resolveAssetMedia]);

  useEffect(() => {
    if (
      activeBackgroundAssetId &&
      !resolvedMediaByAssetId[activeBackgroundAssetId]?.preview
    ) {
      void resolveAssetMedia(activeBackgroundAssetId, "preview");
    }
  }, [activeBackgroundAssetId, resolveAssetMedia, resolvedMediaByAssetId]);

  const handleSelectObject =
    (ref: BoardObjectRef) => (event: ReactMouseEvent<HTMLButtonElement>) => {
      const additive = isSelectionModifier(event);
      const object = orderedObjects.find(
        (candidate) =>
          candidate.ref.kind === ref.kind && candidate.ref.id === ref.id,
      );
      if (!object) {
        return;
      }

      if (object.kind === "image") {
        selectImage(object.item.id, {
          additive,
          toggle: additive,
        });
        return;
      }

      selectText(object.item, {
        additive,
        toggle: additive,
      });
    };

  return (
    <div className="space-y-8 font-sans">
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-title-color">Background</h3>
        <div className="overflow-hidden rounded-xl border border-border-color/40 bg-card-foreground">
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
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-title-color">Objects</h3>
          <span className="text-xs uppercase tracking-[0.14em] text-secondary-text">
            {orderedObjects.length} total
          </span>
        </div>

        {orderedObjects.length ? (
          <div className="space-y-3">
            {orderedObjects.map((object, index) => {
              const key = getObjectRefKey(object.ref);
              const isSelected = selectedKeySet.has(key);
              const preview =
                object.kind === "image"
                  ? resolvedMediaByAssetId[object.item.assetId]?.preview
                  : null;

              return (
                <div
                  key={key}
                  className={clsx(
                    "space-y-3 rounded-xl border px-3 py-3",
                    isSelected
                      ? "border-accent/70 bg-accent/5"
                      : "border-border-color/40",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={handleSelectObject(object.ref)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      {object.kind === "image" && preview ? (
                        <img
                          src={preview.src}
                          alt={object.item.alt}
                          className="h-10 w-10 shrink-0 rounded-md object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-3 text-xs font-bold uppercase text-secondary-text">
                          {object.kind}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-title-color">
                          {truncateText(getObjectLabel(object))}
                        </p>
                        <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
                          #{index + 1} · {object.kind} · {object.item.layoutMode}
                          {object.item.isMovementLocked ? " · locked" : ""}
                        </p>
                        <p className="mt-1 text-sm text-secondary-text">
                          {object.kind === "image"
                            ? `${object.item.width} x ${object.item.height}`
                            : `${object.item.fontFamily} · ${object.item.fontSize}px · ${object.item.align}`}
                        </p>
                      </div>
                    </button>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleObjectMovementLock(object.ref)}
                        className={clsx(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition",
                          object.item.isMovementLocked
                            ? "border-accent/70 bg-accent/10 text-accent"
                            : "border-border-color/60 text-title-color hover:border-accent/70 hover:text-accent",
                        )}
                      >
                        {object.item.isMovementLocked
                          ? "Unlock movement"
                          : "Lock movement"}
                      </button>

                      <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenHierarchyKey((current) =>
                            current === key ? null : key,
                          )
                        }
                        className="rounded-full border border-border-color/60 px-3 py-1 text-xs font-semibold text-title-color transition hover:border-accent/70 hover:text-accent"
                      >
                        Hierarchy
                      </button>

                      {openHierarchyKey === key ? (
                        <div className="absolute right-0 top-10 z-10 grid min-w-[8rem] gap-2 rounded-xl border border-border-color/50 bg-card-bg p-2 shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              moveObjectUp(object.ref);
                              setOpenHierarchyKey(null);
                            }}
                            className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-title-color transition hover:bg-accent/10 hover:text-accent"
                          >
                            Move up
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              moveObjectDown(object.ref);
                              setOpenHierarchyKey(null);
                            }}
                            className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-title-color transition hover:bg-accent/10 hover:text-accent"
                          >
                            Move down
                          </button>
                        </div>
                      ) : null}
                      </div>
                    </div>
                  </div>

                  {object.kind === "image" ? (
                    <div className="flex flex-wrap gap-2">
                      {IMAGE_POSITION_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            selectImage(object.item.id);
                            positionImageOnCanvas(object.item.id, preset.id);
                          }}
                          disabled={object.item.isMovementLocked}
                          className="rounded-full border border-border-color/60 px-3 py-1 text-xs font-semibold text-title-color transition hover:border-accent/70 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-secondary-text">
            No objects on this canvas.
          </p>
        )}
      </section>

      {canvasShell?.layoutAxisMode !== "none" &&
      orderedSelectedObjects.length === 2 &&
      lowerHierarchyObject ? (
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-title-color">Distance</h3>
          <label className="block rounded-xl border border-border-color/40 px-4 py-3">
            <span className="block text-xs uppercase tracking-[0.14em] text-secondary-text">
              Edge Gap ({activeAxisLabel})
            </span>
            <input
              type="number"
              value={lowerHierarchyObject.item.layoutGap}
              onChange={(event) =>
                setSelectedObjectDistance(Number(event.target.value))
              }
              className="mt-3 w-full rounded-xl border border-border-color/70 bg-card-bg px-3 py-2 text-sm text-title-color outline-none transition focus:border-accent"
            />
          </label>
        </section>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-lg font-bold text-title-color">
          Effects / Filters
        </h3>
        <p className="text-sm text-secondary-text"></p>
      </section>
    </div>
  );
};
