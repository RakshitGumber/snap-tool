import { useState } from "react";
import { Icon } from "@iconify/react";

import { getBackgroundPresetById } from "@/config/backgroundPresets";
import { useCanvasStore } from "@/stores/useCanvasStore";

import { Background } from "../controls/Background";
import { Images } from "../controls/Images";

type RightPanelView = "home" | "background";

export const RightPanel = () => {
  const [view, setView] = useState<RightPanelView>("home");
  const activeBackgroundId = useCanvasStore(
    (state) => state.activeBackgroundId,
  );

  const activeBackground = getBackgroundPresetById(activeBackgroundId);

  return (
    <aside className="h-full min-h-0 w-96 shrink-0 flex flex-col bg-panel-bg border-l border-border-color select-none overflow-hidden">
      {view === "background" ? (
        <>
          <button
            type="button"
            onClick={() => setView("home")}
            className="flex items-center gap-2 border-b border-border-color px-4 py-3 text-sm font-semibold text-title-color transition hover:bg-text-color/8"
          >
            <Icon icon="mingcute:left-line" fontSize={20} />
            Controls
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Background onBackgroundSelected={() => setView("home")} />
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 border-b border-border-color p-4">
            <Icon
              icon="mingcute:layout-6-line"
              fontSize={32}
              className="text-secondary-text"
            />
            <span className="text-xl font-medium tracking-wide text-title-color">
              Controls
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-3 px-5 py-6">
              <h3 className="font-semibold text-lg">Link</h3>
              <Images />
            </div>
            <div className="flex px-5 flex-col gap-3 pb-6">
              <h3 className="font-semibold text-lg">Background</h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setView("background")}
                  className="h-25 w-25 rounded-lg border border-border-color"
                  style={{ background: activeBackground.background }}
                />
                <div>
                  <h3 className="font-semibold text-lg">
                    {activeBackground.label}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};
