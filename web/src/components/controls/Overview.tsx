import type {
  CanvasFontFamily,
  ImageShadowPreset,
  TextPosition,
} from "@/libs/canvasComposition";
import { useCanvasStore } from "@/stores/useCanvasStore";

const fontFamilies: CanvasFontFamily[] = ["Roboto", "Inter Variable"];
const shadowPresets: ImageShadowPreset[] = ["none", "soft", "strong"];
const textPositions: TextPosition[] = ["below", "above"];

const labelClass = "text-xs font-semibold uppercase tracking-wide text-secondary-text";
const inputClass =
  "h-9 rounded-md border border-border-color bg-bg px-3 text-sm font-semibold text-title-color outline-none focus:border-accent";

export const Overview = () => {
  const activeComposition = useCanvasStore((state) => state.activeComposition);
  const updateTextSettings = useCanvasStore((state) => state.updateTextSettings);
  const updateImageSettings = useCanvasStore(
    (state) => state.updateImageSettings,
  );
  const updateLayoutSettings = useCanvasStore(
    (state) => state.updateLayoutSettings,
  );

  if (!activeComposition) {
    return (
      <div className="rounded-lg border border-dashed border-border-color px-3 py-4 text-sm font-medium text-secondary-text">
        Add a YouTube link to edit the canvas.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Text position</span>
        <select
          value={activeComposition.text.position}
          onChange={(event) =>
            updateTextSettings({
              position: event.currentTarget.value as TextPosition,
            })
          }
          className={inputClass}
        >
          {textPositions.map((position) => (
            <option key={position} value={position}>
              {position === "below" ? "Below image" : "Above image"}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Spacing</span>
        <input
          type="number"
          min={0}
          max={160}
          value={activeComposition.layout.spacing}
          onChange={(event) =>
            updateLayoutSettings({
              spacing: Number(event.currentTarget.value),
            })
          }
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Font</span>
          <select
            value={activeComposition.text.fontFamily}
            onChange={(event) =>
              updateTextSettings({
                fontFamily: event.currentTarget.value as CanvasFontFamily,
              })
            }
            className={inputClass}
          >
            {fontFamilies.map((fontFamily) => (
              <option key={fontFamily} value={fontFamily}>
                {fontFamily === "Inter Variable" ? "Inter" : fontFamily}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Size</span>
          <input
            type="number"
            min={12}
            max={96}
            value={activeComposition.text.fontSize}
            onChange={(event) =>
              updateTextSettings({
                fontSize: Number(event.currentTarget.value),
              })
            }
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Radius</span>
          <input
            type="number"
            min={0}
            max={80}
            value={activeComposition.image.radius}
            onChange={(event) =>
              updateImageSettings({
                radius: Number(event.currentTarget.value),
              })
            }
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Shadow</span>
          <select
            value={activeComposition.image.shadow}
            onChange={(event) =>
              updateImageSettings({
                shadow: event.currentTarget.value as ImageShadowPreset,
              })
            }
            className={inputClass}
          >
            {shadowPresets.map((shadow) => (
              <option key={shadow} value={shadow}>
                {shadow === "none"
                  ? "None"
                  : shadow === "soft"
                    ? "Soft"
                    : "Strong"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-lg border border-border-color bg-bg px-3 py-2">
        <span className="text-sm font-semibold text-title-color">
          Text overlay
        </span>
        <input
          type="checkbox"
          checked={activeComposition.text.overlay.enabled}
          onChange={(event) =>
            updateTextSettings({
              overlayEnabled: event.currentTarget.checked,
            })
          }
          className="h-4 w-4 accent-accent"
        />
      </label>
    </div>
  );
};
