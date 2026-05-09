import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

import { draggableBox } from "@/libs/draggableBox";

import { useCanvasStore } from "@/new_stores/useCanvasStore";

export const Canvas = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new PIXI.Application();

    async function init() {
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        background: "#1e1e1e",
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
        style={{ width: 600, height: 600 }}
        className="bg-white"
      ></div>
    </div>
  );
};
