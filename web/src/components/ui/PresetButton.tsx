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
        <div className="absolute top-full right-0 mt-2 max-h-[80vh] w-xl overflow-y-auto rounded-lg border border-border-color bg-panel-bg px-4">
          <div className="flex flex-col gap-4">
            {CANVAS_PRESET_CATEGORIES.map((group) => {
              return (
                <section
                  key={group.id}
                  className="flex flex-col py-3 px-2 gap-4"
                >
                  <h1 className="text-base font-bold uppercase tracking-wide text-title-color py-2 px-2 border-b border-border-color">
                    {group.label}
                  </h1>

                  <div className="flex flex-wrap">
                    {group.presets.map((preset) => {
                      const isActive = preset.id === activePreset.id;

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset.id)}
                          className={clsx(
                            "rounded-lg text-left w-42 h-42",
                            isActive && "bg-text-color/8",
                          )}
                        >
                          <div className="flex flex-col items-center justify-end h-full py-4 gap-">
                            <div
                              className="block bg-white"
                              style={{
                                width: Math.min(168, preset.size.width / 10),
                                height: Math.min(168, preset.size.height / 10),
                              }}
                            />
                            <p className="text-sm font-semibold">
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
