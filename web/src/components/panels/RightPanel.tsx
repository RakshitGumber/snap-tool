import { useState } from "react";
import { Icon } from "@iconify/react";
import clsx from "clsx";

import { getBackgroundPresetById } from "@/config/backgroundPresets";
import { CARD_SHADOW_OPTIONS } from "@/config/cardShadows";
import { useCanvasStore } from "@/stores/useCanvasStore";

import { Background } from "../controls/Background";
import { Images } from "../controls/Images";

type RightPanelView = "home" | "background";

export const RightPanel = () => {
  const [view, setView] = useState<RightPanelView>("home");
  const activeBackgroundId = useCanvasStore(
    (state) => state.activeBackgroundId,
  );
  const activeCard = useCanvasStore((state) => state.activeCard);
  const cardShadowSize = useCanvasStore((state) => state.cardShadowSize);
  const setCardShadowSize = useCanvasStore((state) => state.setCardShadowSize);

  const activeBackground = getBackgroundPresetById(activeBackgroundId);

  return (
    <aside className="w-96 flex flex-col bg-panel-bg border-l border-border-color select-none">
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
          <Background onBackgroundSelected={() => setView("home")} />
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

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <section className="rounded-lg border border-border-color bg-bg">
              <div className="flex items-center justify-between border-b border-border-color px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-title-color">
                    Link
                  </h3>
                  <p className="text-xs text-secondary-text">
                    {activeCard ? activeCard.label : "No card selected"}
                  </p>
                </div>
                <Icon
                  icon="mingcute:link-2-line"
                  fontSize={22}
                  className="text-secondary-text"
                />
              </div>
              <Images showHeader={false} />
            </section>

            <button
              type="button"
              onClick={() => setView("background")}
              className="rounded-lg border border-border-color bg-bg p-4 text-left transition hover:border-accent"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-title-color">
                    Background
                  </h3>
                  <p className="mt-1 truncate text-xs text-secondary-text">
                    {activeBackground.label}
                  </p>
                </div>
                <span
                  className="h-14 w-20 shrink-0 rounded-lg border border-border-color"
                  style={{ background: activeBackground.background }}
                />
              </div>
            </button>

            <section className="rounded-lg border border-border-color bg-bg p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-title-color">
                    Properties
                  </h3>
                  <p className="mt-1 text-xs text-secondary-text">Shadow</p>
                </div>
                <Icon
                  icon="mingcute:shadow-line"
                  fontSize={22}
                  className="text-secondary-text"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {CARD_SHADOW_OPTIONS.map((option) => {
                  const isActive = option.id === cardShadowSize;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setCardShadowSize(option.id)}
                      className={clsx(
                        "rounded-lg border px-3 py-2 text-sm font-semibold transition",
                        isActive
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border-color text-title-color hover:border-accent",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </>
      )}
    </aside>
  );
};
