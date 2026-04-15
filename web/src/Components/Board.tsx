import { useMemo } from "react";

import { BoardPanel } from "@/Components/panels/BoardPanel";
import { BoardToolkit } from "@/Components/toolkits/BoardToolkit";
import { BoardCanvas } from "@/canvas";

import { useTheme } from "@/providers/ThemeProvider";
import { useBoardStore } from "@/stores/useBoardStore";

export const Board = () => {
  const { theme } = useTheme();

  const { frames, selectedFrameId, addFrame } = useBoardStore((state) => state);

  const isDark = theme === "system" ? true : theme === "dark" ? true : false;

  const selectedFrameTitle = useMemo(
    () => frames.find((f) => f.id === selectedFrameId)?.title ?? "Frame",
    [frames, selectedFrameId],
  );

  return (
    <section className="h-full w-full">
      <BoardCanvas isDark={isDark} />
      <BoardPanel
        frameCount={frames.length}
        selectedFrameTitle={selectedFrameTitle}
      />
      <BoardToolkit onAddFrame={addFrame} />
    </section>
  );
};
