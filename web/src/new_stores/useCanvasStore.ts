import { create } from "zustand";

import { DEFAULT_BACKGROUND_PRESET_ID } from "@/config/backgroundPresets";
import {
  DEFAULT_CANVAS_PRESET_ID,
  getCanvasPresetById,
  type CanvasSize,
} from "@/config/canvasPresets";

type Item = {
  id: number;
  x: number;
  y: number;
  color: number;
  height: number;
  width: number;
};

type ICanvas = {
  items: Item[];
  canvasSize: CanvasSize;
  activeCanvasPresetId: string;
  activeBackgroundId: string;
  setActiveCanvasPreset: (presetId: string) => void;
  setActiveBackground: (backgroundId: string) => void;
  updateItemPosition: (id: number, x: number, y: number) => void;
};

const defaultCanvasPreset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);

export const useCanvasStore = create<ICanvas>((set) => ({
  canvasSize: defaultCanvasPreset.size,
  activeCanvasPresetId: defaultCanvasPreset.id,
  activeBackgroundId: DEFAULT_BACKGROUND_PRESET_ID,

  items: [
    { id: 1, x: 100, y: 100, color: 0xff3366, width: 100, height: 100 },
    { id: 2, x: 300, y: 200, color: 0x33ccff, width: 100, height: 100 },
    { id: 3, x: 500, y: 150, color: 0x66ff66, width: 100, height: 100 },
  ],

  setActiveCanvasPreset: (presetId) => {
    const preset = getCanvasPresetById(presetId);

    set({
      activeCanvasPresetId: preset.id,
      canvasSize: preset.size,
    });
  },

  setActiveBackground: (backgroundId) =>
    set({ activeBackgroundId: backgroundId }),

  updateItemPosition: (id, x, y) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, x, y } : item,
      ),
    })),
}));
