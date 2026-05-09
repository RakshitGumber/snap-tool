import { create } from "zustand";

import { DEFAULT_BACKGROUND_PRESET_ID } from "@/config/backgroundPresets";
import {
  DEFAULT_CANVAS_PRESET_ID,
  getCanvasPresetById,
  type CanvasSize,
} from "@/config/canvasPresets";
import type { LinkCardMetadata } from "@/libs/linkCards";

export type LinkCardCanvasItem = {
  id: string;
  presetId: string;
  label: string;
  metadata: LinkCardMetadata;
  widthRatio: number;
};

type ICanvas = {
  canvasSize: CanvasSize;
  activeCanvasPresetId: string;
  activeBackgroundId: string;
  activeCard: LinkCardCanvasItem | null;
  setActiveCanvasPreset: (presetId: string) => void;
  setActiveBackground: (backgroundId: string) => void;
  setActiveCard: (card: LinkCardCanvasItem | null) => void;
  resizeActiveCard: (widthRatio: number) => void;
};

const defaultCanvasPreset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);

export const useCanvasStore = create<ICanvas>((set) => ({
  canvasSize: defaultCanvasPreset.size,
  activeCanvasPresetId: defaultCanvasPreset.id,
  activeBackgroundId: DEFAULT_BACKGROUND_PRESET_ID,
  activeCard: null,

  setActiveCanvasPreset: (presetId) => {
    const preset = getCanvasPresetById(presetId);

    set({
      activeCanvasPresetId: preset.id,
      canvasSize: preset.size,
    });
  },

  setActiveBackground: (backgroundId) =>
    set({ activeBackgroundId: backgroundId }),

  setActiveCard: (activeCard) => set({ activeCard }),

  resizeActiveCard: (widthRatio) =>
    set((state) => {
      if (!state.activeCard) return state;

      return {
        activeCard: {
          ...state.activeCard,
          widthRatio: Math.min(0.92, Math.max(0.12, widthRatio)),
        },
      };
    }),
}));
