import { Icon } from "@iconify/react";

import { BACKGROUND_PRESET_CATEGORIES } from "@/config/backgroundPresets";
import { useCanvasStore } from "@/new_stores/useCanvasStore";

export const Background = () => {
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

            <div className="flex flex-wrap gap-4">
              {category.presets.map((preset) => {
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setActiveBackground(preset.id)}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className="block h-25 w-25 rounded-lg"
                      style={{ background: preset.background }}
                    />
                    <span className="px-3 py-2 text-xs font-semibold">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
};
