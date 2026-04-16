import { useMemo } from "react";

import { FramesPanel } from "@/Components/panels/FramesPanel";
import { BoardPanel } from "@/Components/panels/BoardPanel";
import { BoardToolkit } from "@/Components/toolkits/BoardToolkit";
import { BoardCanvas } from "@/canvas";

import { useBoardStore } from "@/stores/useBoardStore";

const DEFAULT_FRAME_SIZE = {
  width: 1080,
  height: 1080,
};

export const Board = () => {
  const { frames, selectedFrameId, addFrame, resizeSelectedFrame } =
    useBoardStore((state) => state);

  const selectedFrameTitle = useMemo(
    () => frames.find((f) => f.id === selectedFrameId)?.title ?? null,
    [frames, selectedFrameId],
  );
  const selectedFrame = useMemo(
    () => frames.find((f) => f.id === selectedFrameId) ?? null,
    [frames, selectedFrameId],
  );

  return (
    <>
      <BoardCanvas />
      <BoardPanel
        frameCount={frames.length}
        selectedFrameTitle={selectedFrameTitle}
      />
      <BoardToolkit
        onAddFrame={() => addFrame(DEFAULT_FRAME_SIZE)}
        resizeControl={
          <FramesPanel
            selectedFrame={selectedFrame}
            onResizeFrame={resizeSelectedFrame}
          />
        }
      />
    </>
  );
};
