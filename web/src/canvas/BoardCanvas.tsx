import {
  useEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
} from "react";

import clsx from "clsx";

import { SNAP_GAP, SNAP_THRESHOLD } from "@/board/config";
import { resolveCanvasSnap } from "@/board/snap";
import { useBoardViewportStore } from "@/stores/useBoardViewportStore";
import { useCanvasStore } from "@/stores/useCanvasStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import { getDraggedAssetId } from "@/uploads/drag";

type CanvasDragState = {
  kind: "canvas";
  canvasId: string;
  offsetX: number;
  offsetY: number;
};

type ImageDragState = {
  kind: "image";
  canvasId: string;
  imageId: string;
  offsetX: number;
  offsetY: number;
};

type DragState = CanvasDragState | ImageDragState;

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
  const [dropTargetCanvasId, setDropTargetCanvasId] = useState<string | null>(null);

  const canvases = useCanvasStore((state) => state.canvases);
  const activeCanvasId = useCanvasStore((state) => state.activeCanvasId);
  const selectedCanvasId = useCanvasStore((state) => state.selectedCanvasId);
  const selectedImageId = useCanvasStore((state) => state.selectedImageId);
  const moveCanvas = useCanvasStore((state) => state.moveCanvas);
  const moveImageOnCanvas = useCanvasStore((state) => state.moveImageOnCanvas);
  const insertImageOnCanvasAtPoint = useCanvasStore(
    (state) => state.insertImageOnCanvasAtPoint,
  );
  const setActiveCanvas = useCanvasStore((state) => state.setActiveCanvas);
  const setSelectedCanvas = useCanvasStore((state) => state.setSelectedCanvas);
  const setSelectedImage = useCanvasStore((state) => state.setSelectedImage);

  const assets = useUploadLibraryStore((state) => state.assets);

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

      if (dragState?.kind === "canvas") {
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

      if (dragState?.kind === "image") {
        const canvas = canvasesRef.current.find(
          (currentCanvas) => currentCanvas.id === dragState.canvasId,
        );
        const image = canvas?.images.find(
          (currentImage) => currentImage.id === dragState.imageId,
        );

        if (!canvas || !image) return;

        const worldPoint = getWorldPoint(event.clientX, event.clientY);

        moveImageOnCanvas(
          dragState.canvasId,
          dragState.imageId,
          worldPoint.x - canvas.x - dragState.offsetX,
          worldPoint.y - canvas.y - dragState.offsetY,
        );
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
  }, [moveCanvas, moveImageOnCanvas, panBy]);

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
        kind: "canvas",
        canvasId,
        offsetX,
        offsetY,
      };
    };

  const handleImagePointerDown =
    (canvasId: string, imageId: string) =>
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;

      event.stopPropagation();
      setActiveCanvas(canvasId);
      setSelectedCanvas(canvasId);
      setSelectedImage(imageId);

      const rect = event.currentTarget.getBoundingClientRect();
      const currentViewport = viewportRef.current;
      const offsetX =
        (event.clientX - rect.left) / Math.max(currentViewport.scale, 0.0001);
      const offsetY =
        (event.clientY - rect.top) / Math.max(currentViewport.scale, 0.0001);

      dragStateRef.current = {
        kind: "image",
        canvasId,
        imageId,
        offsetX,
        offsetY,
      };
    };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    zoomAt(event.clientX - rect.left, event.clientY - rect.top, event.deltaY);
  };

  const handleCanvasDragOver =
    (canvasId: string) => (event: ReactDragEvent<HTMLDivElement>) => {
      const assetId = getDraggedAssetId(event.dataTransfer);
      if (!assetId) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";

      if (dropTargetCanvasId !== canvasId) {
        setDropTargetCanvasId(canvasId);
      }
    };

  const handleCanvasDragLeave =
    (canvasId: string) => (event: ReactDragEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget;
      if (
        nextTarget instanceof Node &&
        event.currentTarget.contains(nextTarget)
      ) {
        return;
      }

      if (dropTargetCanvasId === canvasId) {
        setDropTargetCanvasId(null);
      }
    };

  const handleCanvasDrop =
    (canvasId: string) => (event: ReactDragEvent<HTMLDivElement>) => {
      const assetId = getDraggedAssetId(event.dataTransfer);
      if (!assetId) {
        return;
      }

      event.preventDefault();
      setDropTargetCanvasId(null);

      const asset = assets.find((libraryAsset) => libraryAsset.id === assetId);
      if (!asset) {
        return;
      }

      const canvas = canvases.find((currentCanvas) => currentCanvas.id === canvasId);
      if (!canvas) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const currentViewport = viewportRef.current;
      const localPoint = {
        x: (event.clientX - rect.left) / Math.max(currentViewport.scale, 0.0001),
        y: (event.clientY - rect.top) / Math.max(currentViewport.scale, 0.0001),
      };

      insertImageOnCanvasAtPoint(asset, canvas.id, localPoint);
    };

  return (
    <div
      ref={hostRef}
      onPointerDown={handleSurfacePointerDown}
      onDragEnd={() => setDropTargetCanvasId(null)}
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
                onDragOver={handleCanvasDragOver(canvas.id)}
                onDragLeave={handleCanvasDragLeave(canvas.id)}
                onDrop={handleCanvasDrop(canvas.id)}
                className={clsx(
                  "relative h-full w-full overflow-hidden bg-white shadow-[0_18px_40px_rgba(51,51,60,0.14)] transition-shadow dark:shadow-none",
                  dropTargetCanvasId === canvas.id && "outline outline-2 outline-accent outline-offset-[-4px]",
                  isActive || isSelected
                    ? "border-2 border-accent"
                    : "border border-border-color/70",
                )}
                style={{ background: canvas.background }}
              >
                {canvas.images.map((image) => {
                  const asset = assets.find((libraryAsset) => libraryAsset.id === image.assetId);
                  if (!asset) return null;

                  const isImageSelected = image.id === selectedImageId;

                  return (
                    <button
                      key={image.id}
                      type="button"
                      onPointerDown={handleImagePointerDown(canvas.id, image.id)}
                      className={clsx(
                        "absolute overflow-hidden rounded-lg shadow-md outline outline-1 outline-transparent transition",
                        isImageSelected && "outline-accent",
                      )}
                      style={{
                        left: image.x,
                        top: image.y,
                        width: image.width,
                        height: image.height,
                        zIndex: isImageSelected ? 2 : 1,
                      }}
                    >
                      <img
                        src={asset.src}
                        alt={image.alt}
                        draggable={false}
                        className="pointer-events-none h-full w-full select-none object-contain"
                      />
                    </button>
                  );
                })}
              </div>
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
