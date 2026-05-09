import { useEffect, useMemo, useRef, useState } from "react";
import * as PIXI from "pixi.js";

import { getBackgroundPresetById } from "@/config/backgroundPresets";
import { draggableBox } from "@/libs/draggableBox";

import { useCanvasStore } from "@/new_stores/useCanvasStore";

export const Canvas = () => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const canvasSize = useCanvasStore((state) => state.canvasSize);
  const activeBackgroundId = useCanvasStore(
    (state) => state.activeBackgroundId,
  );
  const activeBackground = getBackgroundPresetById(activeBackgroundId);

  useEffect(() => {
    if (!boardRef.current) return;

    const updateBoardSize = () => {
      if (!boardRef.current) return;

      const bounds = boardRef.current.getBoundingClientRect();

      setBoardSize({
        width: bounds.width,
        height: bounds.height,
      });
    };

    updateBoardSize();

    const resizeObserver = new ResizeObserver(updateBoardSize);
    resizeObserver.observe(boardRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const previewSize = useMemo(() => {
    const availableWidth = Math.max(0, boardSize.width - 48);
    const availableHeight = Math.max(0, boardSize.height - 48);
    const scale = Math.min(
      1,
      availableWidth / canvasSize.width,
      availableHeight / canvasSize.height,
    );

    return {
      width: canvasSize.width * scale,
      height: canvasSize.height * scale,
    };
  }, [boardSize.height, boardSize.width, canvasSize.height, canvasSize.width]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new PIXI.Application();
    let isCancelled = false;
    let isInitialized = false;
    let isDestroyed = false;

    const destroyApp = () => {
      if (isDestroyed) return;

      isDestroyed = true;
      app.destroy(true, true);
    };

    async function init() {
      await app.init({
        width: canvasSize.width,
        height: canvasSize.height,
        backgroundAlpha: 0,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });

      isInitialized = true;

      if (isCancelled) {
        destroyApp();
        return;
      }

      app.canvas.style.display = "block";
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";

      canvasRef.current?.appendChild(app.canvas);

      const { items, updateItemPosition } = useCanvasStore.getState();

      items.forEach((item) => {
        const rect = new PIXI.Graphics();

        rect.rect(-40, -40, 80, 80);
        rect.fill(item.color);

        rect.x = item.x;
        rect.y = item.y;

        draggableBox(rect, {
          onDragMove: (x, y) => {
            updateItemPosition(item.id, x, y);
          },
        });

        app.stage.addChild(rect);
      });
    }

    const initPromise = init();

    return () => {
      isCancelled = true;

      if (isInitialized) {
        destroyApp();
      } else {
        void initPromise.then(destroyApp);
      }
    };
  }, [canvasSize.height, canvasSize.width]);

  return (
    <div
      ref={boardRef}
      className="flex flex-1 items-center justify-center overflow-hidden p-6"
    >
      <div
        ref={canvasRef}
        aria-label={`${activeBackground.label} canvas background`}
        style={{
          width: previewSize.width,
          height: previewSize.height,
          background: activeBackground.background,
        }}
        className="overflow-hidden shadow-lg"
      />
    </div>
  );
};
