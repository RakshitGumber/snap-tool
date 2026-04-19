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
import type { CanvasPresetGroupId } from "@/types/canvas";

export const PresetControl = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const presetGroups = useCanvasPresetGroups();
  const activePreset = useActiveCanvasPreset();
  const canvasShell = useCanvasShell();

  const {
    isPresetMenuOpen,
    setPresetMenuOpen,
    activeGroupId,
    setActivePresetGroupId,
  } = useEditorUiStore(
    useShallow((state) => ({
      isPresetMenuOpen: state.isPresetMenuOpen,
      setPresetMenuOpen: state.setPresetMenuOpen,
      activeGroupId: state.activePresetGroupId,
      setActivePresetGroupId: state.setActivePresetGroupId,
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

  // -- Memoized Derived State --
  const { activeLabel, activeIcon } = useMemo(() => {
    const isPreset = activePreset.kind === "preset";
    const width = isPreset
      ? activePreset.preset.size.width
      : activePreset.size.width;
    const height = isPreset
      ? activePreset.preset.size.height
      : activePreset.size.height;

    return {
      activeLabel: isPreset ? activePreset.preset.label : "Custom",
      activeDetail: `${width} x ${height}`,
      activeIcon: getCanvasPresetGroupIcon(
        isPreset ? activePreset.group.id : "general",
      ),
    };
  }, [activePreset]);

  const activeGroup = useMemo(
    () => presetGroups.find((group) => group.id === activeGroupId) ?? null,
    [presetGroups, activeGroupId],
  );

  // -- Memoized Handlers --
  const handleDismiss = useCallback(() => {
    setActivePresetGroupId(null);
    setPresetMenuOpen(false);
  }, [setActivePresetGroupId, setPresetMenuOpen]);

  const handleToggleMenu = useCallback(() => {
    if (isPresetMenuOpen) setActivePresetGroupId(null);
    setPresetMenuOpen(!isPresetMenuOpen);
  }, [isPresetMenuOpen, setActivePresetGroupId, setPresetMenuOpen]);

  const handleSelectPreset = useCallback(
    (presetId: Parameters<typeof getCanvasPresetById>[0]) => {
      const preset = getCanvasPresetById(presetId);

      if (!canvasShell) {
        initializeDefaultCanvas();
      }

      resizeCanvas(preset.size, preset.id);
      setDefaultCanvasPresetId(preset.id);
      handleDismiss(); // Reusing the dismiss logic
    },
    [
      canvasShell,
      initializeDefaultCanvas,
      resizeCanvas,
      setDefaultCanvasPresetId,
      handleDismiss,
    ],
  );

  // -- Effects / Hooks --
  useDismissibleLayer({
    containerRef,
    isOpen: isPresetMenuOpen,
    onDismiss: handleDismiss,
  });

  // -- Render Helpers --
  const renderPresetList = () => (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setActivePresetGroupId(null)}
        className="ui-button w-full justify-start rounded-xl px-3 text-left text-sm font-semibold"
      >
        <Icon icon="solar:alt-arrow-left-linear" className="text-base" />
        <span>{activeGroup!.label}</span>
      </button>

      {activeGroup!.presets.map((preset) => {
        const isActive =
          activePreset.kind === "preset" &&
          preset.id === activePreset.preset.id;

        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleSelectPreset(preset.id)}
            className={clsx(
              "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition",
              isActive
                ? "bg-accent-light/70 text-title-color"
                : "text-title-color hover:bg-surface-3/90",
            )}
          >
            <span className="text-sm font-semibold">{preset.label}</span>
            <span className="text-xs text-secondary-text">
              {preset.size.width} x {preset.size.height}
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderGroupList = () => (
    <div className="space-y-1">
      {presetGroups.map((group) => {
        const isActive =
          activePreset.kind === "preset" && group.id === activePreset.group.id;

        return (
          <button
            key={group.id}
            type="button"
            onClick={() =>
              setActivePresetGroupId(group.id as CanvasPresetGroupId)
            }
            className={clsx(
              "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition",
              isActive
                ? "bg-accent-light/70 text-title-color"
                : "text-title-color hover:bg-surface-3/90",
            )}
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <Icon
                icon={getCanvasPresetGroupIcon(group.id)}
                className="text-base"
              />
              <span>{group.label}</span>
            </span>
            <span className="text-xs text-secondary-text">
              {group.presets.length} presets
            </span>
          </button>
        );
      })}
    </div>
  );

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
          <span className="block truncate font-sans">{activeLabel}</span>
        </div>
      </button>

      {isPresetMenuOpen && (
        <div className="bg-card-bg absolute right-0 top-full mt-2 z-50 w-72 overflow-y-auto p-2 rounded-lg border border-border-color">
          {activeGroup ? renderPresetList() : renderGroupList()}
        </div>
      )}
    </div>
  );
};
