import { BoardSidebar } from "@/components/board/BoardSidebar";
import { TopRibbon } from "@/components/board/TopRibbon";
import { BoardCanvas } from "@/canvas";

export const Board = () => {
  return (
    <main className="flex h-screen flex-col">
      <TopRibbon />
      <div className="flex min-h-0 flex-1">
        <BoardSidebar />
        <section className="relative min-w-0 flex-1">
          <BoardCanvas />
        </section>
      </div>
    </main>
  );
};
