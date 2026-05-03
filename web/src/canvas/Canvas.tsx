import {
  memo,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import clsx from "clsx";

import {
  buildCanvasBackgroundFilter,
  getCanvasBackgroundBlurPadding,
  getCanvasBackgroundOpacity,
} from "@/canvas/backgroundEffects";
import { ensureGoogleFontLoaded } from "@/libs/googleFonts";
import { useCanvasShell, useCanvasStore } from "@/stores/useCanvasStore";
import { useEditorUiStore } from "@/stores/useEditorUiStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import { clearDraggedAssetId, getDraggedAssetId } from "@/uploads/drag";
import type { BoardImageItem, BoardTextItem } from "@/types/canvas";

type CanvasDragState =
  | {
      kind: "image";
      itemId: string;
      offsetX: number;
      offsetY: number;
    }
  | {
      kind: "image-resize";
      itemId: string;
      startPointerX: number;
      startPointerY: number;
      startWidth: number;
      startHeight: number;
    }
  | {
      kind: "text";
      itemId: string;
      offsetX: number;
      offsetY: number;
      width: number;
      height: number;
    };

type PointerSnapshot = {
  clientX: number;
  clientY: number;
};

export const Canvas = memo(function BoardCanvas() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const viewportInnerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<CanvasDragState | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const pointerSnapshotRef = useRef<PointerSnapshot | null>(null);
  const [dropTargetActive, setDropTargetActive] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);

  const canvasShell = useCanvasShell();
  const imageOrder = useCanvasStore((state) => state.imageOrder);
  const imagesById = useCanvasStore((state) => state.imagesById);
  const textOrder = useCanvasStore((state) => state.textOrder);
  const textsById = useCanvasStore((state) => state.textsById);
  const selectedImageId = useEditorUiStore((state) => state.selectedImageId);
  const selectedTextId = useEditorUiStore((state) => state.selectedTextId);
  const moveImageOnCanvas = useCanvasStore((state) => state.moveImageOnCanvas);
  const resizeImageOnCanvas = useCanvasStore(
    (state) => state.resizeImageOnCanvas,
  );
  const moveTextOnCanvas = useCanvasStore((state) => state.moveTextOnCanvas);
  const beginHistoryTransaction = useCanvasStore(
    (state) => state.beginHistoryTransaction,
  );
  const endHistoryTransaction = useCanvasStore(
    (state) => state.endHistoryTransaction,
  );
  const insertImageOnCanvasAtPoint = useCanvasStore(
    (state) => state.insertImageOnCanvasAtPoint,
  );
  const clearSelection = useEditorUiStore((state) => state.clearSelection);
  const selectImage = useEditorUiStore((state) => state.selectImage);
  const selectText = useEditorUiStore((state) => state.selectText);
  const resolvedMediaByAssetId = useUploadLibraryStore(
    (state) => state.resolvedMediaByAssetId,
  );
  const assetMetaById = useUploadLibraryStore((state) => state.assetMetaById);
  const resolveAssetMedia = useUploadLibraryStore(
    (state) => state.resolveAssetMedia,
  );

  const images = useMemo(
    () =>
      imageOrder
        .map((imageId) => imagesById[imageId])
        .filter((image): image is BoardImageItem => image !== undefined),
    [imageOrder, imagesById],
  );

  const texts = useMemo(
    () =>
      textOrder
        .map((textId) => textsById[textId])
        .filter((text): text is BoardTextItem => text !== undefined),
    [textOrder, textsById],
  );

  useEffect(() => {
    for (const image of images) {
      if (!resolvedMediaByAssetId[image.assetId]?.full) {
        void resolveAssetMedia(image.assetId, "full");
      }
    }
  }, [images, resolveAssetMedia, resolvedMediaByAssetId]);

  useEffect(() => {
    for (const text of texts) {
      ensureGoogleFontLoaded(text.fontFamily);
    }
  }, [texts]);

  const updateCanvasScale = useEffectEvent(() => {
    if (!canvasShell) {
      return;
    }

    const container = viewportInnerRef.current;
    if (!container) {
      return;
    }

    // Inner bounding box represents exactly the screen space we want to fit inside
    const availableWidth = container.clientWidth;
    const availableHeight = container.clientHeight;

    const scaleX = availableWidth / Math.max(canvasShell.width, 1);
    const scaleY = availableHeight / Math.max(canvasShell.height, 1);
    const nextScale = Math.max(Math.min(scaleX, scaleY), 0.01);

    setCanvasScale((currentScale) =>
      Math.abs(currentScale - nextScale) < 0.001 ? currentScale : nextScale,
    );
  });

  useLayoutEffect(() => {
    updateCanvasScale();
  }, [canvasShell?.width, canvasShell?.height]);

  useEffect(() => {
    if (!canvasShell) {
      return;
    }

    const viewport = viewportInnerRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateCanvasScale();
    });
    observer.observe(viewport);

    return () => {
      observer.disconnect();
    };
  }, [canvasShell]);

  const getCanvasPoint = useEffectEvent((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: (clientX - rect.left) / canvasScale,
      y: (clientY - rect.top) / canvasScale,
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

    if (dragState.kind === "image") {
      moveImageOnCanvas(
        dragState.itemId,
        localPoint.x - dragState.offsetX,
        localPoint.y - dragState.offsetY,
      );
      return;
    }

    if (dragState.kind === "image-resize") {
      const widthRatio =
        (dragState.startWidth + (localPoint.x - dragState.startPointerX)) /
        Math.max(dragState.startWidth, 1);
      const heightRatio =
        (dragState.startHeight + (localPoint.y - dragState.startPointerY)) /
        Math.max(dragState.startHeight, 1);
      const nextScale = Math.max(widthRatio, heightRatio, 0.05);

      resizeImageOnCanvas(
        dragState.itemId,
        dragState.startWidth * nextScale,
        dragState.startHeight * nextScale,
      );
      return;
    }

    moveTextOnCanvas(
      dragState.itemId,
      localPoint.x - dragState.offsetX,
      localPoint.y - dragState.offsetY,
      {
        width: dragState.width,
        height: dragState.height,
      },
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
      const hadDragState = dragStateRef.current !== null;
      dragStateRef.current = null;
      pointerSnapshotRef.current = null;

      if (frameRequestRef.current !== null) {
        window.cancelAnimationFrame(frameRequestRef.current);
        frameRequestRef.current = null;
      }

      if (hadDragState) {
        endHistoryTransaction();
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
      if (event.button !== 0) {
        return;
      }

      event.stopPropagation();
      selectImage(imageId);
      beginHistoryTransaction();

      const rect = event.currentTarget.getBoundingClientRect();
      dragStateRef.current = {
        kind: "image",
        itemId: imageId,
        offsetX: (event.clientX - rect.left) / canvasScale,
        offsetY: (event.clientY - rect.top) / canvasScale,
      };
    };

  const handleTextPointerDown =
    (textId: string) => (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) {
        return;
      }

      const text = texts.find((item) => item.id === textId);
      if (!text) {
        return;
      }

      event.stopPropagation();
      selectText(text);
      beginHistoryTransaction();

      const rect = event.currentTarget.getBoundingClientRect();
      dragStateRef.current = {
        kind: "text",
        itemId: textId,
        offsetX: (event.clientX - rect.left) / canvasScale,
        offsetY: (event.clientY - rect.top) / canvasScale,
        width: rect.width / canvasScale,
        height: rect.height / canvasScale,
      };
    };

  const handleImageResizePointerDown =
    (image: BoardImageItem) =>
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) {
        return;
      }

      event.stopPropagation();
      event.preventDefault();
      selectImage(image.id);
      beginHistoryTransaction();
      const localPoint = getCanvasPoint(event.clientX, event.clientY);
      dragStateRef.current = {
        kind: "image-resize",
        itemId: image.id,
        startPointerX: localPoint.x,
        startPointerY: localPoint.y,
        startWidth: image.width,
        startHeight: image.height,
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
    if (
      nextTarget instanceof Node &&
      event.currentTarget.contains(nextTarget)
    ) {
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
    clearDraggedAssetId();

    const asset = assetMetaById[assetId];
    if (!asset || !canvasShell) {
      return;
    }

    const dropPoint = getCanvasPoint(event.clientX, event.clientY);
    insertImageOnCanvasAtPoint(asset, dropPoint);
  };

  if (!canvasShell) {
    return null;
  }

  const backgroundBlurPadding = getCanvasBackgroundBlurPadding(
    canvasShell.backgroundEffects,
  );

  return (
    <div
      ref={viewportRef}
      onPointerDown={handleSurfacePointerDown}
      onDragEnd={() => setDropTargetActive(false)}
      className="flex h-full w-full flex-col overflow-hidden bg-bg"
      aria-label="Canvas workspace"
    >
      <div ref={viewportInnerRef} className="relative m-4 flex-1 sm:m-6">
        <div
          ref={canvasRef}
          onPointerDown={(event) => {
            event.stopPropagation();

            if (event.target === event.currentTarget) {
              clearSelection();
            }
          }}
          onDragOver={handleCanvasDragOver}
          onDragLeave={handleCanvasDragLeave}
          onDrop={handleCanvasDrop}
          className={clsx(
            "absolute left-1/2 top-1/2 overflow-visible border border-border-color/70 bg-white shadow-[0_18px_40px_rgba(51,51,60,0.14)] transition",
            dropTargetActive && "outline-2 outline-accent -outline-offset-4",
          )}
          style={{
            width: canvasShell.width,
            height: canvasShell.height,
            /* Centers the canvas, then scales it down around the dead center */
            transform: `translate(-50%, -50%) scale(${canvasScale})`,
            transformOrigin: "center center",
          }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute"
              style={{
                top: -backgroundBlurPadding,
                right: -backgroundBlurPadding,
                bottom: -backgroundBlurPadding,
                left: -backgroundBlurPadding,
                background: canvasShell.background,
                filter: buildCanvasBackgroundFilter(
                  canvasShell.backgroundEffects,
                ),
                opacity: getCanvasBackgroundOpacity(
                  canvasShell.backgroundEffects,
                ),
              }}
            />
          </div>

          {images.map((image) => {
            const media = resolvedMediaByAssetId[image.assetId]?.full;
            if (!media) {
              return null;
            }

            return (
              <div
                key={image.id}
                style={{
                  width: image.width,
                  height: image.height,
                  zIndex: selectedImageId === image.id ? 2 : 1,
                  transform: `translate3d(${image.x}px, ${image.y}px, 0)`,
                  position: "absolute",
                }}
              >
                <button
                  type="button"
                  onPointerDown={handleImagePointerDown(image.id)}
                  className={clsx(
                    "h-full w-full overflow-hidden rounded-lg shadow-md outline-transparent",
                    selectedImageId === image.id && "outline-accent",
                  )}
                  style={{ touchAction: "none" }}
                >
                  <img
                    src={media.src}
                    alt={image.alt}
                    draggable={false}
                    className="pointer-events-none h-full w-full select-none object-contain"
                  />
                </button>

                {selectedImageId === image.id ? (
                  <button
                    type="button"
                    aria-label="Resize image"
                    onPointerDown={handleImageResizePointerDown(image)}
                    className="absolute h-4 w-4 rounded-full border-2 border-white bg-accent shadow-md"
                    style={{
                      right: 0,
                      bottom: 0,
                      transform: "translate(50%, 50%)",
                      touchAction: "none",
                    }}
                  />
                ) : null}
              </div>
            );
          })}

          {texts.map((text) => (
            <button
              key={text.id}
              type="button"
              onPointerDown={handleTextPointerDown(text.id)}
              className={clsx(
                "absolute left-0 top-0 rounded-xl bg-transparent px-2 py-1 text-left outline-transparent",
                selectedTextId === text.id && "outline-accent",
              )}
              style={{
                zIndex: selectedTextId === text.id ? 4 : 3,
                maxWidth: text.maxWidth,
                transform: `translate3d(${text.x}px, ${text.y}px, 0)`,
                color: text.color,
                fontFamily: `${text.fontFamily}, sans-serif`,
                fontSize: text.fontSize,
                fontWeight: text.fontWeight,
                textAlign: text.align,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {text.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
