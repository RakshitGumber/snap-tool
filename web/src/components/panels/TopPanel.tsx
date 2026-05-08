import { FileMenu } from "../ui/FileMenu";
import { NameInput } from "../ui/NameInput";
// import { PresetControl } from "./PresetControl";
// import { SaveControl } from "./SaveControl";

export const TopPanel = () => {
  return (
    <header className="relative z-40 flex justify-between items-center border-b bg-top-panel border-border-color px-4 py-2.75">
      <div className="flex gap-6 items-center">
        <FileMenu />
        <NameInput />
      </div>
      <div className="flex items-center gap-4">
        {/* <PresetControl />
        <SaveControl /> */}
      </div>
    </header>
  );
};
