import type {
  CanvasFontFamily,
  ImageShadowPreset,
  TextColorMode,
} from "@/libs/canvasComposition";
import { useCanvasStore } from "@/stores/useCanvasStore";

const fontFamilies: CanvasFontFamily[] = ["Roboto", "Inter Variable"];
const shadowPresets: ImageShadowPreset[] = ["none", "soft", "strong"];
const textColorModes: Array<{ id: TextColorMode; label: string }> = [
  { id: "auto", label: "Auto" },
  { id: "black", label: "Black" },
  { id: "white", label: "White" },
];

const labelClass =
  "text-xs font-semibold uppercase tracking-wide text-secondary-text";
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
  const toggleImageVisible = useCanvasStore((state) => state.toggleImageVisible);
  const toggleTextVisible = useCanvasStore((state) => state.toggleTextVisible);

  if (!activeComposition) {
    return (
      <div className="rounded-lg border border-dashed border-border-color px-3 py-4 text-sm font-medium text-secondary-text">
        Add a YouTube link to edit the canvas.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border-color bg-bg p-3">
        <p className={labelClass}>Elements</p>
        <div className="mt-2 grid gap-2">
          <button
            type="button"
            onClick={toggleImageVisible}
            className="flex items-center justify-between gap-3 rounded-lg border border-border-color bg-panel-bg px-3 py-2 text-sm font-semibold text-title-color transition hover:bg-text-color/8"
          >
            <span>Thumbnail</span>
            <span className="text-xs font-bold text-secondary-text">
              {activeComposition.image.visible ? "Shown" : "Hidden"}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleTextVisible}
            className="flex items-center justify-between gap-3 rounded-lg border border-border-color bg-panel-bg px-3 py-2 text-sm font-semibold text-title-color transition hover:bg-text-color/8"
          >
            <span>Title</span>
            <span className="text-xs font-bold text-secondary-text">
              {activeComposition.text.visible ? "Shown" : "Hidden"}
            </span>
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border-color bg-bg p-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className={labelClass}>Text</p>
          <p className="text-xs font-semibold text-secondary-text">
            Auto-scales while resizing
          </p>
        </div>

        <div className="mt-3 grid gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Color</span>
            <select
              value={activeComposition.text.colorMode}
              onChange={(event) =>
                updateTextSettings({
                  colorMode: event.currentTarget.value as TextColorMode,
                })
              }
              className={inputClass}
            >
              {textColorModes.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
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

          <label className="flex items-center justify-between gap-3 rounded-lg border border-border-color bg-panel-bg px-3 py-2">
            <span className="text-sm font-semibold text-title-color">
              Text background
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
      </section>

      <section className="rounded-xl border border-border-color bg-bg p-3">
        <p className={labelClass}>Layout</p>
        <div className="mt-3 grid gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Padding</span>
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
        </div>
      </section>

      <section className="rounded-xl border border-border-color bg-bg p-3">
        <p className={labelClass}>Image</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
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
      </section>
    </div>
  );
};
