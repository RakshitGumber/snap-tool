// Review note: Primary board sidebar navigation that switches between editing panels.
// The comments in this file are intentionally dense to support the requested review pass.

// Deprecated
import { useMemo, useCallback } from "react";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useShallow } from "zustand/react/shallow";

import { useEditorUiStore } from "@/stores/useEditorUiStore";

import { BoardBackgroundPanel } from "./BackgroundPanel";
import { BoardOverviewPanel } from "./OverviewPanel";
import { BoardTextPanel } from "./TextPanel";
import type { BoardSidebarSection } from "./types";
import { BoardUploadsPanel } from "./UploadsPanel";

/**
 * Keeps section_icons in one named constant so related calculations stay consistent.
 */
const SECTION_ICONS: Record<BoardSidebarSection["id"], string> = {
  overview: "solar:document-text-linear",
  background: "solar:pallete-2-linear",
  elements: "solar:widget-5-linear",
  text: "solar:text-field-focus-linear",
  uploads: "solar:gallery-add-linear",
};

/**
 * Keeps section_nav_labels in one named constant so related calculations stay consistent.
 */
const SECTION_NAV_LABELS: Record<BoardSidebarSection["id"], string> = {
  overview: "Overview",
  background: "BG",
  elements: "Elements",
  text: "Text",
  uploads: "Images",
};

/**
 * Renders the sidebar section navigation and delegates section changes to UI state.
 */
export const BoardSidebar = () => {
  const { openSectionId, isOpen, toggleSection, setSidebarOpen } =
    useEditorUiStore(
      useShallow((state) => ({
        openSectionId: state.openSectionId,
        isOpen: state.isSidebarOpen,
        toggleSection: state.toggleSection,
        setSidebarOpen: state.setSidebarOpen,
      })),
    );

  const sections = useMemo<BoardSidebarSection[]>(
    () => [
      {
        id: "overview",
        label: "Overview",
        content: <BoardOverviewPanel />,
      },
      {
        id: "background",
        label: "Background",
        content: <BoardBackgroundPanel />,
      },
      {
        id: "text",
        label: "Text",
        content: <BoardTextPanel />,
      },
      {
        id: "uploads",
        label: "Images",
        content: <BoardUploadsPanel />,
      },
    ],
    [],
  );

  const activeSection = useMemo(() => {
    // Render the final UI for this branch using the state derived above.
    return (
      sections.find((section) => section.id === openSectionId) ?? sections[0]
    );
  }, [sections, openSectionId]);

  const handleClosePanel = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  return (
    <aside
      className={clsx(
        "relative z-10 flex h-full shrink-0 bg-card-bg border-r-2 border-border-color",
      )}
    >
      <div
        className={clsx(
          "flex h-full shrink-0 flex-col border-r border-border-color w-18",
        )}
      >
        <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto px-2 py-3">
          <nav className="py-2 flex flex-col items-center gap-2">
            {sections.map((section) => {
              const isActive = section.id === openSectionId;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={clsx(
                    "flex w-12 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-center transition hover:bg-secondary-text/20",
                    isActive ? "text-title-color" : "text-secondary-text",
                  )}
                >
                  <Icon icon={SECTION_ICONS[section.id]} className="text-2xl" />
                  <span className="max-w-full text-[10px] font-semibold leading-[1.05]">
                    {SECTION_NAV_LABELS[section.id]}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {isOpen && (
        <div className="flex min-w-0 flex-1 flex-col border-r border-border-color w-80">
          <div className="flex items-center justify-between border-b border-border-color/50 px-5 py-4 select-none">
            <h2 className="text-lg font-semibold text-title-color font-sans">
              {activeSection.label ?? "Design"}
            </h2>

            <button
              type="button"
              aria-label="Close design panel"
              onClick={handleClosePanel}
              className="rounded-lg text-title-color cursor-pointer"
            >
              <Icon icon="solar:alt-arrow-left-linear" className="text-lg" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {activeSection.isPlaceholder ? (
              <div className="rounded-xl px-4 py-4 text-sm text-secondary-text">
                Coming soon
              </div>
            ) : (
              activeSection.content
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
