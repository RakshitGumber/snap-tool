import { useCallback, useMemo, useRef, useState } from "react";
import { usePanelBlur } from "@/hooks/usePanelBlur";
import {
  CANVAS_PRESET_CATEGORIES,
  getCanvasPresetById,
  getCanvasPresetCategoryByPresetId,
} from "@/config/canvasPresets";
import { useCanvasStore } from "@/new_stores/useCanvasStore";
import clsx from "clsx";

export const PresetButton = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeCanvasPresetId = useCanvasStore(
    (state) => state.activeCanvasPresetId,
  );
  const setActiveCanvasPreset = useCanvasStore(
    (state) => state.setActiveCanvasPreset,
  );

  const activePreset = getCanvasPresetById(activeCanvasPresetId);
  const activeCategory = getCanvasPresetCategoryByPresetId(activePreset.id);

  const [isOpen, setIsOpen] = useState<boolean>(false);

  usePanelBlur({
    containerRef,
    isOpen,
    onDismiss: () => setIsOpen(false),
  });

  const { activeLabel } = useMemo(() => {
    return {
      activeLabel: `${activeCategory.label.slice(0, 2)} - ${activePreset.size.width} x ${activePreset.size.height}`,
    };
  }, [activeCategory.label, activePreset.size.height, activePreset.size.width]);

  const handleSelectPreset = useCallback(
    (presetId: string) => {
      const preset = getCanvasPresetById(presetId);

      setActiveCanvasPreset(preset.id);
      setIsOpen(false);
    },
    [setActiveCanvasPreset],
  );

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center">
        <div className="h-8 px-4 py-2.25">
          <h3 className="text-sm tracking-wide leading-3.5 select-none text-secondary-text ">
            Popular Presets
          </h3>
        </div>
        <button
          className="w-40 h-10.5 border border-border-color rounded-lg text-xs font-semibold hover:bg-text-color/8 tracking-wide"
          onClick={() => setIsOpen(!isOpen)}
        >
          {activeLabel}
        </button>
      </div>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 max-h-[calc(100vh-5rem)] w-xl overflow-y-auto rounded-lg border border-border-color bg-panel-bg p-2">
          <div className="space-y-4 sm:space-y-5">
            {CANVAS_PRESET_CATEGORIES.map((group) => {
              return (
                <section key={group.id} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
                        {group.label}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {group.presets.map((preset) => {
                      const isActive = preset.id === activePreset.id;

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset.id)}
                          className={clsx(
                            "overflow-hidden rounded-2xl text-left outline transition hover:-translate-y-0.5 hover:outline-accent/70",
                            isActive
                              ? "bg-accent-light/45 outline-accent"
                              : "bg-card-bg outline-border-color/60",
                          )}
                        >
                          <div className="space-y-1 px-3 pb-3">
                            <p className="text-sm font-semibold text-title-color">
                              {preset.label}
                            </p>
                            <p className="text-xs text-secondary-text">
                              {preset.size.width} x {preset.size.height}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
