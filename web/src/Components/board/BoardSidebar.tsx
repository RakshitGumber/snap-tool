import { Icon } from "@iconify/react";
import clsx from "clsx";

import {
  DEFAULT_ACCESS_PANEL_WIDTH,
  DEFAULT_DESIGN_PANEL_WIDTH,
  DEFAULT_SIDEBAR_WIDTH,
} from "@/board/config";
import { useCanvasShell } from "@/stores/useCanvasStore";

import type { BoardSidebarProps, BoardSidebarSectionId } from "./types";

const SECTION_ICONS: Record<BoardSidebarSectionId, string> = {
  overview: "solar:document-text-linear",
  background: "solar:pallete-2-linear",
  elements: "solar:widget-5-linear",
  text: "solar:text-field-focus-linear",
  uploads: "solar:gallery-add-linear",
};

export const BoardSidebar = ({
  isOpen,
  sections,
  openSectionId,
  onSectionToggle,
  onToggleSidebar,
}: BoardSidebarProps) => {
  const canvasShell = useCanvasShell();
  const activeSection = sections.find((section) => section.id === openSectionId) ?? sections[0];
  const shouldShowSectionMeta = activeSection?.id !== "overview";

  return (
    <aside
      className={clsx(
        "relative z-10 flex h-full shrink-0 bg-card-bg/95 backdrop-blur-3xl",
        isOpen ? "border-r border-border-color/60" : "border-r-2 border-accent",
      )}
      style={{ width: isOpen ? DEFAULT_SIDEBAR_WIDTH : DEFAULT_ACCESS_PANEL_WIDTH }}
    >
      <div
        className={clsx(
          "flex h-full shrink-0 flex-col",
          isOpen && "border-r border-border-color/50",
        )}
        style={{ width: DEFAULT_ACCESS_PANEL_WIDTH }}
      >
        <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto px-2 py-3">
          <nav className="flex flex-col items-center gap-1">
            {sections.map((section) => {
              const isActive = section.id === openSectionId;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onSectionToggle(section.id)}
                  className={clsx(
                    "flex w-12 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-center transition hover:bg-secondary-text/20",
                    isActive
                      ? "text-title-color"
                      : "text-secondary-text",
                  )}
                >
                  <Icon icon={SECTION_ICONS[section.id]} className="text-xl" />
                  <span className="block text-[10px] font-semibold leading-tight">
                    {section.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {isOpen ? (
        <div
          className="flex min-w-0 flex-1 flex-col border-r-2 border-accent"
          style={{ width: DEFAULT_DESIGN_PANEL_WIDTH }}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border-color/50 px-5 py-4">
            <div className="min-w-0">
              {shouldShowSectionMeta ? (
                <p className="text-xs uppercase tracking-[0.16em] text-secondary-text">
                  {canvasShell?.title ?? "Canvas"}
                </p>
              ) : null}
              <h2 className="mt-1 text-lg font-semibold text-title-color">
                {activeSection?.label ?? "Design"}
              </h2>
              {shouldShowSectionMeta ? (
                <p className="mt-1 text-sm text-secondary-text">
                  {activeSection?.description ?? "Select a panel option"}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              aria-label="Close design panel"
              onClick={() => onToggleSidebar(false)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-title-color transition hover:bg-secondary-text/20"
            >
              <Icon icon="solar:alt-arrow-left-linear" className="text-lg" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {activeSection?.isPlaceholder ? (
              <div className="rounded-xl px-4 py-4 text-sm text-secondary-text">
                Coming soon
              </div>
            ) : (
              activeSection?.content
            )}
          </div>
        </div>
      ) : null}
    </aside>
  );
};
