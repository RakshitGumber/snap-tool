import { Icon } from "@iconify/react";

const sections = [
  {
    title: "images",
    icon: "mingcute:folder-open-2-line",
  },
  {
    title: "bg",
    icon: "mingcute:background-fill",
  },
  {
    title: "text",
    icon: "mingcute:cursor-text-fill",
  },
];

export const LeftPanel = () => {
  return (
    <aside className="h-full bg-panel-bg flex flex-col items-center justify-start gap-4 p-4 border-r border-border-color">
      {sections.map((section) => (
        <button className="flex flex-col text-secondary-text hover:bg-text-color/8 outline-border-color hover:outline p-1 rounded-lg">
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
