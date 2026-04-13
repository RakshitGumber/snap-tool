import { Icon } from "@iconify/react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { motion } from "framer-motion";
import {
  ASPECT_RATIO_DIMENSIONS,
  ASPECT_RATIO_PRESETS,
  type AspectRatioPreset,
  type EditorTool,
} from "@/libs/editorSchema";
import { useRouter } from "@/pages/Router";
import { ThemeButton } from "../ui/ThemeButton";

interface CreateToolbarProps {
  aspectRatio: AspectRatioPreset;
  activeTool: EditorTool;
  isPreviewMode: boolean;
  isSidebarCollapsed: boolean;
  sessionLabel: string;
  onAspectRatioChange: (ratio: AspectRatioPreset) => void;
  onAddCanvas: () => void;
  onActiveToolChange: (tool: EditorTool) => void;
  onCleanCanvas: () => void;
  onPreviewToggle: () => void;
  onShare: () => void;
  onToggleSidebar: () => void;
}

const ratioLabels: Record<AspectRatioPreset, string> = {
  "1:1": "Square",
  "9:16": "Story",
  "16:9": "Wide",
};

export const CreateToolbar = ({
  aspectRatio,
  activeTool,
  isPreviewMode,
  isSidebarCollapsed,
  sessionLabel,
  onAspectRatioChange,
  onAddCanvas,
  onActiveToolChange,
  onCleanCanvas,
  onPreviewToggle,
  onShare,
  onToggleSidebar,
}: CreateToolbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(
    Math.max(ASPECT_RATIO_PRESETS.indexOf(aspectRatio), 0),
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const { setRoute } = useRouter();

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
          (current - 1 + ASPECT_RATIO_PRESETS.length) %
          ASPECT_RATIO_PRESETS.length,
      );
    }
  };

  return (
    <motion.section
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="h-16 border-b-2 border-accent/80 bg-card-bg px-4 py-3 backdrop-blur-2xl"
    >
      <div className="mx-auto flex max-w-400 flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRoute("/")}
            className="flex items-center gap-2 rounded-full border border-border-color/80 bg-bg/85 px-3 py-2 text-left uppercase tracking-[0.3em] text-secondary-text transition hover:border-title-color/40 hover:text-title-color"
          >
            <Icon icon="solar:home-2-broken" className="text-lg" />
          </button>
          <div className="leading-none">
            <p className="font-comic text-[19px] font-bold tracking-[0.08em] text-title-color">
              Snap Tool
            </p>
            <p className="text-[10px] uppercase tracking-[0.34em] text-secondary-text">
              Create studio
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-center">
          <div className="relative" ref={menuRef}>
            <button
              ref={buttonRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              className="flex items-center gap-2 rounded-full border border-border-color/80 bg-bg px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-title-color transition hover:border-title-color/40"
              onClick={() => setIsOpen((open) => !open)}
            >
              <Icon
                icon="solar:crop-minimalistic-broken"
                className="text-base"
              />
              Canvas
              <span className="rounded-full bg-accent-light px-2 py-1 text-[10px] text-title-color">
                {ratioLabels[aspectRatio]}
              </span>
            </button>

            {isOpen ? (
              <div
                role="menu"
                className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-56 rounded-[24px] border border-border-color bg-bg p-2 shadow-[0_24px_64px_rgba(15,23,42,0.14)]"
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
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition focus:outline-none ${
                        selected
                          ? "bg-title-color text-bg"
                          : "text-title-color hover:bg-accent-light/40 focus:bg-accent-light/40"
                      }`}
                      onClick={() => {
                        onAspectRatioChange(ratio);
                        setIsOpen(false);
                        buttonRef.current?.focus();
                      }}
                    >
                      <span className="font-medium">{ratioLabels[ratio]}</span>
                      <span
                        className={
                          selected ? "text-bg/70" : "text-secondary-text"
                        }
                      >
                        {ASPECT_RATIO_DIMENSIONS[ratio].width} x{" "}
                        {ASPECT_RATIO_DIMENSIONS[ratio].height}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-1 rounded-full border border-border-color/80 bg-bg/85 p-1">
            <button
              type="button"
              className={`rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.22em] transition ${
                activeTool === "select"
                  ? "bg-title-color text-bg"
                  : "text-title-color hover:bg-accent-light/50"
              }`}
              onClick={() => onActiveToolChange("select")}
            >
              Select
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.22em] transition ${
                activeTool === "paintBucket"
                  ? "bg-title-color text-bg"
                  : "text-title-color hover:bg-accent-light/50"
              }`}
              onClick={() => onActiveToolChange("paintBucket")}
            >
              Paint
            </button>
          </div>

          <button
            type="button"
            className="rounded-full border border-border-color/80 bg-bg/85 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-title-color transition hover:border-title-color/40"
            onClick={onAddCanvas}
          >
            Add canvas
          </button>

          <button
            type="button"
            className="rounded-full border border-border-color/80 bg-bg/85 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-title-color transition hover:border-title-color/40"
            onClick={onToggleSidebar}
          >
            {isSidebarCollapsed ? "Open panel" : "Hide panel"}
          </button>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="hidden rounded-full border border-border-color/80 bg-bg/85 px-3 py-2 text-[10px] uppercase tracking-[0.26em] text-secondary-text lg:inline-flex">
            {sessionLabel}
          </span>

          <button
            type="button"
            className={`rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.22em] transition ${
              isPreviewMode
                ? "bg-title-color text-bg shadow-[0_16px_30px_rgba(15,23,42,0.18)]"
                : "border border-title-color/40 bg-bg text-title-color hover:bg-accent-light/50"
            }`}
            onClick={onPreviewToggle}
          >
            {isPreviewMode ? "Exit preview" : "Preview"}
          </button>

          <button
            type="button"
            className="rounded-full border border-amber-500/30 bg-amber-50 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-amber-700 transition hover:bg-amber-100"
            onClick={onCleanCanvas}
          >
            Clean
          </button>

          <button
            type="button"
            className="rounded-full border border-title-color bg-title-color px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-bg shadow-[0_16px_30px_rgba(15,23,42,0.18)] transition hover:brightness-105"
            onClick={onShare}
          >
            Share
          </button>

          <ThemeButton />
        </div>
      </div>
    </motion.section>
  );
};
