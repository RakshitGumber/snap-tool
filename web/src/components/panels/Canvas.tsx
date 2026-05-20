import { Application } from "@pixi/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { Rectangle } from "pixi.js";
import type { ApplicationRef } from "@pixi/react";

import { LinkCardCanvas } from "@/components/cards/LinkCardCanvas";
import { getPixiResolution } from "@/components/cards/pixiResolution";
import { useCanvasExport } from "@/providers/CanvasExportContext";
import {
  getBackgroundPresetById,
  getBackgroundPresetStyle,
} from "@/config/backgroundPresets";
import { getLinkCardPresetById } from "@/config/linkCardPresets";
import { useCanvasStore } from "@/stores/useCanvasStore";

type ResizeState = {
  pointerId: number;
  startX: number;
  startY: number;
  widthRatio: number;
};

const waitForNextFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

export const Canvas = () => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<ApplicationRef | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const { registerExporter } = useCanvasExport();

  const canvasSize = useCanvasStore((state) => state.canvasSize);
  const activeCanvasPresetId = useCanvasStore(
    (state) => state.activeCanvasPresetId,
  );
  const activeCard = useCanvasStore((state) => state.activeCard);
  const activeBackgroundId = useCanvasStore(
    (state) => state.activeBackgroundId,
  );
  const resizeActiveCard = useCanvasStore((state) => state.resizeActiveCard);
  const beginResizeActiveCard = useCanvasStore(
    (state) => state.beginResizeActiveCard,
  );
  const endResizeActiveCard = useCanvasStore(
    (state) => state.endResizeActiveCard,
  );
  const deleteActiveCard = useCanvasStore((state) => state.deleteActiveCard);

  const activeBackground = getBackgroundPresetById(activeBackgroundId);
  const pixiCanvasKey = `${activeCanvasPresetId}-${activeBackgroundId}`;

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
      scale,
    };
  }, [boardSize.height, boardSize.width, canvasSize.height, canvasSize.width]);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!activeCard) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      beginResizeActiveCard();
      resizeStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        widthRatio: activeCard.widthRatio,
      };
    },
    [activeCard, beginResizeActiveCard],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const resizeState = resizeStateRef.current;
      // Ensure we are actually dragging this specific button
      if (
        !resizeState ||
        !event.currentTarget.hasPointerCapture(event.pointerId) ||
        !activeCard ||
        previewSize.scale <= 0
      )
        return;

      const preset = getLinkCardPresetById(activeCard.presetId);
      const deltaX = (event.clientX - resizeState.startX) / previewSize.scale;
      const deltaY = (event.clientY - resizeState.startY) / previewSize.scale;
      const directionalDelta = Math.max(deltaX, deltaY * preset.aspectRatio);
      const nextWidthRatio =
        resizeState.widthRatio + (directionalDelta * 2) / canvasSize.width;

      resizeActiveCard(nextWidthRatio);
    },
    [activeCard, previewSize.scale, canvasSize.width, resizeActiveCard],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState || resizeState.pointerId !== event.pointerId) return;

      event.currentTarget.releasePointerCapture(event.pointerId);
      resizeStateRef.current = null;
      endResizeActiveCard();
    },
    [endResizeActiveCard],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches('input, textarea, select, [contenteditable="true"]')) {
        return;
      }

      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      if (!activeCard) return;

      event.preventDefault();
      deleteActiveCard();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeCard, deleteActiveCard]);

  useEffect(() => {
    return registerExporter(async () => {
      const app = appRef.current?.getApplication();
      if (!app) throw new Error("Canvas is not ready yet.");

      const snapshot = useCanvasStore.getState();

      app.renderer.resize(
        snapshot.canvasSize.width,
        snapshot.canvasSize.height,
      );

      await waitForNextFrame();
      app.render();

      app.renderer.extract.download({
        target: app.stage,
        filename: `snap-tool-${Date.now()}.png`,
        frame: new Rectangle(
          0,
          0,
          snapshot.canvasSize.width,
          snapshot.canvasSize.height,
        ),
        resolution: 1,
        antialias: true,
      });
    });
  }, [registerExporter]);

  const resizeHandleStyle = useMemo((): CSSProperties | undefined => {
    if (!activeCard) return undefined;

    const preset = getLinkCardPresetById(activeCard.presetId);
    const scaledCardWidth =
      canvasSize.width * activeCard.widthRatio * previewSize.scale;
    const scaledCardHeight = scaledCardWidth / preset.aspectRatio;

    return {
      left: `calc(50% + ${scaledCardWidth / 2}px - 10px)`,
      top: `calc(50% + ${scaledCardHeight / 2}px - 10px)`,
    };
  }, [activeCard, canvasSize.width, previewSize.scale]);

  return (
    <div
      ref={boardRef}
      className="flex h-[calc(100vh-64px)] flex-1 items-center justify-center overflow-hidden p-6"
    >
      <div
        style={{
          ...getBackgroundPresetStyle(activeBackground),
          width: previewSize.width,
          height: previewSize.height,
        }}
        className="relative overflow-hidden shadow-lg"
      >
        <Application
          key={pixiCanvasKey}
          ref={appRef}
          antialias
          backgroundAlpha={0}
          className="block h-full w-full"
          height={canvasSize.height}
          resolution={getPixiResolution()}
          width={canvasSize.width}
        >
          <LinkCardCanvas
            activeBackgroundId={activeBackgroundId}
            activeCard={activeCard}
            canvasSize={canvasSize}
          />
        </Application>

        {!activeCard ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-secondary-text">
            Add a link from Images
          </div>
        ) : (
          <button
            type="button"
            aria-label="Resize centered card"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute h-5 w-5 rounded-full border bg-accent"
            style={resizeHandleStyle}
          />
        )}
      </div>
    </div>
  );
};
