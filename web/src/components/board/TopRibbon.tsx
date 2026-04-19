import { FileMenu } from "./FileMenu";
import { PresetControl } from "./PresetControl";

export const TopRibbon = () => {
  return (
    <header className="relative z-40 flex items-center justify-between border-b-2 border-border-color bg-card-bg px-4 py-3 h-18">
      <FileMenu />
      <PresetControl />
    </header>
  );
};
