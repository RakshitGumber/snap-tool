import { BoardSidebar } from "@/components/board/Sidebar";
import { TopRibbon } from "@/components/board/TopRibbon";
import { Canvas } from "@/canvas/Canvas";

export const Board = () => {
  return (
    <main className="flex h-screen flex-col">
      <TopRibbon />
      <div className="flex min-h-0 flex-1">
        <BoardSidebar />
        <section className="relative min-w-0 flex-1">
          <Canvas />
        </section>
      </div>
    </main>
  );
};
