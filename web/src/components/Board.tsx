import { BoardSidebar } from "@/components/board/Sidebar";
import { TopPanel } from "@/components/panels/TopPanel";
import { Canvas } from "@/canvas/Canvas";

export const Board = () => {
  return (
    <main className="flex h-screen flex-col">
      <TopPanel />
      <div className="flex flex-1">
        <BoardSidebar />
        <Canvas />
      </div>
    </main>
  );
};
