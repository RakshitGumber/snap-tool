import { BoardFileMenu } from "./BoardFileMenu";
import { BoardPresetControl } from "./BoardPresetControl";

export const TopRibbon = () => {
  return (
    <header className="relative z-40 flex items-center gap-4 border-b-2 border-accent bg-card-bg/95 px-4 py-3 backdrop-blur-3xl">
      <div className="flex min-w-0 items-center gap-1">
        <BoardFileMenu />
        <BoardPresetControl />
      </div>
    </header>
  );
};
