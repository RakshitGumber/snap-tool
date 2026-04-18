import {
  memo,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import clsx from "clsx";

import { useBoardSelectionStore } from "@/stores/useBoardSelectionStore";
import {
  useCanvasImage,
  useCanvasImageIds,
  useCanvasShell,
  useCanvasStore,
  useSelectedImageId,
} from "@/stores/useCanvasStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import { getDraggedAssetId } from "@/uploads/drag";
import { useResolvedAssetMedia } from "@/uploads/media";

type ImageDragState = {
  imageId: string;
  offsetX: number;
  offsetY: number;
};

type PointerSnapshot = {
  clientX: number;
  clientY: number;
};

type CanvasImageItemProps = {
  imageId: string;
  isSelected: boolean;
  onPointerDown: (
    imageId: string,
  ) => (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

const CanvasImageItem = memo(
  ({ imageId, isSelected, onPointerDown }: CanvasImageItemProps) => {
    const image = useCanvasImage(imageId);
    const media = useResolvedAssetMedia(image?.assetId, "full");

    if (!image || !media) {
      return null;
    }

    return (
      <button
        type="button"
        onPointerDown={onPointerDown(imageId)}
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
          src={media.src}
          alt={image.alt}
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-contain"
        />
      </button>
    );
  },
);

CanvasImageItem.displayName = "CanvasImageItem";

export const BoardCanvas = memo(function BoardCanvas() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<ImageDragState | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const pointerSnapshotRef = useRef<PointerSnapshot | null>(null);
  const [dropTargetActive, setDropTargetActive] = useState(false);

  const canvasShell = useCanvasShell();
  const imageIds = useCanvasImageIds();
  const selectedImageId = useSelectedImageId();
  const moveImageOnCanvas = useCanvasStore((state) => state.moveImageOnCanvas);
  const insertImageOnCanvasAtPoint = useCanvasStore(
    (state) => state.insertImageOnCanvasAtPoint,
  );
  const clearSelection = useBoardSelectionStore((state) => state.clearSelection);
  const setSelectedImage = useBoardSelectionStore((state) => state.setSelectedImage);

  const getCanvasPoint = useEffectEvent((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  });

  const flushPointerMove = useEffectEvent(() => {
    frameRequestRef.current = null;

    const pointer = pointerSnapshotRef.current;
    const dragState = dragStateRef.current;

    if (!pointer || !dragState) {
      return;
    }

    const localPoint = getCanvasPoint(pointer.clientX, pointer.clientY);
    moveImageOnCanvas(
      dragState.imageId,
      localPoint.x - dragState.offsetX,
      localPoint.y - dragState.offsetY,
    );
  });

  useEffect(() => {
    const schedulePointerMove = (clientX: number, clientY: number) => {
      pointerSnapshotRef.current = { clientX, clientY };

      if (frameRequestRef.current !== null) {
        return;
      }

      frameRequestRef.current = window.requestAnimationFrame(flushPointerMove);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStateRef.current) {
        return;
      }

      schedulePointerMove(event.clientX, event.clientY);
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
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
  }, []);

  const handleSurfacePointerDown = () => {
    clearSelection();
  };

  const handleImagePointerDown =
    (imageId: string) => (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;

      event.stopPropagation();
      setSelectedImage(imageId);

      const rect = event.currentTarget.getBoundingClientRect();
      dragStateRef.current = {
        imageId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
      };
    };

  const handleCanvasDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    const assetId = getDraggedAssetId(event.dataTransfer);
    if (!assetId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";

    if (!dropTargetActive) {
      setDropTargetActive(true);
    }
  };

  const handleCanvasDragLeave = (event: ReactDragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    if (dropTargetActive) {
      setDropTargetActive(false);
    }
  };

  const handleCanvasDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    const assetId = getDraggedAssetId(event.dataTransfer);
    if (!assetId) {
      return;
    }

    event.preventDefault();
    setDropTargetActive(false);

    const asset = useUploadLibraryStore.getState().assetMetaById[assetId];
    if (!asset) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    insertImageOnCanvasAtPoint(asset, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  if (!canvasShell) {
    return null;
  }

  return (
    <div
      onPointerDown={handleSurfacePointerDown}
      onDragEnd={() => setDropTargetActive(false)}
      className="h-full w-full overflow-auto bg-bg"
      aria-label="Canvas workspace"
    >
      <div className="flex min-h-full min-w-full items-center justify-center p-6 sm:p-10">
        <div
          ref={canvasRef}
          onPointerDown={(event) => event.stopPropagation()}
          onDragOver={handleCanvasDragOver}
          onDragLeave={handleCanvasDragLeave}
          onDrop={handleCanvasDrop}
          className={clsx(
            "relative shrink-0 overflow-hidden border border-border-color/70 bg-white shadow-[0_18px_40px_rgba(51,51,60,0.14)] transition",
            dropTargetActive && "outline outline-2 outline-accent outline-offset-[-4px]",
          )}
          style={{
            width: canvasShell.width,
            height: canvasShell.height,
            background: canvasShell.background,
          }}
        >
          {imageIds.map((imageId) => (
            <CanvasImageItem
              key={imageId}
              imageId={imageId}
              isSelected={selectedImageId === imageId}
              onPointerDown={handleImagePointerDown}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
