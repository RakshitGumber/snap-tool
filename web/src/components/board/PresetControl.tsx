import { useRef, useState } from "react";

import { Icon } from "@iconify/react";
import clsx from "clsx";

import { getCanvasPresetGroupIcon } from "@/board/config";
import { useDismissibleLayer } from "@/libs/useDismissibleLayer";
import type { CanvasPresetGroupId } from "@/types/canvas";

export const BoardPresetControl = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeGroupId, setActiveGroupId] =
    useState<CanvasPresetGroupId | null>(null);
  const menuOffsetX = 0;
  const menuMaxHeight = undefined;

  const activeLabel =
    activePreset.kind === "preset" ? activePreset.preset.label : "Custom";
  const activeDetail =
    activePreset.kind === "preset"
      ? `${activePreset.preset.size.width} x ${activePreset.preset.size.height}`
      : `${activePreset.size.width} x ${activePreset.size.height}`;
  const activeIcon =
    activePreset.kind === "preset"
      ? getCanvasPresetGroupIcon(activePreset.group.id)
      : getCanvasPresetGroupIcon("general");
  const activeGroup =
    presetGroups.find((group) => group.id === activeGroupId) ?? null;

  useDismissibleLayer({
    containerRef,
    isOpen: isPresetMenuOpen,
    onDismiss: () => {
      setActiveGroupId(null);
      onPresetMenuOpenChange(false);
    },
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title="Resize canvas"
        aria-expanded={isPresetMenuOpen}
        onClick={() => {
          if (isPresetMenuOpen) {
            setActiveGroupId(null);
          }

          onPresetMenuOpenChange(!isPresetMenuOpen);
        }}
        className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-title-color transition hover:bg-secondary-text/20"
      >
        <Icon icon={activeIcon} className="text-lg" />
        <div className="min-w-0 text-left">
          <span className="ui-meta block truncate">{activeLabel}</span>
          <span className="block text-xs text-secondary-text">
            {activeDetail}
          </span>
        </div>
      </button>

      {isPresetMenuOpen && (
        <div
          className="bg-card-bg absolute left-0 top-full mt-2 z-50 w-72 overflow-y-auto p-2"
          style={{
            maxHeight: menuMaxHeight,
            transform: menuOffsetX ? `translateX(${menuOffsetX}px)` : undefined,
          }}
        >
          {activeGroup ? (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveGroupId(null)}
                className="ui-button w-full justify-start rounded-xl px-3 text-left text-sm font-semibold"
              >
                <Icon
                  icon="solar:alt-arrow-left-linear"
                  className="text-base"
                />
                <span>{activeGroup.label}</span>
              </button>

              {activeGroup.presets.map((preset) => {
                const isActive =
                  activePreset.kind === "preset" &&
                  preset.id === activePreset.preset.id;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setActiveGroupId(null);
                      onPresetMenuOpenChange(false);
                      onSelectPreset(preset.id);
                    }}
                    className={clsx(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition",
                      isActive
                        ? "bg-accent-light/70 text-title-color"
                        : "text-title-color hover:bg-surface-3/90",
                    )}
                  >
                    <span className="text-sm font-semibold">
                      {preset.label}
                    </span>
                    <span className="text-xs text-secondary-text">
                      {preset.size.width} x {preset.size.height}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {presetGroups.map((group) => {
                const isActive =
                  activePreset.kind === "preset" &&
                  group.id === activePreset.group.id;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGroupId(group.id)}
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
          )}
        </div>
      )}
    </div>
  );
};
