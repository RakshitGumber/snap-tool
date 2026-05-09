// import { Background } from "../controls/Background";
import { Images } from "../controls/Images";
// import { Overview } from "../controls/Overview";
// import { Text } from "../controls/Text";
// import { usePanelStore } from "@/new_stores/usePanelStore";

export const RightPanel = () => {
  // const activePanelId = usePanelStore((state) => state.activePanelId);

  return (
    <aside className="w-96 flex flex-col bg-panel-bg border-l border-border-color select-none">
      {/* {activePanelId === "overview" && <Overview />} */}
      <Images />
      {/* {activePanelId === "background" && <Background />}
      {activePanelId === "text" && <Text />} */}
    </aside>
  );
};
