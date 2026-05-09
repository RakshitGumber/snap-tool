import { useRef, useMemo, useCallback } from "react";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useShallow } from "zustand/react/shallow";

import { useDismissibleLayer } from "@/libs/useDismissibleLayer";
import {
  getCanvasPresetById,
  getCanvasPresetGroupIcon,
  useConfigStore,
  useCanvasPresetGroups,
} from "@/stores/useConfigStore";
import {
  useActiveCanvasPreset,
  useCanvasShell,
  useCanvasStore,
} from "@/stores/useCanvasStore";
import { useEditorUiStore } from "@/stores/useEditorUiStore";

const PRESET_PREVIEW_FRAME = {
  width: 104,
  height: 64,
};

const PresetRatioPreview = ({
  width,
  height,
}: {
  width: number;
  height: number;
}) => {
  const scale = Math.min(
    PRESET_PREVIEW_FRAME.width / width,
    PRESET_PREVIEW_FRAME.height / height,
  );
  const previewWidth = Math.max(Math.round(width * scale), 18);
  const previewHeight = Math.max(Math.round(height * scale), 18);

  return (
    <div className="flex h-24 items-center justify-center rounded-xl bg-surface-3/60 p-3">
      <div
        className="shrink-0 rounded-md bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] outline outline-border-color/60"
        style={{
          width: `${previewWidth}px`,
          height: `${previewHeight}px`,
        }}
      />
    </div>
  );
};

export const PresetControl = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const presetGroups = useCanvasPresetGroups();
  const activePreset = useActiveCanvasPreset();
  const canvasShell = useCanvasShell();

  const { isPresetMenuOpen, setPresetMenuOpen } = useEditorUiStore(
    useShallow((state) => ({
      isPresetMenuOpen: state.isPresetMenuOpen,
      setPresetMenuOpen: state.setPresetMenuOpen,
    })),
  );

  const setDefaultCanvasPresetId = useConfigStore(
    (state) => state.setDefaultCanvasPresetId,
  );
  const { initializeDefaultCanvas, resizeCanvas } = useCanvasStore(
    useShallow((state) => ({
      initializeDefaultCanvas: state.initializeDefaultCanvas,
      resizeCanvas: state.resizeCanvas,
    })),
  );

  const { activeLabel, activeIcon } = useMemo(() => {
    const isPreset = activePreset.kind === "preset";

    return {
      activeLabel: isPreset ? activePreset.preset.label : "Custom",
      activeIcon: getCanvasPresetGroupIcon(
        isPreset ? activePreset.group.id : "general",
      ),
    };
  }, [activePreset]);

  const handleDismiss = useCallback(() => {
    setPresetMenuOpen(false);
  }, [setPresetMenuOpen]);

  const handleToggleMenu = useCallback(() => {
    setPresetMenuOpen(!isPresetMenuOpen);
  }, [isPresetMenuOpen, setPresetMenuOpen]);

  const handleSelectPreset = useCallback(
    (presetId: Parameters<typeof getCanvasPresetById>[0]) => {
      const preset = getCanvasPresetById(presetId);

      if (!canvasShell) {
        initializeDefaultCanvas();
      }

      resizeCanvas(preset.size, preset.id);
      setDefaultCanvasPresetId(preset.id);
      handleDismiss();
    },
    [
      canvasShell,
      initializeDefaultCanvas,
      resizeCanvas,
      setDefaultCanvasPresetId,
      handleDismiss,
    ],
  );

  useDismissibleLayer({
    containerRef,
    isOpen: isPresetMenuOpen,
    onDismiss: handleDismiss,
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title="Resize canvas"
        aria-expanded={isPresetMenuOpen}
        onClick={handleToggleMenu}
        className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-title-color transition hover:bg-secondary-text/20"
      >
        <Icon icon={activeIcon} className="text-lg" />
        <div className="min-w-0 text-left">
          <span className="truncate font-sans">{activeLabel}</span>
        </div>
      </button>

      {isPresetMenuOpen && (
        <div
          className={clsx(
            "z-50 overflow-y-auto rounded-2xl border-2 border-border-color bg-card-bg shadow-[0_18px_40px_rgba(15,23,42,0.12)]",
            "fixed inset-x-3 bottom-3 top-20 p-3 sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-[70vh] sm:w-[34rem] sm:p-4",
          )}
        >
          <div className="space-y-4 sm:space-y-5">
            {presetGroups.map((group) => {
              const isActiveGroup =
                activePreset.kind === "preset" &&
                group.id === activePreset.group.id;

              return (
                <section key={group.id} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Icon
                        icon={getCanvasPresetGroupIcon(group.id)}
                        className={clsx(
                          "text-lg",
                          isActiveGroup ? "text-accent" : "text-title-color",
                        )}
                      />
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
                          <div className="p-2">
                            <PresetRatioPreview
                              width={preset.size.width}
                              height={preset.size.height}
                            />
                          </div>
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
