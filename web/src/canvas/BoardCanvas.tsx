import { useEffect, useRef, type WheelEvent } from "react";
import { Application, Container, Graphics, Text } from "pixi.js";

import { useBoardStore } from "@/stores/useBoardStore";

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.25;

export const BoardCanvas = () => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let isDisposed = false;
    let isInitialized = false;
    const app = new Application();
    appRef.current = app;

    const initPixi = async () => {
      await app.init({
        resizeTo: host,
        antialias: true,
        backgroundAlpha: 0,
      });
      isInitialized = true;
      if (isDisposed) {
        app.destroy({ removeView: true }, true);
        return () => {};
      }

      host.replaceChildren();
      host.appendChild(app.canvas);
      app.stage.eventMode = "static";
      app.stage.hitArea = app.screen;

      // Update store with actual canvas size
      useBoardStore.getState().setBoardSize({
        width: host.clientWidth,
        height: host.clientHeight,
      });

      const background = new Graphics();
      const world = new Container();
      const framesLayer = new Container();
      world.addChild(framesLayer);
      app.stage.addChild(background, world);

      let panStart: { x: number; y: number } | null = null;
      let dragStart: { id: string; offX: number; offY: number } | null = null;

      background.eventMode = "static";
      background.cursor = "grab";

      background.on("pointerdown", (e) => {
        useBoardStore.getState().selectFrame(null);
        panStart = { x: e.global.x, y: e.global.y };
        background.cursor = "grabbing";
      });

      app.stage.on("globalpointermove", (e) => {
        const state = useBoardStore.getState();

        if (dragStart) {
          state.updateFramePosition(
            dragStart.id,
            (e.global.x - world.x) / world.scale.x - dragStart.offX,
            (e.global.y - world.y) / world.scale.y - dragStart.offY,
          );
        } else if (panStart) {
          state.setViewport({
            ...state.viewport,
            x: state.viewport.x + (e.global.x - panStart.x),
            y: state.viewport.y + (e.global.y - panStart.y),
          });
          panStart = { x: e.global.x, y: e.global.y };
        }
      });

      const onPointerUp = () => {
        panStart = null;
        dragStart = null;
        background.cursor = "grab";
      };

      app.stage.on("pointerup", onPointerUp);
      app.stage.on("pointerupoutside", onPointerUp);

      const unsubscribe = useBoardStore.subscribe((state) => {
        // const palette = getPalette(isDark);

        world.position.set(state.viewport.x, state.viewport.y);
        world.scale.set(state.viewport.scale);

        background.clear();
        background.rect(0, 0, state.boardSize.width, state.boardSize.height);
        // .fill(palette.boardFill);

        framesLayer
          .removeChildren()
          .forEach((c) => c.destroy({ children: true }));

        state.frames.forEach((frame) => {
          const isSelected = state.selectedFrameId === frame.id;
          const container = new Container();
          container.position.set(frame.x, frame.y);
          container.eventMode = "static";
          container.cursor = "grab";

          const card = new Graphics()
            .roundRect(0, 0, frame.width, frame.height, 28)
            .stroke({
              width: isSelected ? 3 : 2,
            });

          const label = new Text({
            text: frame.title,
            style: {
              fontFamily: "Mulish Variable",
              fontSize: 24,
            },
          });
          label.position.set(24, 54);

          container.addChild(card, label);

          container.on("pointerdown", (e) => {
            e.stopPropagation();
            state.selectFrame(frame.id);
            const pos = e.getLocalPosition(container);
            dragStart = { id: frame.id, offX: pos.x, offY: pos.y };
          });

          framesLayer.addChild(container);
        });
      });

      useBoardStore.setState((s) => ({ ...s }));

      return unsubscribe;
    };

    let cleanupStore = () => {};
    initPixi().then((unsub) => {
      cleanupStore = unsub;
    });

    return () => {
      isDisposed = true;
      cleanupStore();
      appRef.current = null;
      if (isInitialized) {
        app.destroy({ removeView: true }, true);
        host.replaceChildren();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        useBoardStore.getState().removeSelectedFrame();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 3. Wheel / Zoom Handling
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    const state = useBoardStore.getState();
    if (!state.boardSize.width) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    const worldX = (pointerX - state.viewport.x) / state.viewport.scale;
    const worldY = (pointerY - state.viewport.y) / state.viewport.scale;

    const zoomFactor = Math.exp(-e.deltaY * 0.0015);
    const scale = Math.min(
      Math.max(state.viewport.scale * zoomFactor, MIN_ZOOM),
      MAX_ZOOM,
    );

    state.setViewport({
      scale,
      x: pointerX - worldX * scale,
      y: pointerY - worldY * scale,
    });
  };

  return (
    <div
      ref={hostRef}
      tabIndex={0}
      onWheel={handleWheel}
      className="h-screen w-full overflow-hidden touch-none outline-none"
      aria-label="Canvas board"
    />
  );
};
