import { FileMenu } from "../ui/FileMenu";
// import { NameInput } from "../ui/NameInput";
import { ExportButton } from "../ui/ExportButton";
import { PresetButton } from "../ui/PresetButton";

export const TopPanel = () => {
  return (
    <header className="relative z-40 flex justify-between items-center border-b bg-top-panel border-border-color px-4 py-2.75">
      <div className="flex gap-6 items-center">
        <FileMenu />
        {/* <NameInput /> */}
      </div>
      <div className="flex items-center gap-4 px-2.25">
        <PresetButton />
        <ExportButton />
      </div>
    </header>
  );
};
