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
  createObjectRef,
  getObjectBounds,
  getObjectRefKey,
  isSameObjectRef,
  measureTextItemBounds,
  type CanvasObjectBounds,
  type OrderedCanvasObject,
} from "@/canvas/objects";
import {
  createObjectDragSession,
  EMPTY_GUIDES,
  resolveObjectDragUpdate,
  type GuideState,
  type ObjectDragSession,
} from "@/canvas/objectDrag";
import {
  getCanvasBackgroundImageLayout,
  isCanvasBackgroundImageMovable,
} from "@/canvas/backgrounds";
import { ensureGoogleFontLoaded } from "@/libs/googleFonts";
import {
  useCanvasShell,
  useCanvasStore,
  useOrderedCanvasObjects,
} from "@/stores/useCanvasStore";
import {
  useEditorUiStore,
  useSelectedObjectIds,
  useTextDraft,
} from "@/stores/useEditorUiStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import { clearDraggedAssetId, getDraggedAssetId } from "@/uploads/drag";
import type {
  BoardImageItem,
  BoardObjectRef,
  BoardTextItem,
  CanvasBackgroundImageFit,
} from "@/types/canvas";

type PointerSnapshot = {
  pointerId: number;
  clientX: number;
  clientY: number;
  shiftKey: boolean;
};

type CanvasDragState =
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
    };

type PointerCaptureTarget = HTMLButtonElement | HTMLDivElement;

const isSelectionModifier = (event: {
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}) => event.shiftKey || event.ctrlKey || event.metaKey;

const getObjectGuideBounds = (
  object: OrderedCanvasObject,
  measuredBounds?: Partial<Pick<CanvasObjectBounds, "width" | "height">>,
) =>
  object.kind === "text"
    ? getObjectBounds(object, measuredBounds ?? measureTextItemBounds(object.item))
    : getObjectBounds(object, measuredBounds);

