import { create } from "zustand";

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
  updateItemPosition: (id: number, x: number, y: number) => void;
};

export const useCanvasStore = create<ICanvas>((set) => ({
  items: [
    { id: 1, x: 100, y: 100, color: 0xff3366, width: 100, height: 100 },
    { id: 2, x: 300, y: 200, color: 0x33ccff, width: 100, height: 100 },
    { id: 3, x: 500, y: 150, color: 0x66ff66, width: 100, height: 100 },
  ],

  updateItemPosition: (id, x, y) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, x, y } : item,
      ),
    })),
}));
