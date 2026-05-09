import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

import { useCanvasStore } from "@/new_stores/useCanvasStore";

export const Canvas = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new PIXI.Application();

    async function setup() {
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        background: "#1e1e1e",
        antialias: true,
      });

      canvasRef.current?.appendChild(app.canvas);

      const renderItems = () => {
        app.stage.removeChildren();

        const { items, updateItemPosition } = useCanvasStore.getState();

        items.forEach((item) => {
          const box = new PIXI.Graphics();

          box.rect(-40, -40, 80, 80);
          box.fill(item.color);

          box.x = item.x;
          box.y = item.y;

          box.eventMode = "static";
          box.cursor = "pointer";

          let dragging = false;
          let offsetX = 0;
          let offsetY = 0;

          box.on("pointerdown", (e: PIXI.FederatedPointerEvent) => {
            dragging = true;

            const pos = e.getLocalPosition(box.parent);

            offsetX = pos.x - box.x;
            offsetY = pos.y - box.y;
          });

          box.on("pointerup", () => {
            dragging = false;
          });

          box.on("pointerupoutside", () => {
            dragging = false;
          });

          box.on("pointermove", (e: PIXI.FederatedPointerEvent) => {
            if (!dragging) return;

            const pos = e.getLocalPosition(box.parent);

            const newX = pos.x - offsetX;
            const newY = pos.y - offsetY;

            box.x = newX;
            box.y = newY;

            updateItemPosition(item.id, newX, newY);
          });

          app.stage.addChild(box);
        });
      };

      renderItems();

      const unsubscribe = useCanvasStore.subscribe(() => {
        renderItems();
      });

      return () => {
        unsubscribe();
      };
    }

    setup();

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
