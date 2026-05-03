import { useRef, useState } from "react";

import {
  exportCanvasImage,
  type CanvasExportFormat,
} from "@/canvas/exportCanvasImage";
import { useDismissibleLayer } from "@/libs/useDismissibleLayer";
import { Icon } from "@iconify/react";

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
        className="flex h-10 items-center gap-2 rounded-lg px-3 py-2 text-bg transition bg-accent cursor-pointer"
        disabled={isSaving}
      >
        <Icon icon="solar:diskette-broken" className="text-xl" />
        <span className="font-bold font-sans">
          {isSaving ? "Saving..." : "Save"}
        </span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-lg border-2 border-border-color bg-card-bg p-2">
          <div className="space-y-1 flex flex-col items-end">
            {SAVE_OPTIONS.map((option) => (
              <button
                key={option.format}
                type="button"
                onClick={() => {
                  void handleSave(option.format);
                }}
                disabled={isSaving}
                className="flex w-full items-center justify-start gap-4 rounded-lg px-3 py-2 text-left text-title-color transition disabled:cursor-wait disabled:opacity-70 cursor-pointer hover:bg-secondary-text/20"
              >
                <Icon icon="solar:album-outline" />
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
