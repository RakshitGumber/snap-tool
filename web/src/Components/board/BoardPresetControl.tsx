import { useEffect, useRef } from "react";

import { Icon } from "@iconify/react";
import clsx from "clsx";

import type { CanvasPresetId } from "@/types/canvas";

import type { BoardTopRibbonProps } from "./types";

type BoardPresetControlProps = Pick<
  BoardTopRibbonProps,
  | "activePreset"
  | "presets"
  | "isPresetMenuOpen"
  | "onPresetMenuOpenChange"
  | "onSelectPreset"
>;

export const BoardPresetControl = ({
  activePreset,
  presets,
  isPresetMenuOpen,
  onPresetMenuOpenChange,
  onSelectPreset,
}: BoardPresetControlProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onPresetMenuOpenChange(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [onPresetMenuOpenChange]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title="Resize canvas"
        aria-expanded={isPresetMenuOpen}
        onClick={() => onPresetMenuOpenChange(!isPresetMenuOpen)}
        className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-title-color transition hover:bg-accent-light"
      >
        <Icon icon="solar:ruler-angular-linear" className="text-lg" />
        <span className="text-xs font-semibold uppercase tracking-[0.12em]">
          {activePreset.label}
        </span>
      </button>

      {isPresetMenuOpen ? (
        <div className="absolute right-0 top-full z-30 mt-2 min-w-52 rounded-xl bg-card-bg p-2 outline outline-1 outline-border-color/60">
          {presets.map((preset) => {
            const isActive = preset.id === activePreset.id;
            const detail = preset.size
              ? `${preset.size.width} x ${preset.size.height}`
              : "Manual size";

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onPresetMenuOpenChange(false);
                  onSelectPreset(preset.id as CanvasPresetId);
                }}
                className={clsx(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-accent-light",
                  isActive ? "bg-accent-light text-title-color" : "text-title-color",
                )}
              >
                <span className="text-sm font-semibold capitalize">
                  {preset.label}
                </span>
                <span className="text-xs text-secondary-text">{detail}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
