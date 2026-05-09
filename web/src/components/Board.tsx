// Review note: Main board composition that places the canvas beside the left and right control panels.
// The comments in this file are intentionally dense to support the requested review pass.

import { TopPanel } from "@/components/panels/TopPanel";
import { Canvas } from "./panels/Canvas";
import { LeftPanel } from "./panels/LeftPanel";
import { RightPanel } from "./panels/RightPanel";

/**
 * Composes the board page out of the left panel, central canvas, and right panel.
 */
export const Board = () => {
  // Render the final UI for this branch using the state derived above.
  return (
    <main className="flex h-screen flex-col">
      <TopPanel />
      <div className="flex flex-1">
        <LeftPanel />
        <Canvas />
        <RightPanel />
      </div>
    </main>
  );
};
