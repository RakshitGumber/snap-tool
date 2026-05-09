import { create } from "zustand";

export type PanelSectionId = "overview" | "images" | "background" | "text";

type PanelState = {
  activePanelId: PanelSectionId;
  setActivePanelId: (panelId: PanelSectionId) => void;
};

export const usePanelStore = create<PanelState>((set) => ({
  activePanelId: "overview",
  setActivePanelId: (activePanelId) => set({ activePanelId }),
}));
