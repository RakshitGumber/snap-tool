import { Icon } from "@iconify/react";

import { BACKGROUND_PRESET_CATEGORIES } from "@/config/backgroundPresets";
import { useCanvasStore } from "@/stores/useCanvasStore";

type BackgroundProps = {
  onBackgroundSelected?: () => void;
};

export const Background = ({ onBackgroundSelected }: BackgroundProps) => {
  const activeBackgroundId = useCanvasStore(
    (state) => state.activeBackgroundId,
  );
  const setActiveBackground = useCanvasStore(
    (state) => state.setActiveBackground,
  );

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border-color p-4">
        <Icon
          icon="mingcute:background-fill"
          fontSize={32}
          className="text-secondary-text"
        />
        <span className="text-xl font-medium tracking-wide text-title-color">
          Background
        </span>
      </div>

      <div className="flex flex-col flex-1 px-4">
        {BACKGROUND_PRESET_CATEGORIES.map((category) => (
          <section
            key={category.id}
            className="flex flex-col justify-center gap-3 px-2 py-4"
          >
            <h3 className="text-base font-medium tracking-wide">
              {category.label}
            </h3>

            <div className="flex flex-wrap gap-2">
              {category.id === "solid" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBackground("red");
                      onBackgroundSelected?.();
                    }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="h-11 w-11 rounded-md text-panel-bg flex items-center justify-center"
                      style={{ background: category.presets[0].background }}
                    >
                      <Icon icon="mingcute:palette-line" fontSize={32}></Icon>
                    </div>
                  </button>
                  {category.presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setActiveBackground(preset.id);
                        onBackgroundSelected?.();
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        className="h-11 w-11 rounded-md"
                        style={{ background: preset.background }}
                      />
                    </button>
                  ))}
                </>
              ) : (
                category.presets.map((preset) => {
                  const isActive = preset.id === activeBackgroundId;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setActiveBackground(preset.id);
                        onBackgroundSelected?.();
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        className="block h-25 w-25 rounded-lg border"
                        style={{ background: preset.background }}
                      />
                      <span
                        className={
                          isActive
                            ? "px-3 py-2 text-xs font-semibold text-accent"
                            : "px-3 py-2 text-xs font-semibold"
                        }
                      >
                        {preset.label}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
};
