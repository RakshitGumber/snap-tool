import { useCanvasStore } from "@/stores/useCanvasStore";

const controlClassName =
  "flex h-10 w-10 items-center justify-center rounded-lg text-title-color transition hover:bg-text-color/20 disabled:cursor-not-allowed disabled:text-secondary-text/70 disabled:hover:bg-transparent";

export const HistoryControls = () => {
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useCanvasStore((state) => state.historyPast.length > 0);
  const canRedo = useCanvasStore((state) => state.historyFuture.length > 0);

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
    </div>
  );
};
