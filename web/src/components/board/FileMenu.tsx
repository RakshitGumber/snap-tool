import { useRef } from "react";

import { ThemeButton } from "@/components/ui/ThemeButton";
import { useDismissibleLayer } from "@/libs/useDismissibleLayer";
import { useRouter } from "@/stores/useRouter";
import { useCanvasStore } from "@/stores/useCanvasStore";
import { useEditorUiStore } from "@/stores/useEditorUiStore";
import { Icon } from "@iconify/react";

export const FileMenu = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isOpen = useEditorUiStore((state) => state.isFileMenuOpen);
  const setIsOpen = useEditorUiStore((state) => state.setFileMenuOpen);
  const setRoute = useRouter((state) => state.setRoute);
  const clearCanvas = useCanvasStore((state) => state.clearCanvas);

  const handleGoHome = () => {
    setRoute("/");
    setIsOpen(false);
  };

  const handleClearCanvas = () => {
    clearCanvas();
    setIsOpen(false);
  };

  useDismissibleLayer({
    containerRef,
    isOpen,
    onDismiss: () => setIsOpen(false),
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-1 rounded-lg px-3 hover:bg-text-color/20 py-2 cursor-pointer"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.19119 3.15595C7.30475 2.94802 6.38222 2.94802 5.49578 3.15595C4.33479 3.42828 3.42828 4.33479 3.15595 5.49578C2.94802 6.38222 2.94802 7.30475 3.15595 8.19119C3.42828 9.35218 4.33479 10.2587 5.49578 10.531C6.38222 10.739 7.30475 10.739 8.19119 10.531C9.35218 10.2587 10.2587 9.35218 10.531 8.19119C10.739 7.30475 10.739 6.38222 10.531 5.49578C10.2587 4.33479 9.35218 3.42828 8.19119 3.15595Z"
            fill="currentColor"
          />
          <path
            d="M8.19119 13.469C7.30475 13.261 6.38222 13.261 5.49578 13.469C4.33479 13.7413 3.42828 14.6478 3.15595 15.8088C2.94802 16.6952 2.94802 17.6178 3.15595 18.5042C3.42828 19.6652 4.33479 20.5717 5.49578 20.8441C6.38222 21.052 7.30475 21.052 8.19119 20.8441C9.35218 20.5717 10.2587 19.6652 10.531 18.5042C10.739 17.6178 10.739 16.6952 10.531 15.8088C10.2587 14.6478 9.35218 13.7413 8.19119 13.469Z"
            fill="currentColor"
          />
          <path
            d="M18.5042 3.15595C17.6178 2.94802 16.6952 2.94802 15.8088 3.15595C14.6478 3.42828 13.7413 4.33479 13.469 5.49578C13.261 6.38222 13.261 7.30475 13.469 8.19119C13.7413 9.35218 14.6478 10.2587 15.8088 10.531C16.6952 10.739 17.6178 10.739 18.5042 10.531C19.6652 10.2587 20.5717 9.35218 20.8441 8.19119C21.052 7.30475 21.052 6.38222 20.8441 5.49578C20.5717 4.33479 19.6652 3.42828 18.5042 3.15595Z"
            fill="currentColor"
          />
          <path
            d="M18.5042 13.469C17.6178 13.261 16.6952 13.261 15.8088 13.469C14.6478 13.7413 13.7413 14.6478 13.469 15.8088C13.261 16.6952 13.261 17.6178 13.469 18.5042C13.7413 19.6652 14.6478 20.5717 15.8088 20.8441C16.6952 21.052 17.6178 21.052 18.5042 20.8441C19.6652 20.5717 20.5717 19.6652 20.8441 18.5042C21.052 17.6178 21.052 16.6952 20.8441 15.8088C20.5717 14.6478 19.6652 13.7413 18.5042 13.469Z"
            fill="var(--text-heading)"
          />
        </svg>

        <span className="text-sm font-sans font-bold uppercase tracking-[0.16em] text-title-color">
          File
        </span>
      </button>

      {isOpen ? (
        <div className="absolute -left-3 top-full z-50 mt-2 min-w-48 rounded-lg bg-card-bg p-2 border-2 border-border-color">
          <div className="space-y-2 font-sans capitalize">
            <button
              type="button"
              onClick={handleGoHome}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-title-color transition hover:bg-title-color/20"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.7972 11.7821C21.0676 11.51 21.0676 11.0687 20.7972 10.7966L15.0664 5.02821C14.48 4.43789 13.991 3.94564 13.5506 3.60741C13.0857 3.2504 12.5946 3 12 3C11.4054 3 10.9143 3.2504 10.4494 3.60741C10.009 3.94564 9.51998 4.43789 8.93355 5.02821L3.20277 10.7966C2.93241 11.0687 2.93241 11.51 3.20277 11.7821C3.47314 12.0542 3.91148 12.0542 4.18184 11.7821L4.57845 11.3829V14.4332C4.57845 17.4273 6.62594 20.0276 9.52196 20.7114C11.1519 21.0962 12.8481 21.0962 14.478 20.7114C17.374 20.0276 19.4215 17.4273 19.4215 14.4332V11.3829L19.8182 11.7821C20.0885 12.0542 20.5269 12.0542 20.7972 11.7821Z"
                  fill="currentColor"
                />
              </svg>

              <span>Home</span>
            </button>
            <button
              type="button"
              onClick={handleClearCanvas}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-title-color transition hover:bg-title-color/20"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M12 3C11.3742 3 10.753 3.11031 10.1712 3.32613C9.58938 3.54196 9.05585 3.86006 8.60284 4.26577C8.14968 4.67161 7.78526 5.1579 7.53483 5.69935C7.38345 6.02664 7.27593 6.36939 7.21453 6.72006H3.69231C3.30996 6.72006 3 7.03235 3 7.41757C3 7.8028 3.30996 8.11509 3.69231 8.11509H4.84615V12.1622C4.84615 13.6812 5.05998 15.1924 5.48125 16.6508C6.11125 18.8318 7.92504 20.4569 10.1486 20.8324L10.2942 20.857C11.4235 21.0477 12.5765 21.0477 13.7058 20.857L13.8514 20.8324C16.0749 20.4569 17.8887 18.8319 18.5187 16.6509C18.94 15.1924 19.1538 13.6811 19.1538 12.1622V8.11509H20.3077C20.69 8.11509 21 7.8028 21 7.41757C21 7.03235 20.69 6.72006 20.3077 6.72006H16.7855C16.7241 6.36939 16.6165 6.02664 16.4652 5.69935C16.2147 5.1579 15.8503 4.67161 15.3972 4.26577C14.9441 3.86007 14.4106 3.54196 13.8288 3.32613C13.247 3.11031 12.6258 3 12 3ZM10.6496 4.63524C11.0757 4.47716 11.5348 4.39502 12 4.39502C12.4652 4.39502 12.9243 4.47716 13.3504 4.63524C13.7765 4.79331 14.1588 5.02324 14.4773 5.30842C14.7955 5.59346 15.0431 5.92736 15.2101 6.28858C15.2753 6.42941 15.3278 6.57365 15.3678 6.72006L8.63224 6.72006C8.67215 6.57365 8.72473 6.42941 8.78987 6.28858C8.95694 5.92736 9.20445 5.59346 9.52273 5.30842C9.84116 5.02324 10.2235 4.79331 10.6496 4.63524ZM10.1538 11.3701C10.5362 11.3701 10.8462 11.6824 10.8462 12.0677V15.7877C10.8462 16.1729 10.5362 16.4852 10.1538 16.4852C9.7715 16.4852 9.46154 16.1729 9.46154 15.7877V12.0677C9.46154 11.6824 9.7715 11.3701 10.1538 11.3701ZM13.8462 11.3701C14.2285 11.3701 14.5385 11.6824 14.5385 12.0677V15.7877C14.5385 16.1729 14.2285 16.4852 13.8462 16.4852C13.4638 16.4852 13.1538 16.1729 13.1538 15.7877V12.0677C13.1538 11.6824 13.4638 11.3701 13.8462 11.3701Z"
                  fill="currentColor"
                />
              </svg>

              <span>Clear canvas</span>
            </button>
            <ThemeButton variant="menu" onClick={() => setIsOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
};
