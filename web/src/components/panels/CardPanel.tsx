import { Icon } from "@iconify/react";
import { CardPreview } from "../ui/CardPreview";
import type { LinkCardCanvasItem } from "@/new_stores/useCanvasStore";
import clsx from "clsx";

type LinkCardDraft = {
  id: string;
  input: string;
  status: string;
  variants: LinkCardCanvasItem[];
  error: string | null;
};

export const CardPanel = ({
  cardDraft,
  onSelect,
  onClose,
}: {
  cardDraft: LinkCardDraft | null;
  onSelect: (card: LinkCardCanvasItem) => void;
  onClose: () => void;
}) => {
  if (!cardDraft) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6">
      <div className="flex max-h-[82vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border-color bg-panel-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-color px-5 py-4">
          <div className="min-w-0">
            <p className="text-base font-semibold text-title-color">
              Select a card
            </p>
            <p className="truncate text-xs text-secondary-text">
              {cardDraft.input}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-secondary-text hover:bg-text-color/8 hover:text-title-color"
            aria-label="Close card selector"
          >
            <Icon icon="mingcute:close-line" fontSize={22} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cardDraft.variants.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelect(card)}
                className="overflow-hidden rounded-lg border border-border-color bg-bg text-left transition hover:-translate-y-0.5 hover:border-accent"
              >
                <CardPreview card={card} />
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-title-color">
                    {card.label}
                  </p>
                  <p className="mt-1 truncate text-xs text-secondary-text">
                    Card
                  </p>
                </div>
              </button>
            ))}
          </div>

          {cardDraft.status === "generating" ? (
            <div
              className={clsx(
                "mt-4 rounded-lg border border-dashed border-border-color px-4 py-5 text-sm text-secondary-text",
                !cardDraft.variants.length && "mt-0",
              )}
            >
              Generating card templates...
            </div>
          ) : null}

          {cardDraft.status === "error" ? (
            <div className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {cardDraft.error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
