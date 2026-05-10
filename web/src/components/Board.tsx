import { TopPanel } from "@/components/panels/TopPanel";
import { CanvasExportProvider } from "@/providers/CanvasExportContext";
import { Canvas } from "./panels/Canvas";
import { LeftPanel } from "./panels/LeftPanel";
import { RightPanel } from "./panels/RightPanel";

export const Board = () => {
  return (
    <CanvasExportProvider>
      <main className="flex h-screen flex-col overflow-hidden">
        <TopPanel />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <LeftPanel />
          <Canvas />
          <RightPanel />
        </div>
      </main>
    </CanvasExportProvider>
  );
};
