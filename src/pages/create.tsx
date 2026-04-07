import { Canvas } from "@/Components/main/Canvas";
import { Sidebar } from "@/Components/main/Sidebar";

export const CreateRoute = () => {
  return (
    <div className="flex h-full w-full justify-between px-4 py-4 sm:px-6 sm:py-6">
      <Sidebar />
      <Canvas />
    </div>
  );
};
