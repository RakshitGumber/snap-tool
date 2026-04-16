import type { ReactNode } from "react";

import { ThemeButton } from "@/Components/ui/ThemeButton";

type BoardToolkitProps = {
  onAddFrame: () => void;
  resizeControl?: ReactNode;
};

export const BoardToolkit = ({
  onAddFrame,
  resizeControl,
}: BoardToolkitProps) => {
  return (
    <div className="pointer-events-none absolute right-4 top-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border-color/80 bg-card-bg/85 p-2 shadow-xl backdrop-blur-xl">
        <ThemeButton />
        <button
          type="button"
          onClick={onAddFrame}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-bg transition hover:opacity-90"
        >
          + Add frame
        </button>
        {resizeControl}
      </div>
    </div>
  );
};
