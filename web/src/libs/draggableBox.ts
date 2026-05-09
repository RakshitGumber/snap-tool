import * as PIXI from "pixi.js";

type DragCallbacks = {
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: () => void;
};

export function draggableBox(
  target: PIXI.Container,
  callbacks?: DragCallbacks,
) {
  target.eventMode = "static";
  target.cursor = "pointer";

  let dragging = false;

  let offsetX = 0;
  let offsetY = 0;

  target.on("pointerdown", (e: PIXI.FederatedPointerEvent) => {
    if (!target.parent) return;

    dragging = true;

    const pos = e.getLocalPosition(target.parent);

    offsetX = pos.x - target.x;
    offsetY = pos.y - target.y;

    callbacks?.onDragStart?.();
  });

  target.on("pointerup", () => {
    dragging = false;
    callbacks?.onDragEnd?.();
  });

  target.on("pointerupoutside", () => {
    dragging = false;
    callbacks?.onDragEnd?.();
  });

  target.on("pointermove", (e: PIXI.FederatedPointerEvent) => {
    if (!dragging) return;
    if (!target.parent) return;

    const pos = e.getLocalPosition(target.parent);

    const newX = pos.x - offsetX;
    const newY = pos.y - offsetY;

    target.x = newX;
    target.y = newY;

    callbacks?.onDragMove?.(newX, newY);
  });
}
