import { create } from "zustand";

export type BoardFrame = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
};

export type FrameDimensions = {
  width: number;
  height: number;
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
  addFrame: (size: FrameDimensions) => void;
  resizeSelectedFrame: (size: FrameDimensions) => void;
  updateFramePosition: (frameId: string, x: number, y: number) => void;
  removeSelectedFrame: () => void;
};

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

  addFrame: ({ width, height }) => {
    const { boardSize, viewport, frames } = get();
    if (!boardSize.width) return;
    if (width <= 0 || height <= 0) return;

    const x = (boardSize.width / 2 - viewport.x) / viewport.scale - width / 2;
    const y = (boardSize.height / 2 - viewport.y) / viewport.scale - height / 2;
    const cascade = (frames.length % 6) * 28;

    const newFrame: BoardFrame = {
      id: crypto.randomUUID(),
      x: x + cascade,
      y: y + cascade,
      width,
      height,
      title: `Frame ${frames.length + 1}`,
    };

    set({ frames: [...frames, newFrame], selectedFrameId: newFrame.id });
  },

  resizeSelectedFrame: ({ width, height }) =>
    set((state) => {
      if (!state.selectedFrameId) return state;
      if (width <= 0 || height <= 0) return state;

      return {
        frames: state.frames.map((frame) =>
          frame.id === state.selectedFrameId
            ? { ...frame, width, height }
            : frame,
        ),
      };
    }),

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
