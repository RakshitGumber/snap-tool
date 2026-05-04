import { useCallback, useEffect, useRef } from "react";

import { useCanvasShell, useCanvasStore } from "@/stores/useCanvasStore";

const DEFAULT_CANVAS_TITLE = "untitled";

export const CanvasTitleField = () => {
  const titleRef = useRef<HTMLDivElement | null>(null);
  const canvasShell = useCanvasShell();
  const updateCanvasTitle = useCanvasStore((state) => state.updateCanvasTitle);
  const title = canvasShell?.title?.trim() || DEFAULT_CANVAS_TITLE;

  useEffect(() => {
    const element = titleRef.current;
    if (!element || document.activeElement === element) {
      return;
    }

    element.textContent = title;
  }, [title]);

  const commitTitle = useCallback(
    (rawTitle: string) => {
      const nextTitle = rawTitle.trim() || DEFAULT_CANVAS_TITLE;

      if (titleRef.current) {
        titleRef.current.textContent = nextTitle;
      }

      updateCanvasTitle(nextTitle);
    },
    [updateCanvasTitle],
  );

  return (
    <div
      ref={titleRef}
      role="textbox"
      aria-label="Canvas name"
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(event) => commitTitle(event.currentTarget.textContent ?? "")}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          if (titleRef.current) {
            titleRef.current.textContent = title;
          }
          event.currentTarget.blur();
        }
      }}
      className="min-w-[9rem] max-w-[14rem] rounded-xl border border-border-color/60 bg-card-bg px-3 py-2 text-sm font-semibold text-title-color outline-none transition focus:border-accent focus:ring-0"
    >
      {title}
    </div>
  );
};
