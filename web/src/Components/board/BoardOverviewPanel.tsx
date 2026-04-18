import clsx from "clsx";

import { getCanvasPresetIdFromSize } from "@/board/config";
import {
  useActiveCanvas,
  useActiveCanvasBackground,
  useCanvasStore,
} from "@/stores/useCanvasStore";
import type { CanvasBackgroundPreset, CanvasPreset } from "@/types/canvas";

type BoardOverviewPanelProps = {
  backgroundPresets: CanvasBackgroundPreset[];
  sizePresets: CanvasPreset[];
  onBackgroundSelect: (backgroundPresetId: string) => void;
  onSelectPreset: (presetId: CanvasPreset["id"]) => void;
  onOpenUploads: () => void;
};

const QUICK_BACKGROUND_PRESET_COUNT = 4;

const cardClassName =
  "rounded-2xl p-4 outline outline-1 outline-border-color/60";

export const BoardOverviewPanel = ({
  backgroundPresets,
  sizePresets,
  onBackgroundSelect,
  onSelectPreset,
  onOpenUploads,
}: BoardOverviewPanelProps) => {
  const activeCanvas = useActiveCanvas();
  const activeBackground = useActiveCanvasBackground();
  const selectedImageId = useCanvasStore((state) => state.selectedImageId);

  const quickBackgrounds = backgroundPresets.slice(0, QUICK_BACKGROUND_PRESET_COUNT);
  const selectableSizePresets = sizePresets.filter((preset) => preset.size);
  const activePresetId = activeCanvas
    ? getCanvasPresetIdFromSize({
        width: activeCanvas.width,
        height: activeCanvas.height,
      })
    : sizePresets[0]?.id;
  const imageCount = activeCanvas?.images.length ?? 0;

  return (
    <div className="space-y-4">
      <section className={cardClassName}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
              Canvas
            </p>
            <h3 className="mt-1 text-base font-semibold text-title-color">
              {activeCanvas?.title ?? "No canvas selected"}
            </h3>
            <p className="mt-1 text-sm text-secondary-text">
              Active board surface and summary details.
            </p>
          </div>
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-title-color outline outline-1 outline-border-color/60">
            {imageCount} {imageCount === 1 ? "image" : "images"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl px-3 py-3 outline outline-1 outline-border-color/60">
            <p className="text-[11px] uppercase tracking-[0.12em] text-secondary-text">
              Position X
            </p>
            <p className="mt-1 text-sm font-semibold text-title-color">
              {activeCanvas ? Math.round(activeCanvas.x) : "—"}
            </p>
          </div>
          <div className="rounded-xl px-3 py-3 outline outline-1 outline-border-color/60">
            <p className="text-[11px] uppercase tracking-[0.12em] text-secondary-text">
              Position Y
            </p>
            <p className="mt-1 text-sm font-semibold text-title-color">
              {activeCanvas ? Math.round(activeCanvas.y) : "—"}
            </p>
          </div>
        </div>
      </section>

      <section className={cardClassName}>
        <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">Size</p>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold capitalize text-title-color">
              {activePresetId === "custom" ? "Custom" : activePresetId}
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

        <div className="mt-4 grid grid-cols-3 gap-2">
          {selectableSizePresets.map((preset) => {
            const isActive = preset.id === activePresetId;

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
                <span className="block text-sm font-semibold capitalize">
                  {preset.label}
                </span>
                <span className="mt-1 block text-xs text-secondary-text">
                  {preset.size
                    ? `${preset.size.width} x ${preset.size.height}`
                    : "Manual size"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={cardClassName}>
        <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
          Background
        </p>
        <div className="mt-3 flex items-center gap-3">
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

        <div className="mt-4 grid grid-cols-2 gap-2">
          {quickBackgrounds.map((backgroundPreset) => {
            const isActive = backgroundPreset.id === activeBackground?.id;

            return (
              <button
                key={backgroundPreset.id}
                type="button"
                onClick={() => onBackgroundSelect(backgroundPreset.id)}
                className={clsx(
                  "rounded-xl p-2 text-left outline outline-1 outline-border-color/60 transition",
                  isActive
                    ? "outline-accent"
                    : "hover:outline-accent/70",
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
      </section>

      <section className={cardClassName}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
              Content
            </p>
            <p className="mt-1 text-sm font-semibold text-title-color">
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
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-title-color px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90"
        >
          Open uploads
        </button>
      </section>
    </div>
  );
};
