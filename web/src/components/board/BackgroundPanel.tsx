import clsx from "clsx";

import {
  useCanvasBackgroundPresets,
  useConfigStore,
} from "@/stores/useConfigStore";
import {
  useActiveCanvasBackground,
  useCanvasStore,
} from "@/stores/useCanvasStore";

export const BoardBackgroundPanel = () => {
  const backgroundPresets = useCanvasBackgroundPresets();
  const activeBackground = useActiveCanvasBackground();
  const setDefaultBackgroundPresetId = useConfigStore(
    (state) => state.setDefaultBackgroundPresetId,
  );
  const applyBackgroundToCanvas = useCanvasStore(
    (state) => state.applyBackgroundToCanvas,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-lg outline outline-1 outline-border-color/60"
          style={{ background: activeBackground?.preview }}
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
              "rounded-xl p-2 text-left outline outline-1 transition hover:outline-accent/70",
              backgroundPreset.id === activeBackground?.id
                ? "outline-accent"
                : "outline-border-color/60",
            )}
          >
            <div
              className="h-12 rounded-md outline outline-1 outline-border-color/60"
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
