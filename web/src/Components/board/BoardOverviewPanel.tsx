import { useEffect, useState } from "react";

import { Icon } from "@iconify/react";
import clsx from "clsx";

import {
  getCanvasPresetById,
  getCanvasPresetGroupIcon,
  resolveCanvasPreset,
} from "@/board/config";
import {
  useActiveCanvas,
  useActiveCanvasBackground,
  useSelectedImageId,
} from "@/stores/useCanvasStore";
import type {
  CanvasBackgroundPreset,
  CanvasPreset,
  CanvasPresetGroup,
  CanvasPresetGroupId,
} from "@/types/canvas";

type BoardOverviewPanelProps = {
  backgroundPresets: CanvasBackgroundPreset[];
  presetGroups: CanvasPresetGroup[];
  onBackgroundSelect: (backgroundPresetId: string) => void;
  onSelectPreset: (presetId: CanvasPreset["id"]) => void;
  onOpenUploads: () => void;
};

const QUICK_BACKGROUND_PRESET_COUNT = 4;

export const BoardOverviewPanel = ({
  backgroundPresets,
  presetGroups,
  onBackgroundSelect,
  onSelectPreset,
  onOpenUploads,
}: BoardOverviewPanelProps) => {
  const activeBackground = useActiveCanvasBackground();
  const selectedImageId = useSelectedImageId();
  const activeCanvas = useActiveCanvas();
  const [selectedGroupId, setSelectedGroupId] = useState<CanvasPresetGroupId>("general");
  const defaultPreset = getCanvasPresetById("general-square");

  const quickBackgrounds = backgroundPresets.slice(0, QUICK_BACKGROUND_PRESET_COUNT);
  const activePreset = activeCanvas
    ? resolveCanvasPreset({
        width: activeCanvas.width,
        height: activeCanvas.height,
        presetId: activeCanvas.presetId,
      })
    : resolveCanvasPreset(defaultPreset.size);
  const visibleGroup =
    presetGroups.find((group) => group.id === selectedGroupId) ?? presetGroups[0];
  const imageCount = activeCanvas?.imageOrder.length ?? 0;
  const activePresetGroupId = activePreset.kind === "preset" ? activePreset.group.id : "general";
  const activePresetIcon = getCanvasPresetGroupIcon(activePresetGroupId);

  useEffect(() => {
    setSelectedGroupId(activePresetGroupId);
  }, [activePresetGroupId]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-title-color">
            <Icon icon={activePresetIcon} className="text-base" />
            <span>{activePreset.kind === "preset" ? activePreset.preset.label : "Custom"}</span>
          </p>
          <p className="mt-1 text-sm text-secondary-text">
            {activeCanvas
              ? `${activeCanvas.width} x ${activeCanvas.height}`
              : "Select a canvas to inspect its size."}
          </p>
        </div>
        <div className="rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-title-color outline outline-1 outline-border-color/60">
          Preset
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {presetGroups.map((group) => {
          const isActive = group.id === visibleGroup?.id;

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setSelectedGroupId(group.id)}
              className={clsx(
                "rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] outline outline-1 outline-border-color/60 transition",
                isActive
                  ? "bg-accent-light text-title-color outline-accent"
                  : "text-title-color hover:outline-accent/70",
              )}
            >
              <span className="inline-flex items-center gap-2">
                <Icon icon={getCanvasPresetGroupIcon(group.id)} className="text-sm" />
                <span>{group.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {visibleGroup?.presets.map((preset) => {
          const isActive =
            activePreset.kind === "preset" && preset.id === activePreset.preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.id)}
              className={clsx(
                "rounded-xl px-3 py-3 text-left outline outline-1 outline-border-color/60 transition",
                isActive
                  ? "text-title-color outline-accent"
                  : "text-title-color hover:outline-accent/70",
              )}
            >
              <span className="block text-sm font-semibold">{preset.label}</span>
              <span className="mt-1 block text-xs text-secondary-text">
                {preset.size.width} x {preset.size.height}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-lg outline outline-1 outline-border-color/60"
          style={{ background: activeBackground?.preview }}
        />
        <div>
          <p className="text-sm font-semibold text-title-color">
            {activeBackground?.label ?? "White"}
          </p>
          <p className="text-sm text-secondary-text">
            Quick fill presets. Open Background for the full library.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {quickBackgrounds.map((backgroundPreset) => {
          const isActive = backgroundPreset.id === activeBackground?.id;

          return (
            <button
              key={backgroundPreset.id}
              type="button"
              onClick={() => onBackgroundSelect(backgroundPreset.id)}
              className={clsx(
                "rounded-xl p-2 text-left outline outline-1 outline-border-color/60 transition",
                isActive ? "outline-accent" : "hover:outline-accent/70",
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
          );
        })}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-title-color">
            {imageCount} {imageCount === 1 ? "asset on canvas" : "assets on canvas"}
          </p>
          <p className="mt-1 text-sm text-secondary-text">
            {selectedImageId
              ? "An image is selected and ready to move."
              : "No image is selected on the active canvas."}
          </p>
        </div>
        <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-title-color outline outline-1 outline-border-color/60">
          {selectedImageId ? "Selected" : "Idle"}
        </span>
      </div>

      <button
        type="button"
        onClick={onOpenUploads}
        className="inline-flex items-center justify-center rounded-xl bg-title-color px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90"
      >
        Open uploads
      </button>
    </div>
  );
};
