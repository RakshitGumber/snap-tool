import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

import { getBackgroundPresetById } from "@/config/backgroundPresets";
import { draggableBox } from "@/libs/draggableBox";

import { useCanvasStore } from "@/new_stores/useCanvasStore";

const CANVAS_SIZE = 600;

export const Canvas = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const activeBackgroundId = useCanvasStore((state) => state.activeBackgroundId);
  const activeBackground = getBackgroundPresetById(activeBackgroundId);

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new PIXI.Application();

    async function init() {
      await app.init({
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        backgroundAlpha: 0,
      });

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

    init();

    return () => {
      app.destroy(true, true);
    };
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div
        ref={canvasRef}
        aria-label={`${activeBackground.label} canvas background`}
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          background: activeBackground.background,
        }}
        className="overflow-hidden shadow-lg"
      />
    </div>
  );
};
