import { Overview } from "../controls/Overview";

export const RightPanel = () => {
  return (
    <aside className="w-100 flex flex-col bg-panel-bg border-l border-border-color select-none">
      <Overview />
    </aside>
  );
};
