import { FileMenu } from "./FileMenu";
import { HistoryControls } from "./HistoryControls";
import { PresetControl } from "./PresetControl";
import { SaveControl } from "./SaveControl";

export const TopRibbon = () => {
  return (
    <header className="relative z-40 flex items-center justify-between border-b-2 border-border-color bg-card-bg px-4 py-3 h-18">
      <div className="flex items-center gap-2">
        <FileMenu />
        <HistoryControls />
      </div>
      <div className="flex items-center gap-4">
        <PresetControl />
        <SaveControl />
      </div>
    </header>
  );
};
