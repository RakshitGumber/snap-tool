import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import {
  CANVAS_BACKGROUND_EFFECT_CONTROLS,
  CANVAS_BACKGROUND_EFFECT_ORDER,
  DEFAULT_CANVAS_BACKGROUND_EFFECTS,
  formatCanvasBackgroundEffectValue,
  type CanvasBackgroundEffectKey,
} from "@/canvas/backgroundEffects";

import {
  useCanvasBackgroundPresets,
  useConfigStore,
} from "@/stores/useConfigStore";
import {
  useActiveCanvasBackground,
  useCanvasShell,
  useCanvasStore,
} from "@/stores/useCanvasStore";

import { BoardBackgroundPreview } from "./BackgroundPreview";

const BACKGROUND_EFFECT_ICONS: Record<CanvasBackgroundEffectKey, string> = {
  hue: "solar:pallete-2-linear",
  saturation: "solar:tuning-2-linear",
  blur: "solar:filters-linear",
  brightness: "solar:sun-2-linear",
  contrast: "solar:slider-minimalistic-horizontal-linear",
  opacity: "solar:droplets-minimalistic-linear",
};

export const BoardBackgroundPanel = () => {
  const backgroundPresets = useCanvasBackgroundPresets();
  const canvasShell = useCanvasShell();
  const activeBackground = useActiveCanvasBackground();
  const backgroundEffectDragActiveRef = useRef(false);
  const [isBackgroundExpanded, setIsBackgroundExpanded] = useState(false);
  const [activeBackgroundEffect, setActiveBackgroundEffect] =
    useState<CanvasBackgroundEffectKey>("hue");
  const setDefaultBackgroundPresetId = useConfigStore(
    (state) => state.setDefaultBackgroundPresetId,
  );
  const applyBackgroundToCanvas = useCanvasStore(
    (state) => state.applyBackgroundToCanvas,
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
  const backgroundEffects =
    canvasShell?.backgroundEffects ?? DEFAULT_CANVAS_BACKGROUND_EFFECTS;
  const activeEffectControl =
    CANVAS_BACKGROUND_EFFECT_CONTROLS[activeBackgroundEffect];
  const activeEffectValue = backgroundEffects[activeBackgroundEffect];

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

  return (
    <div className="space-y-4 font-sans select-none">
      <section className="space-y-3">
        <div className="w-full overflow-hidden rounded-xl border border-border-color shadow-lg transition-all hover:shadow-xl">
          <BoardBackgroundPreview
            background={canvasShell?.background ?? activeBackground?.preview}
            effects={backgroundEffects}
            className="h-28 w-full border-b border-border-color/20"
          />
          <div className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-title-color">
                  {activeBackground?.label ?? "White"}
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

      <div className="grid grid-cols-2 gap-2">
        {backgroundPresets.map((backgroundPreset) => (
          <button
            key={backgroundPreset.id}
            type="button"
            onClick={() => {
              setDefaultBackgroundPresetId(backgroundPreset.id);
              applyBackgroundToCanvas(backgroundPreset.id);
            }}
            className={clsx(
              "rounded-xl p-2 text-left outline transition hover:outline-accent/70",
              backgroundPreset.id === activeBackground?.id
                ? "outline-accent"
                : "outline-border-color/60",
            )}
          >
            <div
              className="h-12 rounded-md outline outline-border-color/60"
              style={{ background: backgroundPreset.preview }}
            />
            <span className="mt-2 block text-xs font-semibold text-title-color">
              {backgroundPreset.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
