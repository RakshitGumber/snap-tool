import { useMemo } from "react";

import { BoardPanel } from "@/Components/panels/BoardPanel";
import { BoardToolkit } from "@/Components/toolkits/BoardToolkit";
import { BoardCanvas } from "@/canvas";

import { useBoardStore } from "@/stores/useBoardStore";

export const Board = () => {
  const { frames, selectedFrameId, addFrame } = useBoardStore((state) => state);

  const selectedFrameTitle = useMemo(
    () => frames.find((f) => f.id === selectedFrameId)?.title ?? "Frame",
    [frames, selectedFrameId],
  );

  return (
    <section className="h-full w-full">
      <BoardCanvas />
      <BoardPanel
        frameCount={frames.length}
        selectedFrameTitle={selectedFrameTitle}
      />
      <BoardToolkit onAddFrame={addFrame} />
    </section>
  );
};
