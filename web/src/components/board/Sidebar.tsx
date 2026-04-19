import { Icon } from "@iconify/react";
import clsx from "clsx";

import { useLayoutConfig } from "@/stores/useConfigStore";
import { useCanvasShell } from "@/stores/useCanvasStore";
import { useEditorUiStore } from "@/stores/useEditorUiStore";

import { BoardBackgroundPanel } from "./BackgroundPanel";
import { BoardOverviewPanel } from "./OverviewPanel";
import { BoardTextPanel } from "./TextPanel";
import type { BoardSidebarSection } from "./types";
import { BoardUploadsPanel } from "./UploadsPanel";
import type { BoardSidebarSectionId } from "@/types/board";

const SECTION_ICONS: Record<BoardSidebarSectionId, string> = {
  overview: "solar:document-text-linear",
  background: "solar:pallete-2-linear",
  elements: "solar:widget-5-linear",
  text: "solar:text-field-focus-linear",
  uploads: "solar:gallery-add-linear",
};

export const BoardSidebar = () => {
  const canvasShell = useCanvasShell();
  const layout = useLayoutConfig();
  const openSectionId = useEditorUiStore((state) => state.openSectionId);
  const isOpen = useEditorUiStore((state) => state.isSidebarOpen);
  const toggleSection = useEditorUiStore((state) => state.toggleSection);
  const setSidebarOpen = useEditorUiStore((state) => state.setSidebarOpen);
  const sections: BoardSidebarSection[] = [
    {
      id: "overview",
      label: "Overview",
      description: "Canvas summary and active layer details.",
      content: <BoardOverviewPanel />,
    },
    {
      id: "background",
      label: "Background",
      description: "Pick a fill preset for the current canvas.",
      content: <BoardBackgroundPanel />,
    },
    {
      id: "elements",
      label: "Elements",
      description: "Reusable design elements will live here.",
      isPlaceholder: true,
    },
    {
      id: "text",
      label: "Text",
      description: "Add and edit text layers for the canvas.",
      content: <BoardTextPanel />,
    },
    {
      id: "uploads",
      label: "Uploads",
      description: "Import local files or URLs into the board.",
      content: <BoardUploadsPanel />,
    },
  ];
  const activeSection =
    sections.find((section) => section.id === openSectionId) ?? sections[0];
  const shouldShowSectionMeta = activeSection?.id !== "overview";

  return (
    <aside
      className={clsx(
        "relative z-10 flex h-full shrink-0 bg-card-bg/95 backdrop-blur-3xl",
        isOpen ? "border-r border-border-color/60" : "border-r-2 border-accent",
      )}
      style={{
        width: isOpen ? layout.sidebarWidth : layout.accessPanelWidth,
      }}
    >
      <div
        className={clsx(
          "flex h-full shrink-0 flex-col",
          isOpen && "border-r border-border-color/50",
        )}
        style={{ width: layout.accessPanelWidth }}
      >
        <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto px-2 py-3">
          <nav className="flex flex-col items-center gap-1">
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
          style={{ width: layout.designPanelWidth }}
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
              onClick={() => setSidebarOpen(false)}
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
