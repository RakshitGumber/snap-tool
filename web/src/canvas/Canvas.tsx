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

import { CanvasBackgroundLayer } from "@/canvas/CanvasBackgroundLayer";
import {
  getCanvasBackgroundImageLayout,
  isCanvasBackgroundImageMovable,
} from "@/canvas/backgrounds";
import { ensureGoogleFontLoaded } from "@/libs/googleFonts";
import { useCanvasShell, useCanvasStore } from "@/stores/useCanvasStore";
import { useEditorUiStore } from "@/stores/useEditorUiStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import { clearDraggedAssetId, getDraggedAssetId } from "@/uploads/drag";
import type {
  BoardImageItem,
  BoardTextItem,
  CanvasBackgroundImageFit,
} from "@/types/canvas";

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
      kind: "background";
      startPointerX: number;
      startPointerY: number;
      startOffsetX: number;
      startOffsetY: number;
      imageWidth: number;
      imageHeight: number;
      fit: CanvasBackgroundImageFit;
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
  const isBackgroundMoveMode = useEditorUiStore(
    (state) => state.isBackgroundMoveMode,
  );
  const setBackgroundMoveMode = useEditorUiStore(
    (state) => state.setBackgroundMoveMode,
  );
  const moveImageOnCanvas = useCanvasStore((state) => state.moveImageOnCanvas);
  const resizeImageOnCanvas = useCanvasStore(
    (state) => state.resizeImageOnCanvas,
  );
  const updateCanvasBackgroundImage = useCanvasStore(
    (state) => state.updateCanvasBackgroundImage,
  );
  const moveTextOnCanvas = useCanvasStore((state) => state.moveTextOnCanvas);
  const removeSelectedImage = useCanvasStore((state) => state.removeSelectedImage);
  const removeSelectedText = useCanvasStore((state) => state.removeSelectedText);
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
  const backgroundAssetId =
    canvasShell?.background.kind === "image"
      ? (canvasShell.background.assetId ?? null)
      : null;
  const backgroundAssetMeta = backgroundAssetId
    ? (assetMetaById[backgroundAssetId] ?? null)
    : null;
  const backgroundImageSrc =
    canvasShell?.background.kind === "image"
      ? backgroundAssetId
        ? (resolvedMediaByAssetId[backgroundAssetId]?.full?.src ?? null)
        : (canvasShell.background.src ?? null)
      : null;
  const backgroundImageWidth =
    canvasShell?.background.kind === "image"
      ? (backgroundAssetMeta?.width ?? canvasShell.background.width ?? null)
      : null;
  const backgroundImageHeight =
    canvasShell?.background.kind === "image"
      ? (backgroundAssetMeta?.height ?? canvasShell.background.height ?? null)
      : null;

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
    if (backgroundAssetId && !resolvedMediaByAssetId[backgroundAssetId]?.full) {
      void resolveAssetMedia(backgroundAssetId, "full");
    }
  }, [backgroundAssetId, resolveAssetMedia, resolvedMediaByAssetId]);

  useEffect(() => {
    if (
      !canvasShell ||
      !isCanvasBackgroundImageMovable(canvasShell.background) ||
      !isBackgroundMoveMode
    ) {
      if (isBackgroundMoveMode) {
        setBackgroundMoveMode(false);
      }
    }
  }, [canvasShell, isBackgroundMoveMode, setBackgroundMoveMode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      if (selectedTextId) {
        event.preventDefault();
        removeSelectedText();
        return;
      }

      if (selectedImageId) {
        event.preventDefault();
        removeSelectedImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    removeSelectedImage,
    removeSelectedText,
    selectedImageId,
    selectedTextId,
  ]);

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

    if (dragState.kind === "background") {
      if (!canvasShell) {
        return;
      }

      const layout = getCanvasBackgroundImageLayout({
        canvasWidth: canvasShell.width,
        canvasHeight: canvasShell.height,
        imageWidth: dragState.imageWidth,
        imageHeight: dragState.imageHeight,
        fit: dragState.fit,
        offsetX:
          dragState.startOffsetX + (localPoint.x - dragState.startPointerX),
        offsetY:
          dragState.startOffsetY + (localPoint.y - dragState.startPointerY),
      });

      updateCanvasBackgroundImage({
        offsetX: layout.offsetX,
        offsetY: layout.offsetY,
      });
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

  const handleGlobalPointerMove = useEffectEvent((event: PointerEvent) => {
    if (!dragStateRef.current) {
      return;
    }

    pointerSnapshotRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    };

    if (frameRequestRef.current !== null) {
      return;
    }

    frameRequestRef.current = window.requestAnimationFrame(flushPointerMove);
  });

  const handleGlobalPointerUp = useEffectEvent(() => {
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
  });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) =>
      handleGlobalPointerMove(event);
    const handlePointerUp = () => handleGlobalPointerUp();

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

  const handleBackgroundPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0 || !canvasShell) {
      return;
    }

    event.stopPropagation();

    const background = canvasShell.background;
    const canMoveBackground =
      background.kind === "image" &&
      background.fit !== "fill" &&
      backgroundImageWidth &&
      backgroundImageHeight;

    if (!isBackgroundMoveMode || !canMoveBackground) {
      clearSelection();
      return;
    }

    beginHistoryTransaction();
    const localPoint = getCanvasPoint(event.clientX, event.clientY);
    dragStateRef.current = {
      kind: "background",
      startPointerX: localPoint.x,
      startPointerY: localPoint.y,
      startOffsetX: background.offsetX,
      startOffsetY: background.offsetY,
      imageWidth: backgroundImageWidth,
      imageHeight: backgroundImageHeight,
      fit: background.fit,
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
            "absolute left-1/2 top-1/2 overflow-visible bg-white shadow-lg transition",
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
          <CanvasBackgroundLayer
            width={canvasShell.width}
            height={canvasShell.height}
            background={canvasShell.background}
            effects={canvasShell.backgroundEffects}
            imageSrc={backgroundImageSrc}
            imageWidth={backgroundImageWidth}
            imageHeight={backgroundImageHeight}
            className="pointer-events-none"
          />

          <div
            onPointerDown={handleBackgroundPointerDown}
            className={clsx(
              "absolute inset-0",
              isBackgroundMoveMode &&
                isCanvasBackgroundImageMovable(canvasShell.background)
                ? "cursor-grab"
                : "cursor-default",
            )}
            style={{ zIndex: 0, touchAction: "none" }}
          />

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
