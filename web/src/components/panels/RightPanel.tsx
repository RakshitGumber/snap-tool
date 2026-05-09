// import { Overview } from "../controls/Overview"
import { Background } from "../controls/Background";

export const RightPanel = () => {
  return (
    <aside className="w-96 flex flex-col bg-panel-bg border-l border-border-color select-none">
      {/* <Overview /> */}
      <Background />
    </aside>
  );
};
