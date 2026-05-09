import { TopPanel } from "@/components/panels/TopPanel";
import { Canvas } from "@/canvas/Canvas";
import { LeftPanel } from "./panels/LeftPanel";
import { RightPanel } from "./panels/RightPanel";

export const Board = () => {
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