export const Canvas = memo(function BoardCanvas() {
  const viewportInnerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const inlineEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const objectDragSessionRef = useRef<ObjectDragSession | null>(null);
  const dragStateRef = useRef<CanvasDragState | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const capturedPointerTargetRef = useRef<PointerCaptureTarget | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const pointerSnapshotRef = useRef<PointerSnapshot | null>(null);
  const objectElementRefs = useRef<Record<string, HTMLDivElement | HTMLButtonElement | null>>({});
  const textEditSnapshotRef = useRef<{ id: string; text: string } | null>(null);
  const [dropTargetActive, setDropTargetActive] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [guideState, setGuideState] = useState<GuideState>(EMPTY_GUIDES);

  const canvasShell = useCanvasShell();
  const orderedObjects = useOrderedCanvasObjects();
  const selectedObjects = useSelectedObjectIds();
  const textDraft = useTextDraft();
  const editingTextId = useEditorUiStore((state) => state.editingTextId);
  const isBackgroundMoveMode = useEditorUiStore(
    (state) => state.isBackgroundMoveMode,
  );
  const setBackgroundMoveMode = useEditorUiStore(
    (state) => state.setBackgroundMoveMode,
  );
  const selectImage = useEditorUiStore((state) => state.selectImage);
  const selectText = useEditorUiStore((state) => state.selectText);
  const clearSelection = useEditorUiStore((state) => state.clearSelection);
  const setEditingTextId = useEditorUiStore((state) => state.setEditingTextId);
  const updateTextDraft = useEditorUiStore((state) => state.updateTextDraft);
  const moveObjectsOnCanvas = useCanvasStore((state) => state.moveObjectsOnCanvas);
  const resizeImageOnCanvas = useCanvasStore(
    (state) => state.resizeImageOnCanvas,
  );
  const updateCanvasBackgroundImage = useCanvasStore(
    (state) => state.updateCanvasBackgroundImage,
  );
  const updateTextOnCanvas = useCanvasStore((state) => state.updateTextOnCanvas);
  const removeSelectedObjects = useCanvasStore(
    (state) => state.removeSelectedObjects,
  );
  const beginHistoryTransaction = useCanvasStore(
    (state) => state.beginHistoryTransaction,
  );
  const endHistoryTransaction = useCanvasStore(
    (state) => state.endHistoryTransaction,
  );
  const insertImageOnCanvasAtPoint = useCanvasStore(
    (state) => state.insertImageOnCanvasAtPoint,
  );
  const resolvedMediaByAssetId = useUploadLibraryStore(
    (state) => state.resolvedMediaByAssetId,
  );
  const assetMetaById = useUploadLibraryStore((state) => state.assetMetaById);
  const resolveAssetMedia = useUploadLibraryStore(
    (state) => state.resolveAssetMedia,
  );

  const selectedKeySet = useMemo(
    () => new Set(selectedObjects.map((ref) => getObjectRefKey(ref))),
    [selectedObjects],
  );
  const objectByKey = useMemo(
    () =>
      Object.fromEntries(
        orderedObjects.map((object) => [getObjectRefKey(object.ref), object]),
      ) as Record<string, OrderedCanvasObject>,
    [orderedObjects],
  );
  const singleSelectedImageId =
    selectedObjects.length === 1 && selectedObjects[0].kind === "image"
      ? selectedObjects[0].id
      : null;
  const editingText =
    editingTextId && objectByKey[getObjectRefKey(createObjectRef("text", editingTextId))]
      ? objectByKey[getObjectRefKey(createObjectRef("text", editingTextId))]
      : null;
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

  useEffect(() => {
    orderedObjects.forEach((object) => {
      if (
        object.kind === "image" &&
        !resolvedMediaByAssetId[object.item.assetId]?.full
      ) {
        void resolveAssetMedia(object.item.assetId, "full");
      }
    });
  }, [orderedObjects, resolveAssetMedia, resolvedMediaByAssetId]);

  useEffect(() => {
    if (backgroundAssetId && !resolvedMediaByAssetId[backgroundAssetId]?.full) {
      void resolveAssetMedia(backgroundAssetId, "full");
    }
  }, [backgroundAssetId, resolveAssetMedia, resolvedMediaByAssetId]);

  useEffect(() => {
    orderedObjects.forEach((object) => {
      if (object.kind === "text") {
        ensureGoogleFontLoaded(object.item.fontFamily);
      }
    });
  }, [orderedObjects]);

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

      if (selectedObjects.length) {
        event.preventDefault();
        removeSelectedObjects();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [removeSelectedObjects, selectedObjects.length]);

  const updateCanvasScale = useEffectEvent(() => {
    if (!canvasShell) {
      return;
    }

    const container = viewportInnerRef.current;
    if (!container) {
      return;
    }

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

  useLayoutEffect(() => {
    if (!editingText || editingText.kind !== "text" || !inlineEditorRef.current) {
      return;
    }

    const editor = inlineEditorRef.current;
    editor.focus();
    editor.selectionStart = editor.value.length;
    editor.selectionEnd = editor.value.length;
    editor.style.height = "0px";
    editor.style.height = `${editor.scrollHeight}px`;
  }, [editingText, textDraft.text]);

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

  const getRenderedBounds = useEffectEvent((object: OrderedCanvasObject) => {
    const key = getObjectRefKey(object.ref);
    const element = objectElementRefs.current[key];

    if (element) {
      const rect = element.getBoundingClientRect();
      return getObjectGuideBounds(object, {
        width: rect.width / canvasScale,
        height: rect.height / canvasScale,
      });
    }

    return getObjectGuideBounds(object);
  });

  const beginPointerInteraction = useEffectEvent(
    (target: PointerCaptureTarget, pointerId: number) => {
      activePointerIdRef.current = pointerId;
      capturedPointerTargetRef.current = target;

      if (typeof target.setPointerCapture !== "function") {
        return;
      }

      try {
        target.setPointerCapture(pointerId);
      } catch {
        // Ignore browsers that reject capture during edge cases.
      }
    },
  );

  const finishActiveDrag = useEffectEvent(
    ({ releasePointerCapture = true }: { releasePointerCapture?: boolean } = {}) => {
      const pointerId = activePointerIdRef.current;
      const pointerTarget = capturedPointerTargetRef.current;
      const hadDragState =
        objectDragSessionRef.current !== null || dragStateRef.current !== null;

      objectDragSessionRef.current = null;
      dragStateRef.current = null;
      activePointerIdRef.current = null;
      capturedPointerTargetRef.current = null;
      pointerSnapshotRef.current = null;
      setGuideState(EMPTY_GUIDES);

      if (frameRequestRef.current !== null) {
        window.cancelAnimationFrame(frameRequestRef.current);
        frameRequestRef.current = null;
      }

      if (
        releasePointerCapture &&
        pointerTarget &&
        pointerId !== null &&
        typeof pointerTarget.hasPointerCapture === "function" &&
        pointerTarget.hasPointerCapture(pointerId)
      ) {
        try {
          pointerTarget.releasePointerCapture(pointerId);
        } catch {
          // Ignore stale capture state during teardown.
        }
      }

      if (hadDragState) {
        endHistoryTransaction();
      }
    },
  );

  const flushPointerMove = useEffectEvent(() => {
    frameRequestRef.current = null;

    const pointer = pointerSnapshotRef.current;
    const objectDragSession = objectDragSessionRef.current;
    const dragState = dragStateRef.current;

    if (!pointer) {
      return;
    }

    const localPoint = getCanvasPoint(pointer.clientX, pointer.clientY);

    if (objectDragSession) {
      if (!canvasShell) {
        return;
      }

      const otherBounds = orderedObjects
        .filter(
          (object) =>
            !objectDragSession.selection.some((selected) =>
              isSameObjectRef(selected, object.ref),
            ),
        )
        .map((object) => getRenderedBounds(object));
      const result = resolveObjectDragUpdate({
        session: objectDragSession,
        pointer: {
          x: localPoint.x,
          y: localPoint.y,
          shiftKey: pointer.shiftKey,
        },
        otherBounds,
        canvasWidth: canvasShell.width,
        canvasHeight: canvasShell.height,
      });

      moveObjectsOnCanvas(result.moves, {
        releaseFromAxis: true,
      });
      setGuideState(result.guides);
      return;
    }

    if (!dragState) {
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
  });

  const handleGlobalPointerMove = useEffectEvent((event: PointerEvent) => {
    if (
      activePointerIdRef.current === null ||
      event.pointerId !== activePointerIdRef.current ||
      (objectDragSessionRef.current === null && dragStateRef.current === null)
    ) {
      return;
    }

    pointerSnapshotRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      shiftKey: event.shiftKey,
    };

    if (frameRequestRef.current !== null) {
      return;
    }

    frameRequestRef.current = window.requestAnimationFrame(flushPointerMove);
  });

  const handleGlobalPointerFinish = useEffectEvent((event?: PointerEvent) => {
    if (
      event &&
      activePointerIdRef.current !== null &&
      event.pointerId !== activePointerIdRef.current
    ) {
      return;
    }

    finishActiveDrag();
  });

  const handlePointerCaptureLost = useEffectEvent(
    (event: ReactPointerEvent<HTMLButtonElement | HTMLDivElement>) => {
      if (
        activePointerIdRef.current === null ||
        event.pointerId !== activePointerIdRef.current
      ) {
        return;
      }

      finishActiveDrag({ releasePointerCapture: false });
    },
  );

  const handleWindowBlur = useEffectEvent(() => {
    finishActiveDrag();
  });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) =>
      handleGlobalPointerMove(event);
    const handlePointerUp = (event: PointerEvent) => handleGlobalPointerFinish(event);
    const handlePointerCancel = (event: PointerEvent) =>
      handleGlobalPointerFinish(event);
    const handleBlur = () => handleWindowBlur();

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("blur", handleBlur);

      if (frameRequestRef.current !== null) {
        window.cancelAnimationFrame(frameRequestRef.current);
      }
    };
  }, []);

  const beginSelectionDrag = useEffectEvent(
    (
      object: OrderedCanvasObject,
      event: ReactPointerEvent<HTMLButtonElement | HTMLDivElement>,
      selection: BoardObjectRef[],
    ) => {
      event.preventDefault();
      beginHistoryTransaction();
      beginPointerInteraction(event.currentTarget, event.pointerId);
      const localPoint = getCanvasPoint(event.clientX, event.clientY);
      const startPositions = Object.fromEntries(
        selection.map((ref) => {
          const current = objectByKey[getObjectRefKey(ref)];
          return [
            getObjectRefKey(ref),
            current ? { x: current.item.x, y: current.item.y } : { x: 0, y: 0 },
          ];
        }),
      );

      objectDragSessionRef.current = createObjectDragSession({
        pointerId: event.pointerId,
        primaryRef: object.ref,
        selection,
        startPointer: {
          x: localPoint.x,
          y: localPoint.y,
        },
        startPositions,
        primaryBounds: getRenderedBounds(object),
      });
    },
  );

  const handleObjectPointerDown =
    (object: OrderedCanvasObject) =>
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) {
        return;
      }

      event.stopPropagation();

      const additive = isSelectionModifier(event);
      const isSelected = selectedKeySet.has(getObjectRefKey(object.ref));

      if (additive) {
        if (object.kind === "image") {
          selectImage(object.item.id, { additive: true, toggle: true });
        } else {
          selectText(object.item, { additive: true, toggle: true });
        }
        return;
      }

      const activeSelection = isSelected
        ? selectedObjects
        : [object.ref];

      if (!isSelected) {
        if (object.kind === "image") {
          selectImage(object.item.id);
        } else {
          selectText(object.item);
        }
      }

      if (object.item.isMovementLocked) {
        return;
      }

      const draggableSelection = activeSelection.filter((ref) => {
        const candidate = objectByKey[getObjectRefKey(ref)];
        return candidate ? !candidate.item.isMovementLocked : false;
      });

      if (!draggableSelection.length) {
        return;
      }

      beginSelectionDrag(object, event, draggableSelection);
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
      beginPointerInteraction(event.currentTarget, event.pointerId);
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
    beginPointerInteraction(event.currentTarget, event.pointerId);
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

  const handleStartTextEditing = (text: BoardTextItem) => {
    selectText(text);
    setEditingTextId(text.id);
    textEditSnapshotRef.current = {
      id: text.id,
      text: text.text,
    };
  };

  const handleInlineEditorKeyDown = (
    event: ReactPointerEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if ("key" in event && event.key === "Escape" && editingText?.kind === "text") {
      const snapshot = textEditSnapshotRef.current;
      if (snapshot && snapshot.id === editingText.item.id) {
        updateTextDraft({ text: snapshot.text });
        updateTextOnCanvas(editingText.item.id, { text: snapshot.text });
      }
      setEditingTextId(null);
    }
  };

  if (!canvasShell) {
    return null;
  }

  return (
    <div
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
            "absolute left-1/2 top-1/2 bg-white shadow-lg transition",
            dropTargetActive && "outline-2 outline-accent -outline-offset-4",
          )}
          style={{
            width: canvasShell.width,
            height: canvasShell.height,
            transform: `translate(-50%, -50%) scale(${canvasScale})`,
            transformOrigin: "center center",
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
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
              onLostPointerCapture={handlePointerCaptureLost}
              className={clsx(
                "absolute inset-0",
                isBackgroundMoveMode &&
                  isCanvasBackgroundImageMovable(canvasShell.background)
                  ? "cursor-grab"
                  : "cursor-default",
              )}
              style={{ zIndex: 0, touchAction: "none" }}
            />

            {guideState.vertical.map((position) => (
              <div
                key={`v-${position}`}
                className="pointer-events-none absolute bottom-0 top-0 w-px bg-accent/70"
                style={{ left: position, zIndex: 200 }}
              />
            ))}
            {guideState.horizontal.map((position) => (
              <div
                key={`h-${position}`}
                className="pointer-events-none absolute left-0 right-0 h-px bg-accent/70"
                style={{ top: position, zIndex: 200 }}
              />
            ))}

            {orderedObjects.map((object, index) => {
              const key = getObjectRefKey(object.ref);
              const isSelected = selectedKeySet.has(key);
              const zIndex = index + 10;

              if (object.kind === "image") {
                const media = resolvedMediaByAssetId[object.item.assetId]?.full;
                if (!media) {
                  return null;
                }

                return (
                  <div
                    key={key}
                    ref={(node) => {
                      objectElementRefs.current[key] = node;
                    }}
                    className="absolute left-0 top-0"
                    style={{
                      width: object.item.width,
                      height: object.item.height,
                      zIndex,
                      transform: `translate3d(${object.item.x}px, ${object.item.y}px, 0)`,
                    }}
                  >
                    <button
                      type="button"
                      onPointerDown={handleObjectPointerDown(object)}
                      onLostPointerCapture={handlePointerCaptureLost}
                      className={clsx(
                        "h-full w-full overflow-hidden rounded-lg shadow-md outline-2 outline-transparent",
                        object.item.isMovementLocked ? "cursor-default" : "cursor-grab",
                        isSelected && "outline-accent",
                      )}
                      style={{ touchAction: "none" }}
                    >
                      <img
                        src={media.src}
                        alt={object.item.alt}
                        draggable={false}
                        className="pointer-events-none h-full w-full select-none object-contain"
                      />
                    </button>

                    {singleSelectedImageId === object.item.id ? (
                      <button
                        type="button"
                        aria-label="Resize image"
                        onPointerDown={handleImageResizePointerDown(object.item)}
                        onLostPointerCapture={handlePointerCaptureLost}
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
              }

              const isEditing = editingTextId === object.item.id;

              return (
                <div
                  key={key}
                  ref={(node) => {
                    objectElementRefs.current[key] = node;
                  }}
                  className="absolute left-0 top-0"
                  style={{
                    zIndex,
                    transform: `translate3d(${object.item.x}px, ${object.item.y}px, 0)`,
                  }}
                >
                  {isEditing ? (
                    <textarea
                      ref={inlineEditorRef}
                      value={textDraft.text}
                      onChange={(event) => {
                        const nextText = event.target.value;
                        updateTextDraft({ text: nextText });
                        updateTextOnCanvas(object.item.id, { text: nextText });
                      }}
                      onBlur={() => {
                        setEditingTextId(null);
                      }}
                      onKeyDown={handleInlineEditorKeyDown}
                      rows={1}
                      className="min-h-[1lh] resize-none overflow-hidden rounded-xl bg-white/80 px-2 py-1 outline-2 outline-accent"
                      style={{
                        width: object.item.maxWidth,
                        color: object.item.color,
                        fontFamily: `${object.item.fontFamily}, sans-serif`,
                        fontSize: object.item.fontSize,
                        fontWeight: object.item.fontWeight,
                        textAlign: object.item.align,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onPointerDown={handleObjectPointerDown(object)}
                      onLostPointerCapture={handlePointerCaptureLost}
                      onDoubleClick={() => handleStartTextEditing(object.item)}
                      className={clsx(
                        "rounded-xl bg-transparent px-2 py-1 text-left outline-2 outline-transparent",
                        object.item.isMovementLocked ? "cursor-default" : "cursor-grab",
                        isSelected && "outline-accent",
                      )}
                      style={{
                        maxWidth: object.item.maxWidth,
                        color: object.item.color,
                        fontFamily: `${object.item.fontFamily}, sans-serif`,
                        fontSize: object.item.fontSize,
                        fontWeight: object.item.fontWeight,
                        textAlign: object.item.align,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        touchAction: "none",
                      }}
                    >
                      {object.item.text}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
