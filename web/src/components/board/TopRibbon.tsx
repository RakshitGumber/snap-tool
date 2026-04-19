import { FileMenu } from "./FileMenu";
import { PresetControl } from "./PresetControl";

export const TopRibbon = () => {
  return (
    <header className="relative z-40 flex items-center gap-4 border-b-2 border-accent bg-card-bg/95 px-4 py-3 backdrop-blur-3xl">
      <div className="flex min-w-0 items-center gap-1">
        <FileMenu />
        <PresetControl />
      </div>
    </header>
  );
};
