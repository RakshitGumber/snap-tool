import { Icon } from "@iconify/react";
import clsx from "clsx";

import { CompositionPreview } from "@/components/ui/CompositionPreview";
import type { CanvasSize } from "@/config/canvasPresets";
import type {
  CanvasComposition,
  YouTubeCompositionTemplateId,
} from "@/libs/canvasComposition";

export type YouTubeTemplateOption = {
  id: string;
  label: string;
  description: string;
  templateId: YouTubeCompositionTemplateId;
  composition: CanvasComposition;
};

export type YouTubeTemplateDraft = {
  id: string;
  input: string;
  options: YouTubeTemplateOption[];
};

export const YouTubeTemplatePanel = ({
  draft,
  canvasSize,
  activeBackgroundId,
  onSelect,
  onClose,
}: {
  draft: YouTubeTemplateDraft | null;
  canvasSize: CanvasSize;
  activeBackgroundId: string;
  onSelect: (templateId: YouTubeCompositionTemplateId) => void;
  onClose: () => void;
}) => {
  if (!draft) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6">
      <div className="flex max-h-[82vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border-color bg-panel-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-color px-5 py-4">
          <div className="min-w-0">
            <p className="text-base font-semibold text-title-color">
              Select a template
            </p>
            <p className="truncate text-xs text-secondary-text">{draft.input}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-secondary-text hover:bg-text-color/8 hover:text-title-color"
            aria-label="Close template selector"
          >
            <Icon icon="mingcute:close-line" fontSize={22} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {draft.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.templateId)}
                className={clsx(
                  "overflow-hidden rounded-lg border border-border-color bg-bg text-left transition hover:-translate-y-0.5 hover:border-accent",
                )}
              >
                <CompositionPreview
                  composition={option.composition}
                  canvasSize={canvasSize}
                  activeBackgroundId={activeBackgroundId}
                />
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-title-color">
                    {option.label}
                  </p>
                  <p className="mt-1 truncate text-xs text-secondary-text">
                    {option.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

