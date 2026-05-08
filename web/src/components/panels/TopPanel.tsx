// import { CanvasTitleField } from "./CanvasTitleField";
import { FileMenu } from "../ui/FileMenu";
// import { HistoryControls } from "./HistoryControls";
// import { PresetControl } from "./PresetControl";
// import { SaveControl } from "./SaveControl";

export const TopPanel = () => {
  return (
    <header className="relative z-40 flex justify-between items-center border-b bg-top-panel border-border-color px-4 py-2.75">
      <div className="flex min-w-0 items-center gap-2">
        <FileMenu />
        {/* <CanvasTitleField />
        <HistoryControls /> */}
      </div>
      <div className="flex items-center gap-4">
        {/* <PresetControl />
        <SaveControl /> */}
      </div>
    </header>
  );
};
