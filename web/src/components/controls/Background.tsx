import { Icon } from "@iconify/react";

import {
  BACKGROUND_PRESET_CATEGORIES,
  createCustomBackgroundId,
  DEFAULT_CUSTOM_BACKGROUND_COLOR,
  getCustomBackgroundColor,
  getBackgroundPresetStyle,
} from "@/config/backgroundPresets";
import { useCanvasStore } from "@/stores/useCanvasStore";
import { ColorPicker } from "../ui/ColorPicker";

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
  const selectedCustomColor =
    getCustomBackgroundColor(activeBackgroundId) ??
    DEFAULT_CUSTOM_BACKGROUND_COLOR;

  const handleCustomColorChange = (color: string) => {
    setActiveBackground(createCustomBackgroundId(color));
  };

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
                  <ColorPicker
                    value={selectedCustomColor}
                    onChange={handleCustomColorChange}
                  />
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
                        className="h-11.5 w-11.5 rounded-md"
                        style={getBackgroundPresetStyle(preset)}
                      />
                    </button>
                  ))}
                </>
              ) : (
                category.presets.map((preset) => {
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setActiveBackground(preset.id);
                        onBackgroundSelected?.();
                      }}
                      className="flex flex-col items-center"
                    >
                      <span
                        className="block h-25 w-25 rounded-lg"
                        style={getBackgroundPresetStyle(preset)}
                      />
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
