import { create } from "zustand";

import { FIT_PADDING, MAX_ZOOM, MIN_ZOOM } from "@/board/config";
import type { BoardSize, BoardViewport, CanvasFrame } from "@/types/canvas";

type BoardViewportState = {
  boardSize: BoardSize;
  viewport: BoardViewport;
  canPanBoard: boolean;
};

type BoardViewportActions = {
  setBoardSize: (boardSize: BoardSize) => void;
  setViewport: (viewport: BoardViewport) => void;
  setCanPanBoard: (canPanBoard: boolean) => void;
  panBy: (deltaX: number, deltaY: number) => void;
  zoomAt: (pointerX: number, pointerY: number, deltaY: number) => void;
  fitCanvas: (canvas: CanvasFrame, padding?: number) => void;
};

export const useBoardViewportStore = create<
  BoardViewportState & BoardViewportActions
>((set, get) => ({
  boardSize: {
    width: 0,
    height: 0,
  },
  viewport: {
    x: 0,
    y: 0,
    scale: 1,
  },
  canPanBoard: false,

  setBoardSize: (boardSize) => set({ boardSize }),

  setViewport: (viewport) => set({ viewport }),

  setCanPanBoard: (canPanBoard) => set({ canPanBoard }),

  panBy: (deltaX, deltaY) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        x: state.viewport.x + deltaX,
        y: state.viewport.y + deltaY,
      },
    })),

  zoomAt: (pointerX, pointerY, deltaY) =>
    set((state) => {
      const worldX = (pointerX - state.viewport.x) / state.viewport.scale;
      const worldY = (pointerY - state.viewport.y) / state.viewport.scale;
      const zoomFactor = Math.exp(-deltaY * 0.0015);
      const scale = Math.min(
        Math.max(state.viewport.scale * zoomFactor, MIN_ZOOM),
        MAX_ZOOM,
      );

      return {
        viewport: {
          scale,
          x: pointerX - worldX * scale,
          y: pointerY - worldY * scale,
        },
      };
    }),

  fitCanvas: (canvas, padding = FIT_PADDING) => {
    const { boardSize } = get();
    if (!boardSize.width || !boardSize.height) return;

    const availableWidth = Math.max(boardSize.width - padding * 2, 1);
    const availableHeight = Math.max(boardSize.height - padding * 2, 1);
    const scale = Math.min(
      Math.max(
        Math.min(availableWidth / canvas.width, availableHeight / canvas.height),
        MIN_ZOOM,
      ),
      MAX_ZOOM,
    );
    const centerX = canvas.x + canvas.width / 2;
    const centerY = canvas.y + canvas.height / 2;

    set({
      viewport: {
        scale,
        x: boardSize.width / 2 - centerX * scale,
        y: boardSize.height / 2 - centerY * scale,
      },
    });
  },
}));
