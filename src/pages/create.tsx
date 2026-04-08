import { Canvas } from "@/Components/main/Canvas";
import { EffectsMenu } from "@/Components/main/EffectsMenu";

export const CreateRoute = () => {
  return (
    <div className="flex h-full w-full justify-between">
      <EffectsMenu />
      <Canvas />
    </div>
  );
};
