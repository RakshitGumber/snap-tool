import { Overview } from "../controls/Overview";

export const RightPanel = () => {
  return (
    <aside className="w-87.5 flex flex-col bg-panel-bg border-l border-border-color">
      <Overview />
    </aside>
  );
};
