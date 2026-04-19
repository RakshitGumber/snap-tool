import { useRef, useState } from "react";

import {
  exportCanvasImage,
  type CanvasExportFormat,
} from "@/canvas/exportCanvasImage";
import { useDismissibleLayer } from "@/libs/useDismissibleLayer";

const SAVE_OPTIONS: Array<{
  format: CanvasExportFormat;
  label: string;
  detail: string;
}> = [
  {
    format: "png",
    label: "Save as PNG",
    detail: "Lossless image",
  },
  {
    format: "jpg",
    label: "Save as JPG",
    detail: "Smaller file size",
  },
];

export const SaveControl = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useDismissibleLayer({
    containerRef,
    isOpen,
    onDismiss: () => setIsOpen(false),
  });

  const handleSave = async (format: CanvasExportFormat) => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await exportCanvasImage(format);
      setIsOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save the board.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title="Save canvas"
        aria-expanded={isOpen}
        onClick={() => {
          if (isSaving) {
            return;
          }

          setErrorMessage(null);
          setIsOpen(!isOpen);
        }}
        className="inline-flex h-10 items-center gap-2 rounded-lg px-3 py-2 text-bg transition bg-accent"
        disabled={isSaving}
      >
        <span className="font-bold font-sans">
          {isSaving ? "Saving..." : "Save"}
        </span>
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
            d="M6.46967 8.96967C6.76256 8.67678 7.23744 8.67678 7.53033 8.96967L12 13.4393L16.4697 8.96967C16.7626 8.67678 17.2374 8.67678 17.5303 8.96967C17.8232 9.26256 17.8232 9.73744 17.5303 10.0303L12.5303 15.0303C12.3897 15.171 12.1989 15.25 12 15.25C11.8011 15.25 11.6103 15.171 11.4697 15.0303L6.46967 10.0303C6.17678 9.73744 6.17678 9.26256 6.46967 8.96967Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-36 rounded-lg border-2 border-border-color bg-card-bg p-2">
          <div className="space-y-1 flex flex-col items-end">
            {SAVE_OPTIONS.map((option) => (
              <button
                key={option.format}
                type="button"
                onClick={() => {
                  void handleSave(option.format);
                }}
                disabled={isSaving}
                className="flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2 text-left text-title-color transition hover:bg-surface-3/90 disabled:cursor-wait disabled:opacity-70"
              >
                <span className="font-sans text-sm font-semibold">
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          {errorMessage ? (
            <p className="mt-2 rounded-xl bg-[#FFE8E5] px-3 py-2 text-xs text-[#8A2F23]">
              {errorMessage}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
