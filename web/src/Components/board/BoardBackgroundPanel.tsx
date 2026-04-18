import { useActiveCanvasBackground } from "@/stores/useCanvasStore";
import type { CanvasBackgroundPreset } from "@/types/canvas";

type BoardBackgroundPanelProps = {
  backgroundPresets: CanvasBackgroundPreset[];
  onBackgroundSelect: (backgroundPresetId: string) => void;
};

export const BoardBackgroundPanel = ({
  backgroundPresets,
  onBackgroundSelect,
}: BoardBackgroundPanelProps) => {
  const activeBackground = useActiveCanvasBackground();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-lg outline outline-1 outline-border-color/60"
          style={{ background: activeBackground?.preview }}
        />
        <div>
          <p className="text-sm font-semibold text-title-color">
            {activeBackground?.label ?? "White"}
          </p>
          <p className="text-xs text-secondary-text">Canvas fill</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {backgroundPresets.map((backgroundPreset) => (
          <button
            key={backgroundPreset.id}
            type="button"
            onClick={() => onBackgroundSelect(backgroundPreset.id)}
            className="rounded-xl p-2 text-left outline outline-1 outline-border-color/60 transition hover:outline-accent/70"
          >
            <div
              className="h-12 rounded-md outline outline-1 outline-border-color/60"
              style={{ background: backgroundPreset.preview }}
            />
            <span className="mt-2 block text-xs font-semibold text-title-color">
              {backgroundPreset.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
