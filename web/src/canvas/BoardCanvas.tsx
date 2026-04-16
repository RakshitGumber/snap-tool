import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
} from "react";

import clsx from "clsx";

import { SNAP_GAP, SNAP_THRESHOLD } from "@/board/config";
import { resolveCanvasSnap } from "@/board/snap";
import { useBoardViewportStore } from "@/stores/useBoardViewportStore";
import { useCanvasStore } from "@/stores/useCanvasStore";

type DragState = {
  canvasId: string;
  offsetX: number;
  offsetY: number;
};

type PanState = {
  x: number;
  y: number;
};

export const BoardCanvas = () => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const panStateRef = useRef<PanState | null>(null);
  const canvasesRef = useRef(useCanvasStore.getState().canvases);
  const viewportRef = useRef(useBoardViewportStore.getState().viewport);

  const canvases = useCanvasStore((state) => state.canvases);
  const activeCanvasId = useCanvasStore((state) => state.activeCanvasId);
  const selectedCanvasId = useCanvasStore((state) => state.selectedCanvasId);
  const moveCanvas = useCanvasStore((state) => state.moveCanvas);
  const setActiveCanvas = useCanvasStore((state) => state.setActiveCanvas);
  const setSelectedCanvas = useCanvasStore((state) => state.setSelectedCanvas);

  const boardSize = useBoardViewportStore((state) => state.boardSize);
  const viewport = useBoardViewportStore((state) => state.viewport);
  const canPanBoard = useBoardViewportStore((state) => state.canPanBoard);
  const setBoardSize = useBoardViewportStore((state) => state.setBoardSize);
  const panBy = useBoardViewportStore((state) => state.panBy);
  const zoomAt = useBoardViewportStore((state) => state.zoomAt);

  useEffect(() => {
    canvasesRef.current = canvases;
  }, [canvases]);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const observer = new ResizeObserver(([entry]) => {
      setBoardSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(host);
    return () => observer.disconnect();
  }, [setBoardSize]);

  useEffect(() => {
    const getWorldPoint = (clientX: number, clientY: number) => {
      const host = hostRef.current;
      if (!host) return { x: 0, y: 0 };

      const rect = host.getBoundingClientRect();
      const currentViewport = viewportRef.current;

      return {
        x: (clientX - rect.left - currentViewport.x) / currentViewport.scale,
        y: (clientY - rect.top - currentViewport.y) / currentViewport.scale,
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      const panState = panStateRef.current;

      if (dragState) {
        const activeCanvas = canvasesRef.current.find(
          (canvas) => canvas.id === dragState.canvasId,
        );
        if (!activeCanvas) return;

        const worldPoint = getWorldPoint(event.clientX, event.clientY);
        const nextX = worldPoint.x - dragState.offsetX;
        const nextY = worldPoint.y - dragState.offsetY;
        const snapPreview = resolveCanvasSnap({
          activeCanvas,
          canvases: canvasesRef.current,
          nextX,
          nextY,
          threshold: SNAP_THRESHOLD,
          gap: SNAP_GAP,
        });

        moveCanvas(dragState.canvasId, snapPreview.x, snapPreview.y);
        return;
      }

      if (!panState) return;

      panBy(event.clientX - panState.x, event.clientY - panState.y);
      panStateRef.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
      panStateRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [moveCanvas, panBy]);

  const handleSurfacePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    setSelectedCanvas(null);
    if (!canPanBoard) return;

    panStateRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleCanvasPointerDown =
    (canvasId: string) => (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;

      event.stopPropagation();
      setActiveCanvas(canvasId);
      setSelectedCanvas(canvasId);

      const rect = event.currentTarget.getBoundingClientRect();
      const currentViewport = viewportRef.current;
      const offsetX =
        (event.clientX - rect.left) / Math.max(currentViewport.scale, 0.0001);
      const offsetY =
        (event.clientY - rect.top) / Math.max(currentViewport.scale, 0.0001);

      dragStateRef.current = {
        canvasId,
        offsetX,
        offsetY,
      };
    };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    zoomAt(event.clientX - rect.left, event.clientY - rect.top, event.deltaY);
  };

  return (
    <div
      ref={hostRef}
      onPointerDown={handleSurfacePointerDown}
      onWheel={handleWheel}
      className="relative h-full w-full overflow-hidden bg-bg touch-none"
      aria-label="Canvas board"
    >
      <div
        className="absolute left-0 top-0 h-full w-full origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
        }}
      >
        {canvases.map((canvas) => {
          const isActive = canvas.id === activeCanvasId;
          const isSelected = canvas.id === selectedCanvasId;

          return (
            <div
              key={canvas.id}
              className="absolute"
              style={{
                left: canvas.x,
                top: canvas.y,
                width: canvas.width,
                height: canvas.height,
              }}
            >
              <div
                className={clsx(
                  "pointer-events-none absolute -top-6 left-0 text-xs font-semibold text-secondary-text",
                  isActive && "text-title-color",
                )}
              >
                {canvas.title}
              </div>

              <div
                role="button"
                tabIndex={0}
                aria-label={canvas.title}
                onPointerDown={handleCanvasPointerDown(canvas.id)}
                className={clsx(
                  "relative h-full w-full overflow-hidden border border-border-color/70 bg-white",
                  (isActive || isSelected) && "border-2 border-accent",
                )}
                style={{ background: canvas.background }}
              />
            </div>
          );
        })}
      </div>

      {!boardSize.width ? null : (
        <div className="pointer-events-none absolute bottom-4 right-4 rounded-lg bg-card-bg/90 px-3 py-2 text-xs text-secondary-text outline outline-1 outline-border-color/60">
          Ctrl+. to focus • Ctrl+Arrow to move
        </div>
      )}
    </div>
  );
};
