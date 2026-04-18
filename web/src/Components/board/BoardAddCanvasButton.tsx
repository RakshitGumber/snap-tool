import { Icon } from "@iconify/react";

type BoardAddCanvasButtonProps = {
  onClick: () => void;
};

export const BoardAddCanvasButton = ({
  onClick,
}: BoardAddCanvasButtonProps) => {
  return (
    <button
      type="button"
      title="Canvas"
      aria-label="Add canvas"
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-title-color transition hover:bg-secondary-text/20"
    >
      <Icon icon="solar:add-square-linear" className="text-xl" />
    </button>
  );
};
