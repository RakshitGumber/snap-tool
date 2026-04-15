import { create } from "zustand";

export type BoardFrame = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
};

export type ViewportState = {
  x: number;
  y: number;
  scale: number;
};

export type BoardSize = {
  width: number;
  height: number;
};

type BoardState = {
  frames: BoardFrame[];
  selectedFrameId: string | null;
  viewport: ViewportState;
  boardSize: BoardSize;
};

type BoardActions = {
  setBoardSize: (size: BoardSize) => void;
  setViewport: (viewport: ViewportState) => void;
  selectFrame: (frameId: string | null) => void;
  addFrame: () => void;
  updateFramePosition: (frameId: string, x: number, y: number) => void;
  removeSelectedFrame: () => void;
};

// May not be required in the future

const FRAME_WIDTH = 320;
const FRAME_HEIGHT = 220;

export const useBoardStore = create<BoardState & BoardActions>((set, get) => ({
  frames: [],
  selectedFrameId: null,
  viewport: {
    x: 0,
    y: 0,
    scale: 1,
  },
  boardSize: {
    width: 0,
    height: 0,
  },

  setBoardSize: (size) =>
    set((state) => {
      // Auto-center viewport on first load
      if (state.boardSize.width === 0 && size.width > 0) {
        return {
          boardSize: size,
          viewport: { x: size.width / 2, y: size.height / 2, scale: 1 },
        };
      }
      return { boardSize: size };
    }),

  setViewport: (viewport) => {
    set({ viewport });
  },

  selectFrame: (frameId) => {
    set({ selectedFrameId: frameId });
  },

  addFrame: () => {
    const { boardSize, viewport, frames } = get();
    if (!boardSize.width) return;

    const x =
      (boardSize.width / 2 - viewport.x) / viewport.scale - FRAME_WIDTH / 2;
    const y =
      (boardSize.height / 2 - viewport.y) / viewport.scale - FRAME_HEIGHT / 2;
    const cascade = (frames.length % 6) * 28;

    const newFrame: BoardFrame = {
      id: crypto.randomUUID(),
      x: x + cascade,
      y: y + cascade,
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      title: `Frame ${frames.length + 1}`,
    };

    set({ frames: [...frames, newFrame], selectedFrameId: newFrame.id });
  },

  updateFramePosition: (id, x, y) =>
    set((state) => ({
      frames: state.frames.map((f) => (f.id === id ? { ...f, x, y } : f)),
    })),

  removeSelectedFrame: () =>
    set((state) => ({
      frames: state.frames.filter((f) => f.id !== state.selectedFrameId),
      selectedFrameId: null,
    })),
}));
