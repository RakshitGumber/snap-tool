import { Icon } from "@iconify/react";
import {
  type AspectRatioPreset,
  type EditorTool,
} from "@/libs/editorSchema";

interface CreateToolbarProps {
  aspectRatio: AspectRatioPreset;
  activeTool: EditorTool;
  paintColor: string;
  onAspectRatioChange: (ratio: AspectRatioPreset) => void;
  onActiveToolChange: (tool: EditorTool) => void;
}

const ratioLabels: Record<AspectRatioPreset, string> = {
  "1:1": "Square",
  "9:16": "9:16",
  "16:9": "16:9",
};

export const CreateToolbar = ({
  aspectRatio: _aspectRatio,
  activeTool,
  paintColor,
  onAspectRatioChange: _onAspectRatioChange,
  onActiveToolChange,
}: CreateToolbarProps) => {
  return (
    <section className="relative z-30 shrink-0 border-b border-border-color bg-bg/95 px-5 py-3 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="font-styled flex items-center gap-2 rounded-xl bg-bg px-4 py-2 text-sm font-semibold tracking-wide text-title-color shadow-sm">
            <Icon icon="solar:crop-minimalistic-broken" className="text-lg" />
            Canvas
            <span className="rounded-full bg-accent-light px-2 py-1 text-xs text-title-color">
              {ratioLabels["1:1"]}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-border-color bg-bg p-1">
            <button
              type="button"
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                activeTool === "select"
                  ? "bg-accent text-bg"
                  : "text-title-color hover:bg-accent-light"
              }`}
              onClick={() => onActiveToolChange("select")}
            >
              Select
            </button>
            <button
              type="button"
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                activeTool === "paintBucket"
                  ? "bg-accent text-bg"
                  : "text-title-color hover:bg-accent-light"
              }`}
              onClick={() => onActiveToolChange("paintBucket")}
            >
              Paint Bucket
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-secondary-text">
          {activeTool === "paintBucket" ? (
            <>
              <span
                className="h-4 w-4 rounded-full border border-border-color"
                style={{ backgroundColor: paintColor }}
              />
              <span>Click the canvas to apply the selected color.</span>
            </>
          ) : (
            <span>Wheel to zoom, pan with middle-click or Shift plus left-drag, then drop stickers and icons onto the canvas.</span>
          )}
        </div>
      </div>
    </section>
  );
};
