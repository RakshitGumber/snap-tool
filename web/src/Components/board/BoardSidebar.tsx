import { Icon } from "@iconify/react";

import { DEFAULT_SIDEBAR_WIDTH } from "@/board/config";
import {
  useActiveCanvas,
  useActiveCanvasBackground,
} from "@/stores/useCanvasStore";

import { BoardAccordionSection } from "./BoardAccordionSection";
import type { BoardSidebarProps } from "./types";

export const BoardSidebar = ({
  backgroundPresets,
  sections,
  openSectionId,
  onSectionToggle,
  onBackgroundSelect,
  onToggleSidebar,
}: BoardSidebarProps) => {
  const activeCanvas = useActiveCanvas();
  const activeBackground = useActiveCanvasBackground();

  return (
    <aside
      className="relative z-10 flex h-full shrink-0 flex-col border-r-2 border-accent bg-card-bg/95 backdrop-blur-3xl"
      style={{ width: DEFAULT_SIDEBAR_WIDTH }}
    >
      <div className="flex items-center justify-between border-b border-border-color/50 px-4 py-3">
        <div className="pointer-events-none text-secondary-text">
          <Icon icon="solar:sidebar-minimalistic-linear" className="text-lg" />
        </div>

        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-title-color transition hover:bg-accent-light"
        >
          <Icon icon="solar:alt-arrow-left-linear" className="text-lg" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-4 rounded-xl bg-bg/70 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-secondary-text">
            Active canvas
          </p>
          <p className="mt-1 text-sm font-semibold text-title-color">
            {activeCanvas?.title ?? "Canvas"}
          </p>
        </div>

        <div className="space-y-3">
          {sections.map((section) => (
            <BoardAccordionSection
              key={section.id}
              section={
                section.id === "background"
                  ? {
                      ...section,
                      content: (
                        <div className="space-y-4">
                          <div className="rounded-lg bg-card-bg/80 px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
                              Current background
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
                                <p className="text-xs text-secondary-text">
                                  Canvas fill
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {backgroundPresets.map((backgroundPreset) => (
                              <button
                                key={backgroundPreset.id}
                                type="button"
                                onClick={() =>
                                  onBackgroundSelect(backgroundPreset.id)
                                }
                                className="rounded-lg bg-card-bg/80 p-2 text-left transition hover:bg-accent-light"
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
                      ),
                    }
                  : section
              }
              isOpen={openSectionId === section.id}
              onToggle={() => onSectionToggle(section.id)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};
