import { useEffect, useMemo, useRef, useState } from "react";

import { getBackgroundPresetById } from "@/config/backgroundPresets";
import { getLinkCardPresetById } from "@/config/linkCardPresets";
import { useCanvasStore } from "@/new_stores/useCanvasStore";

import { CenteredCard } from "../ui/CenteredCard";

type ResizeState = {
  pointerId: number;
  startX: number;
  startY: number;
  widthRatio: number;
};

export const Canvas = () => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });

  const {
    canvasSize,
    activeCard,
    resizeActiveCard,
    beginResizeActiveCard,
    endResizeActiveCard,
    deleteActiveCard,
    activeBackgroundId,
    cardShadowSize,
  } = useCanvasStore((state) => state);

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
      scale,
    };
  }, [boardSize.height, boardSize.width, canvasSize.height, canvasSize.width]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const resizeState = resizeStateRef.current;

      if (!resizeState || !activeCard || previewSize.scale <= 0) return;

      const preset = getLinkCardPresetById(activeCard.presetId);
      const deltaX = (event.clientX - resizeState.startX) / previewSize.scale;
      const deltaY = (event.clientY - resizeState.startY) / previewSize.scale;
      const directionalDelta = Math.max(deltaX, deltaY * preset.aspectRatio);
      const nextWidthRatio =
        resizeState.widthRatio + (directionalDelta * 2) / canvasSize.width;

      resizeActiveCard(nextWidthRatio);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const resizeState = resizeStateRef.current;

      if (!resizeState || resizeState.pointerId !== event.pointerId) return;

      resizeStateRef.current = null;
      endResizeActiveCard();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [
    activeCard,
    canvasSize.width,
    endResizeActiveCard,
    previewSize.scale,
    resizeActiveCard,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isTextInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (event.key !== "Delete" || isTextInput) return;

      event.preventDefault();
      deleteActiveCard();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteActiveCard]);

  const handleResizeStart = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!activeCard) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    beginResizeActiveCard();
    resizeStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      widthRatio: activeCard.widthRatio,
    };
  };

  return (
    <div
      ref={boardRef}
      className="flex flex-1 items-center justify-center overflow-hidden p-6"
    >
      <div
        style={{
          width: previewSize.width,
          height: previewSize.height,
          background: activeBackground.background,
        }}
        className="relative overflow-hidden shadow-lg"
      >
        {activeCard ? (
          <CenteredCard
            card={activeCard}
            canvasWidth={canvasSize.width}
            scale={previewSize.scale}
            shadowSize={cardShadowSize}
            onResizeStart={handleResizeStart}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-secondary-text">
            Add a link or screenshot from Images
          </div>
        )}
      </div>
    </div>
  );
};
