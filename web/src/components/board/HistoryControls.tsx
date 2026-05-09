// Review note: Undo and redo toolbar connected to the canvas history stacks.
// The comments in this file are intentionally dense to support the requested review pass.

import { Icon } from "@iconify/react";
import clsx from "clsx";

import { useCanvasStore } from "@/stores/useCanvasStore";
import { useEditorUiStore } from "@/stores/useEditorUiStore";

/**
 * Handles the control class name behavior for this module.
 */
const controlClassName =
  "flex h-10 w-10 items-center justify-center rounded-lg text-title-color transition hover:bg-text-color/20 disabled:cursor-not-allowed disabled:text-secondary-text/70 disabled:hover:bg-transparent";

/**
 * Renders undo and redo buttons with disabled states driven by history stacks.
 */
export const HistoryControls = () => {
  // Select this store or hook value close to where the component uses it.
  const undo = useCanvasStore((state) => state.undo);
  // Select this store or hook value close to where the component uses it.
  const redo = useCanvasStore((state) => state.redo);
  // Select this store or hook value close to where the component uses it.
  const updateLayoutAxisMode = useCanvasStore(
    (state) => state.updateLayoutAxisMode,
  );
  // Select this store or hook value close to where the component uses it.
  const removeSelectedObjects = useCanvasStore(
    (state) => state.removeSelectedObjects,
  );
  // Select this store or hook value close to where the component uses it.
  const canUndo = useCanvasStore((state) => state.historyPast.length > 0);
  // Select this store or hook value close to where the component uses it.
  const canRedo = useCanvasStore((state) => state.historyFuture.length > 0);
  // Select this store or hook value close to where the component uses it.
  const layoutAxisMode = useCanvasStore(
    (state) => state.canvasMeta?.layoutAxisMode ?? "none",
  );
  // Select this store or hook value close to where the component uses it.
  const hasSelection = useEditorUiStore(
    (state) => state.selectedObjects.length > 0,
  );

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Undo"
        title="Undo"
        onClick={undo}
        disabled={!canUndo}
        className={controlClassName}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M8.29183 5.0835L3.3335 10.0002L8.29183 14.9168"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.1665 10H11.2498C13.551 10 15.4165 11.8655 15.4165 14.1667V14.5833"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Redo"
        title="Redo"
        onClick={redo}
        disabled={!canRedo}
        className={controlClassName}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M11.7082 5.0835L16.6665 10.0002L11.7082 14.9168"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.8335 10H8.75016C6.449 10 4.5835 11.8655 4.5835 14.1667V14.5833"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Vertical axis layout"
        title="Vertical axis layout"
        onClick={() =>
          updateLayoutAxisMode(
            layoutAxisMode === "vertical" ? "none" : "vertical",
          )
        }
        className={clsx(
          controlClassName,
          layoutAxisMode === "vertical" && "bg-accent/10 text-accent",
        )}
      >
        <span className="text-xs font-bold">V</span>
      </button>

      <button
        type="button"
        aria-label="Horizontal axis layout"
        title="Horizontal axis layout"
        onClick={() =>
          updateLayoutAxisMode(
            layoutAxisMode === "horizontal" ? "none" : "horizontal",
          )
        }
        className={clsx(
          controlClassName,
          layoutAxisMode === "horizontal" && "bg-accent/10 text-accent",
        )}
      >
        <span className="text-xs font-bold">H</span>
      </button>

      <button
        type="button"
        aria-label="Delete selected object"
        title="Delete selected object"
        onClick={removeSelectedObjects}
        disabled={!hasSelection}
        className={controlClassName}
      >
        <Icon icon="solar:trash-bin-minimalistic-linear" className="text-xl" />
      </button>
    </div>
  );
};
