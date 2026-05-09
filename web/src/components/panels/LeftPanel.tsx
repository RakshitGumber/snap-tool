import { Icon } from "@iconify/react";
import { clsx } from "clsx";

import { useCanvasStore } from "@/new_stores/useCanvasStore";

type LeftPanelAction = {
  id: "undo" | "redo" | "delete";
  title: string;
  icon: string;
  disabled: boolean;
  onClick: () => void;
};

// const sections: LeftPanelSection[] = [
//   {
//     id: "overview",
//     title: "main",
//     icon: "mingcute:grid-2-fill",
//   },
//   {
//     id: "images",
//     title: "images",
//     icon: "mingcute:folder-open-2-line",
//   },
//   {
//     id: "background",
//     title: "bg",
//     icon: "mingcute:background-fill",
//   },
//   {
//     id: "text",
//     title: "text",
//     icon: "mingcute:cursor-text-fill",
//   },
// ];

export const LeftPanel = () => {
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const deleteActiveCard = useCanvasStore((state) => state.deleteActiveCard);
  const canUndo = useCanvasStore((state) => state.historyPast.length > 0);
  const canRedo = useCanvasStore((state) => state.historyFuture.length > 0);
  const hasActiveCard = useCanvasStore((state) => state.activeCard !== null);

  const actions: LeftPanelAction[] = [
    {
      id: "undo",
      title: "Undo",
      icon: "mingcute:back-line",
      disabled: !canUndo,
      onClick: undo,
    },
    {
      id: "redo",
      title: "Redo",
      icon: "mingcute:forward-line",
      disabled: !canRedo,
      onClick: redo,
    },
    {
      id: "delete",
      title: "Delete",
      icon: "mingcute:delete-2-line",
      disabled: !hasActiveCard,
      onClick: deleteActiveCard,
    },
  ];

  return (
    <aside className="h-full bg-panel-bg flex flex-col items-center justify-start gap-4 p-4 border-r border-border-color">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          aria-label={action.title}
          title={action.title}
          disabled={action.disabled}
          onClick={action.onClick}
          className={clsx(
            "flex flex-col p-1 rounded-lg outline-border-color hover:outline",
            action.disabled
              ? "cursor-not-allowed text-secondary-text/40 hover:outline-0"
              : "text-secondary-text hover:bg-text-color/8 hover:text-title-color",
          )}
        >
          <div className="px-1.5 py-2">
            <Icon icon={action.icon} fontSize={30} />
          </div>
          <span className="text-xs font-medium tracking-wide leading-3.25">
            {action.title}
          </span>
        </button>
      ))}
    </aside>
  );
};
