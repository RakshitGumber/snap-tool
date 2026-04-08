import { Canvas } from "@/Components/main/Canvas";
import { Sidebar } from "@/Components/main/Sidebar";

export const CreateRoute = () => {
  return (
    <div className="flex h-full w-full justify-between">
      <Sidebar />
      <Canvas />
    </div>
  );
};
