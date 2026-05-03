import clsx from "clsx";

import { DEFAULT_CANVAS_BACKGROUND_EFFECTS } from "@/canvas/backgroundEffects";
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

export const BoardBackgroundPanel = () => {
  const backgroundPresets = useCanvasBackgroundPresets();
  const activeBackground = useActiveCanvasBackground();
  const canvasShell = useCanvasShell();
  const setDefaultBackgroundPresetId = useConfigStore(
    (state) => state.setDefaultBackgroundPresetId,
  );
  const applyBackgroundToCanvas = useCanvasStore(
    (state) => state.applyBackgroundToCanvas,
  );

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center gap-3">
        <BoardBackgroundPreview
          background={canvasShell?.background ?? activeBackground?.preview}
          effects={
            canvasShell?.backgroundEffects ?? DEFAULT_CANVAS_BACKGROUND_EFFECTS
          }
          className="h-10 w-10 rounded-lg outline outline-border-color/60"
        />
        <div>
          <p className="text-sm font-semibold text-title-color">
            {activeBackground?.label ?? "White"}
          </p>
          <p className="text-xs text-secondary-text">Canvas fill</p>
        </div>
      </div>

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
