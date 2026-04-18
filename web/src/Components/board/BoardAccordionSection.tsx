import { Icon } from "@iconify/react";
import clsx from "clsx";

import type { BoardSidebarSection } from "./types";

type BoardAccordionSectionProps = {
  section: BoardSidebarSection;
  isOpen: boolean;
  onToggle: () => void;
};

export const BoardAccordionSection = ({
  section,
  isOpen,
  onToggle,
}: BoardAccordionSectionProps) => {
  return (
    <section className="rounded-xl outline outline-1 outline-border-color/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left"
      >
        <span>
          <span className="block text-sm font-semibold text-title-color">
            {section.label}
          </span>
          <span className="block text-xs text-secondary-text">
            {section.description}
          </span>
        </span>
        <Icon
          icon="solar:alt-arrow-down-linear"
          className={clsx(
            "text-lg text-title-color transition",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen ? (
        <div className="px-4 pb-4">
          {section.isPlaceholder ? (
            <div className="rounded-lg px-3 py-4 text-sm text-secondary-text outline outline-1 outline-border-color/60">
              Coming soon
            </div>
          ) : (
            section.content
          )}
        </div>
      ) : null}
    </section>
  );
};
