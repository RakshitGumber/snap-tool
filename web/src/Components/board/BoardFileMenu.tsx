import { useRef } from "react";

import { Icon } from "@iconify/react";
import clsx from "clsx";

import { ThemeButton } from "@/Components/ui/ThemeButton";
import { useDismissibleLayer } from "@/libs/useDismissibleLayer";

import type { BoardMenuAction } from "./types";

type BoardFileMenuProps = {
  actions: BoardMenuAction[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export const BoardFileMenu = ({
  actions,
  isOpen,
  onOpenChange,
}: BoardFileMenuProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useDismissibleLayer({
    containerRef,
    isOpen,
    onDismiss: () => onOpenChange(false),
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition hover:bg-secondary-text/20"
      >
        <Icon
          icon="solar:hamburger-menu-linear"
          className="text-2xl text-title-color"
        />
        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary-text">
          File
        </span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-48 rounded-xl bg-card-bg p-2 outline outline-border-color/60">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                onOpenChange(false);
                action.onSelect();
              }}
              className={clsx(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition hover:bg-accent-light",
                action.tone === "danger" ? "text-rose-500" : "text-title-color",
              )}
            >
              <Icon icon={action.icon} className="text-lg" />
              <span>{action.label}</span>
            </button>
          ))}
          <div className="mt-1 border-t border-border-color/50 pt-2">
            <ThemeButton variant="menu" onClick={() => onOpenChange(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
};
