import { Icon } from "@iconify/react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  ASPECT_RATIO_PRESETS,
  type AspectRatioPreset,
  type EditorTool,
} from "@/libs/editorSchema";

interface CreateToolbarProps {
  aspectRatio: AspectRatioPreset;
  activeTool: EditorTool;
  paintColor: string;
  onAspectRatioChange: (ratio: AspectRatioPreset) => void;
  onActiveToolChange: (tool: EditorTool) => void;
}

const ratioLabels: Record<AspectRatioPreset, string> = {
  "1:1": "Square",
  "9:16": "9:16",
  "16:9": "16:9",
};

export const CreateToolbar = ({
  aspectRatio,
  activeTool,
  paintColor,
  onAspectRatioChange,
  onActiveToolChange,
}: CreateToolbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(
    Math.max(ASPECT_RATIO_PRESETS.indexOf(aspectRatio), 0),
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setFocusIndex(Math.max(ASPECT_RATIO_PRESETS.indexOf(aspectRatio), 0));
  }, [aspectRatio]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    optionRefs.current[focusIndex]?.focus();
  }, [focusIndex, isOpen]);

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusIndex((current) => (current + 1) % ASPECT_RATIO_PRESETS.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusIndex(
        (current) =>
          (current - 1 + ASPECT_RATIO_PRESETS.length) % ASPECT_RATIO_PRESETS.length,
      );
    }
  };

  return (
    <section className="relative z-30 shrink-0 border-b border-border-color bg-bg/95 px-5 py-3 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative" ref={menuRef}>
            <button
              ref={buttonRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              className="font-styled flex items-center gap-2 rounded-xl border border-border-color bg-bg px-4 py-2 text-sm font-semibold tracking-wide text-title-color transition hover:border-accent hover:text-title-color"
              onClick={() => setIsOpen((open) => !open)}
            >
              <Icon icon="solar:crop-broken" className="text-lg" />
              Aspect Ratio
              <span className="rounded-full bg-accent-light px-2 py-1 text-xs text-title-color">
                {ratioLabels[aspectRatio]}
              </span>
              <Icon
                icon={isOpen ? "solar:alt-arrow-up-broken" : "solar:alt-arrow-down-broken"}
                className="text-lg"
              />
            </button>

            {isOpen ? (
              <div
                role="menu"
                className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-52 rounded-2xl border border-border-color bg-bg p-2 shadow-2xl"
                onKeyDown={handleMenuKeyDown}
              >
                {ASPECT_RATIO_PRESETS.map((ratio, index) => {
                  const selected = aspectRatio === ratio;

                  return (
                    <button
                      key={ratio}
                      ref={(node) => {
                        optionRefs.current[index] = node;
                      }}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-title-color transition hover:bg-accent-light focus:bg-accent-light focus:outline-none"
                      onClick={() => {
                        onAspectRatioChange(ratio);
                        setIsOpen(false);
                        buttonRef.current?.focus();
                      }}
                    >
                      <span className="font-medium">{ratioLabels[ratio]}</span>
                      <span className="text-secondary-text">{ratio}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-border-color bg-bg p-1">
            <button
              type="button"
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                activeTool === "select"
                  ? "bg-accent text-bg"
                  : "text-title-color hover:bg-accent-light"
              }`}
              onClick={() => onActiveToolChange("select")}
            >
              Select
            </button>
            <button
              type="button"
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                activeTool === "paintBucket"
                  ? "bg-accent text-bg"
                  : "text-title-color hover:bg-accent-light"
              }`}
              onClick={() => onActiveToolChange("paintBucket")}
            >
              Paint Bucket
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-secondary-text">
          {activeTool === "paintBucket" ? (
            <>
              <span
                className="h-4 w-4 rounded-full border border-border-color"
                style={{ backgroundColor: paintColor }}
              />
              <span>Click the canvas to apply the selected color.</span>
            </>
          ) : (
            <span>Drag stickers or icons from the sidebar onto the canvas.</span>
          )}
        </div>
      </div>
    </section>
  );
};
