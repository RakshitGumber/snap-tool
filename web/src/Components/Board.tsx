import { BoardSidebar, TopRibbon } from "@/Components/board/index";
import { BoardCanvas } from "@/canvas";

export const Board = () => {
  return (
    <main className="flex h-screen flex-col">
      <TopRibbon />
      <div className="flex min-h-0 flex-1">
        <BoardSidebar />
        <section className="relative min-w-0 flex-1 bg-bg">
          <BoardCanvas />
        </section>
      </div>
    </main>
  );
};
