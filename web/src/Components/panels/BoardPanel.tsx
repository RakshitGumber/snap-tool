type BoardPanelProps = {
  frameCount: number;
  selectedFrameTitle: string | null;
};

export const BoardPanel = ({
  frameCount,
  selectedFrameTitle,
}: BoardPanelProps) => {
  return (
    <>
      <div className="pointer-events-none absolute left-4 top-4">
        <div className="pointer-events-auto rounded-2xl border border-border-color/80 bg-card-bg/85 px-4 py-3 shadow-xl backdrop-blur-xl">
          <p className="text-sm font-semibold text-title-color">
            {frameCount} {frameCount === 1 ? "frame" : "frames"}
          </p>
          <p className="text-sm text-text-color">
            Drag frames, drag the board to pan, scroll to zoom.
          </p>
        </div>
      </div>

      {selectedFrameTitle ? (
        <div className="pointer-events-none absolute bottom-4 left-4">
          <div className="pointer-events-auto rounded-2xl border border-border-color/80 bg-card-bg/85 px-4 py-3 shadow-xl backdrop-blur-xl">
            <p className="text-sm font-semibold text-title-color">
              Selected: {selectedFrameTitle}
            </p>
            <p className="text-sm text-text-color">
              Press Delete to remove it.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
};
