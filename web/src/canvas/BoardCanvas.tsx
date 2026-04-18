import {
  memo,
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
import { useBoardSelectionStore } from "@/stores/useBoardSelectionStore";
import { useBoardViewportStore } from "@/stores/useBoardViewportStore";
import {
  useActiveCanvasId,
  useCanvasById,
  useCanvasIds,
  useCanvasImageById,
  useCanvasStore,
  useSelectedCanvasId,
  useSelectedImageId,
} from "@/stores/useCanvasStore";
import { useAssetById, useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
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

type PointerSnapshot = {
  clientX: number;
  clientY: number;
};

type CanvasImageItemProps = {
  canvasId: string;
  imageId: string;
  isSelected: boolean;
  onPointerDown: (
    canvasId: string,
    imageId: string,
  ) => (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

type CanvasItemProps = {
  canvasId: string;
  isActive: boolean;
  isSelected: boolean;
  dropTargetCanvasId: string | null;
  onPointerDown: (canvasId: string) => (event: ReactPointerEvent<HTMLDivElement>) => void;
  onDragOver: (canvasId: string) => (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragLeave: (canvasId: string) => (event: ReactDragEvent<HTMLDivElement>) => void;
  onDrop: (canvasId: string) => (event: ReactDragEvent<HTMLDivElement>) => void;
  onImagePointerDown: (
    canvasId: string,
    imageId: string,
  ) => (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

const CanvasImageItem = memo(
  ({ canvasId, imageId, isSelected, onPointerDown }: CanvasImageItemProps) => {
    const image = useCanvasImageById(canvasId, imageId);
    const asset = useAssetById(image?.assetId ?? "");

    if (!image || !asset) {
      return null;
    }

    return (
      <button
        type="button"
        onPointerDown={onPointerDown(canvasId, imageId)}
        className={clsx(
          "absolute left-0 top-0 overflow-hidden rounded-lg shadow-md outline outline-1 outline-transparent transition",
          isSelected && "outline-accent",
        )}
        style={{
          width: image.width,
          height: image.height,
          zIndex: isSelected ? 2 : 1,
          transform: `translate3d(${image.x}px, ${image.y}px, 0)`,
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
  },
);

CanvasImageItem.displayName = "CanvasImageItem";

const CanvasItem = memo(
  ({
    canvasId,
    isActive,
    isSelected,
    dropTargetCanvasId,
    onPointerDown,
    onDragOver,
    onDragLeave,
    onDrop,
    onImagePointerDown,
  }: CanvasItemProps) => {
    const canvas = useCanvasById(canvasId);
    const selectedImageId = useSelectedImageId();

    if (!canvas) {
      return null;
    }

    return (
      <div
        className="absolute left-0 top-0"
        style={{
          width: canvas.width,
          height: canvas.height,
          transform: `translate3d(${canvas.x}px, ${canvas.y}px, 0)`,
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
          onPointerDown={onPointerDown(canvas.id)}
          onDragOver={onDragOver(canvas.id)}
          onDragLeave={onDragLeave(canvas.id)}
          onDrop={onDrop(canvas.id)}
          className={clsx(
            "relative h-full w-full overflow-hidden bg-white shadow-[0_18px_40px_rgba(51,51,60,0.14)] transition-shadow dark:shadow-none",
            dropTargetCanvasId === canvas.id && "outline outline-2 outline-accent outline-offset-[-4px]",
            isActive || isSelected
              ? "border-2 border-accent"
              : "border border-border-color/70",
          )}
          style={{ background: canvas.background }}
        >
          {canvas.imageOrder.map((imageId) => (
            <CanvasImageItem
              key={imageId}
              canvasId={canvas.id}
              imageId={imageId}
              isSelected={selectedImageId === imageId}
              onPointerDown={onImagePointerDown}
            />
          ))}
        </div>
      </div>
    );
  },
);

CanvasItem.displayName = "CanvasItem";

export const BoardCanvas = memo(function BoardCanvas() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const panStateRef = useRef<PanState | null>(null);
  const viewportRef = useRef(useBoardViewportStore.getState().viewport);
  const frameRequestRef = useRef<number | null>(null);
  const pointerSnapshotRef = useRef<PointerSnapshot | null>(null);
  const [dropTargetCanvasId, setDropTargetCanvasId] = useState<string | null>(null);

  const canvasIds = useCanvasIds();
  const activeCanvasId = useActiveCanvasId();
  const selectedCanvasId = useSelectedCanvasId();

  const moveCanvas = useCanvasStore((state) => state.moveCanvas);
  const moveImageOnCanvas = useCanvasStore((state) => state.moveImageOnCanvas);
  const insertImageOnCanvasAtPoint = useCanvasStore(
    (state) => state.insertImageOnCanvasAtPoint,
  );

  const setActiveCanvas = useBoardSelectionStore((state) => state.setActiveCanvas);
  const setSelectedCanvas = useBoardSelectionStore((state) => state.setSelectedCanvas);
  const setSelectedImage = useBoardSelectionStore((state) => state.setSelectedImage);

  const boardSize = useBoardViewportStore((state) => state.boardSize);
  const viewport = useBoardViewportStore((state) => state.viewport);
  const canPanBoard = useBoardViewportStore((state) => state.canPanBoard);
  const setBoardSize = useBoardViewportStore((state) => state.setBoardSize);
  const panBy = useBoardViewportStore((state) => state.panBy);
  const zoomAt = useBoardViewportStore((state) => state.zoomAt);

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

    const flushPointerMove = () => {
      frameRequestRef.current = null;

      const pointer = pointerSnapshotRef.current;
      const dragState = dragStateRef.current;
      const panState = panStateRef.current;

      if (!pointer) {
        return;
      }

      if (dragState?.kind === "canvas") {
        const board = useCanvasStore.getState().board;
        const activeCanvas = board.canvasesById[dragState.canvasId];
        if (!activeCanvas) {
          return;
        }

        const worldPoint = getWorldPoint(pointer.clientX, pointer.clientY);
        const nextX = worldPoint.x - dragState.offsetX;
        const nextY = worldPoint.y - dragState.offsetY;
        const snapPreview = resolveCanvasSnap({
          activeCanvas,
          canvases: board,
          nextX,
          nextY,
          threshold: SNAP_THRESHOLD,
          gap: SNAP_GAP,
        });

        moveCanvas(dragState.canvasId, snapPreview.x, snapPreview.y);
        return;
      }

      if (dragState?.kind === "image") {
        const board = useCanvasStore.getState().board;
        const canvas = board.canvasesById[dragState.canvasId];
        const image = canvas?.imagesById[dragState.imageId];
        if (!canvas || !image) {
          return;
        }

        const worldPoint = getWorldPoint(pointer.clientX, pointer.clientY);

        moveImageOnCanvas(
          dragState.canvasId,
          dragState.imageId,
          worldPoint.x - canvas.x - dragState.offsetX,
          worldPoint.y - canvas.y - dragState.offsetY,
        );
        return;
      }

      if (!panState) {
        return;
      }

      panBy(pointer.clientX - panState.x, pointer.clientY - panState.y);
      panStateRef.current = { x: pointer.clientX, y: pointer.clientY };
    };

    const schedulePointerMove = (clientX: number, clientY: number) => {
      pointerSnapshotRef.current = { clientX, clientY };

      if (frameRequestRef.current !== null) {
        return;
      }

      frameRequestRef.current = window.requestAnimationFrame(flushPointerMove);
    };

    const handlePointerMove = (event: PointerEvent) => {
      schedulePointerMove(event.clientX, event.clientY);
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
      panStateRef.current = null;
      pointerSnapshotRef.current = null;

      if (frameRequestRef.current !== null) {
        window.cancelAnimationFrame(frameRequestRef.current);
        frameRequestRef.current = null;
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      if (frameRequestRef.current !== null) {
        window.cancelAnimationFrame(frameRequestRef.current);
      }
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
      dragStateRef.current = {
        kind: "canvas",
        canvasId,
        offsetX: (event.clientX - rect.left) / Math.max(currentViewport.scale, 0.0001),
        offsetY: (event.clientY - rect.top) / Math.max(currentViewport.scale, 0.0001),
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
      dragStateRef.current = {
        kind: "image",
        canvasId,
        imageId,
        offsetX: (event.clientX - rect.left) / Math.max(currentViewport.scale, 0.0001),
        offsetY: (event.clientY - rect.top) / Math.max(currentViewport.scale, 0.0001),
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
      if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
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

      const asset = useUploadLibraryStore.getState().assetsById[assetId];
      const canvas = useCanvasStore.getState().board.canvasesById[canvasId];
      if (!asset || !canvas) {
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
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
        }}
      >
        {canvasIds.map((canvasId) => (
          <CanvasItem
            key={canvasId}
            canvasId={canvasId}
            isActive={canvasId === activeCanvasId}
            isSelected={canvasId === selectedCanvasId}
            dropTargetCanvasId={dropTargetCanvasId}
            onPointerDown={handleCanvasPointerDown}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
            onImagePointerDown={handleImagePointerDown}
          />
        ))}
      </div>

      {!boardSize.width ? null : (
        <div className="pointer-events-none absolute bottom-4 right-4 rounded-lg bg-card-bg/90 px-3 py-2 text-xs text-secondary-text outline outline-1 outline-border-color/60">
          Ctrl+. to focus • Ctrl+Arrow to move
        </div>
      )}
    </div>
  );
});
