import { Icon } from "@iconify/react";
import { clsx } from "clsx";

import { type PanelSectionId, usePanelStore } from "@/new_stores/usePanelStore";

type LeftPanelSection = {
  id: PanelSectionId;
  title: string;
  icon: string;
};

const sections: LeftPanelSection[] = [
  {
    id: "overview",
    title: "main",
    icon: "mingcute:grid-2-fill",
  },
  // {
  //   id: "images",
  //   title: "images",
  //   icon: "mingcute:folder-open-2-line",
  // },
  // {
  //   id: "background",
  //   title: "bg",
  //   icon: "mingcute:background-fill",
  // },
  // {
  //   id: "text",
  //   title: "text",
  //   icon: "mingcute:cursor-text-fill",
  // },
];

export const LeftPanel = () => {
  const activePanelId = usePanelStore((state) => state.activePanelId);
  const setActivePanelId = usePanelStore((state) => state.setActivePanelId);

  return (
    <aside className="h-full bg-panel-bg flex flex-col items-center justify-start gap-4 p-4 border-r border-border-color">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          aria-pressed={activePanelId === section.id}
          onClick={() => setActivePanelId(section.id)}
          className={clsx(
            "flex flex-col p-1 rounded-lg outline-border-color hover:outline",
            activePanelId === section.id
              ? "bg-text-color/10 text-title-color outline"
              : "text-secondary-text hover:bg-text-color/8",
          )}
        >
          <div className="px-1.5 py-2">
            <Icon icon={section.icon} fontSize={30} />
          </div>
          <span className="text-xs font-medium tracking-wide leading-3.25">
            {section.title}
          </span>
        </button>
      ))}
    </aside>
  );
};
