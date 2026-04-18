import { useEffect, useRef, useState } from "react";

import { Icon } from "@iconify/react";
import clsx from "clsx";

import { getCanvasPresetGroupIcon } from "@/board/config";
import type {
  CanvasPresetGroup,
  CanvasPresetId,
  CanvasPresetGroupId,
  ResolvedCanvasPreset,
} from "@/types/canvas";

type BoardPresetControlProps = {
  activePreset: ResolvedCanvasPreset;
  presetGroups: CanvasPresetGroup[];
  isPresetMenuOpen: boolean;
  onPresetMenuOpenChange: (isOpen: boolean) => void;
  onSelectPreset: (presetId: CanvasPresetId) => void;
};

export const BoardPresetControl = ({
  activePreset,
  presetGroups,
  isPresetMenuOpen,
  onPresetMenuOpenChange,
  onSelectPreset,
}: BoardPresetControlProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<CanvasPresetGroupId | null>(null);
  const [menuOffsetX, setMenuOffsetX] = useState(0);
  const [menuMaxHeight, setMenuMaxHeight] = useState<number | undefined>(undefined);

  const activeLabel = activePreset.kind === "preset" ? activePreset.preset.label : "Custom";
  const activeDetail =
    activePreset.kind === "preset"
      ? `${activePreset.preset.size.width} x ${activePreset.preset.size.height}`
      : `${activePreset.size.width} x ${activePreset.size.height}`;
  const activeIcon =
    activePreset.kind === "preset"
      ? getCanvasPresetGroupIcon(activePreset.group.id)
      : getCanvasPresetGroupIcon("general");
  const activeGroup = presetGroups.find((group) => group.id === activeGroupId) ?? null;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onPresetMenuOpenChange(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [onPresetMenuOpenChange]);

  useEffect(() => {
    if (!isPresetMenuOpen) {
      setActiveGroupId(null);
      setMenuOffsetX(0);
      setMenuMaxHeight(undefined);
    }
  }, [isPresetMenuOpen]);

  useEffect(() => {
    if (!isPresetMenuOpen) {
      return;
    }

    const updateMenuBounds = () => {
      const menu = menuRef.current;
      if (!menu) {
        return;
      }

      const viewportPadding = 8;
      const rect = menu.getBoundingClientRect();
      let nextOffsetX = 0;

      if (rect.left < viewportPadding) {
        nextOffsetX += viewportPadding - rect.left;
      }

      if (rect.right > window.innerWidth - viewportPadding) {
        nextOffsetX -= rect.right - (window.innerWidth - viewportPadding);
      }

      const availableHeight = Math.max(
        160,
        Math.floor(window.innerHeight - rect.top - viewportPadding),
      );

      setMenuOffsetX(nextOffsetX);
      setMenuMaxHeight(availableHeight);
    };

    const frameId = window.requestAnimationFrame(updateMenuBounds);
    window.addEventListener("resize", updateMenuBounds);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateMenuBounds);
    };
  }, [activeGroupId, isPresetMenuOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title="Resize canvas"
        aria-expanded={isPresetMenuOpen}
        onClick={() => onPresetMenuOpenChange(!isPresetMenuOpen)}
        className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-title-color transition hover:bg-secondary-text/20"
      >
        <Icon icon={activeIcon} className="text-lg" />
        <div className="min-w-0 text-left">
          <span className="block truncate text-xs font-semibold uppercase tracking-[0.12em]">
            {activeLabel}
          </span>
          <span className="block text-[11px] text-secondary-text">{activeDetail}</span>
        </div>
      </button>

      {isPresetMenuOpen ? (
        <div
          ref={menuRef}
          className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl bg-card-bg p-2 outline outline-1 outline-border-color/60"
          style={{
            maxHeight: menuMaxHeight,
            transform: menuOffsetX === 0 ? undefined : `translateX(${menuOffsetX}px)`,
          }}
        >
          {activeGroup ? (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveGroupId(null)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-title-color transition hover:bg-accent-light"
              >
                <Icon icon="solar:alt-arrow-left-linear" className="text-base" />
                <span>{activeGroup.label}</span>
              </button>

              {activeGroup.presets.map((preset) => {
                const isActive =
                  activePreset.kind === "preset" && preset.id === activePreset.preset.id;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onPresetMenuOpenChange(false);
                      onSelectPreset(preset.id);
                    }}
                    className={clsx(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-accent-light",
                      isActive ? "bg-accent-light text-title-color" : "text-title-color",
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
          ) : (
            <div className="space-y-1">
              {presetGroups.map((group) => {
                const isActive =
                  activePreset.kind === "preset" && group.id === activePreset.group.id;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGroupId(group.id)}
                    className={clsx(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-accent-light",
                      isActive ? "bg-accent-light text-title-color" : "text-title-color",
                    )}
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-semibold">
                      <Icon icon={getCanvasPresetGroupIcon(group.id)} className="text-base" />
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
      ) : null}
    </div>
  );
};
