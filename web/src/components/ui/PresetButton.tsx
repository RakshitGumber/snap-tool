import { useCallback, useMemo, useRef, useState } from "react";
import { usePanelBlur } from "@/hooks/usePanelBlur";
// Update this later
import {
  useActiveCanvasPreset,
  useCanvasShell,
  useCanvasStore,
} from "@/stores/useCanvasStore";
// Update this later
import {
  getCanvasPresetById,
  useCanvasPresetGroups,
  useConfigStore,
} from "@/stores/useConfigStore";
import { useShallow } from "zustand/shallow";
import clsx from "clsx";

export const PresetButton = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const presetGroups = useCanvasPresetGroups();
  const activePreset = useActiveCanvasPreset();
  const canvasShell = useCanvasShell();

  const setDefaultCanvasPresetId = useConfigStore(
    (state) => state.setDefaultCanvasPresetId,
  );
  const { initializeDefaultCanvas, resizeCanvas } = useCanvasStore(
    useShallow((state) => ({
      initializeDefaultCanvas: state.initializeDefaultCanvas,
      resizeCanvas: state.resizeCanvas,
    })),
  );

  const [isOpen, setIsOpen] = useState<boolean>(false);

  usePanelBlur({
    containerRef,
    isOpen,
    onDismiss: () => setIsOpen(false),
  });

  const { activeLabel } = useMemo(() => {
    const isPreset = activePreset.kind === "preset";

    return {
      activeLabel: isPreset
        ? `${activePreset.group.label.slice(0, 2)} - ${activePreset.preset.size.height} x ${activePreset.preset.size.width}`
        : "Custom",
    };
  }, [activePreset]);

  const handleSelectPreset = useCallback(
    (presetId: Parameters<typeof getCanvasPresetById>[0]) => {
      const preset = getCanvasPresetById(presetId);

      if (!canvasShell) {
        initializeDefaultCanvas();
      }

      resizeCanvas(preset.size, preset.id);
      setDefaultCanvasPresetId(preset.id);
    },
    [
      canvasShell,
      initializeDefaultCanvas,
      resizeCanvas,
      setDefaultCanvasPresetId,
    ],
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
        <div className="absolute top-full mt-2 bg-panel-bg rounded-lg p-2 border border-border-color w-xl right-0">
          <div className="space-y-4 sm:space-y-5">
            {presetGroups.map((group) => {
              return (
                <section key={group.id} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
                        {group.label}
                      </p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-title-color outline outline-border-color/60">
                      {group.presets.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {group.presets.map((preset) => {
                      const isActive =
                        activePreset.kind === "preset" &&
                        preset.id === activePreset.preset.id;

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
