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
  clientX: number;
  clientY: number;
  shiftKey: boolean;
};

type GuideState = {
  vertical: number[];
  horizontal: number[];
};

type SelectionDragState = {
  kind: "selection";
  primaryRef: BoardObjectRef;
  selection: BoardObjectRef[];
  startPointerX: number;
  startPointerY: number;
  startPositions: Record<string, { x: number; y: number }>;
  primaryBounds: CanvasObjectBounds;
};

type CanvasDragState =
  | SelectionDragState
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

const SNAP_THRESHOLD = 8;

const isSelectionModifier = (event: {
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}) => event.shiftKey || event.ctrlKey || event.metaKey;

const getAxisLock = (deltaX: number, deltaY: number, isShiftPressed: boolean) => {
  if (!isShiftPressed) {
    return null;
  }

  return Math.abs(deltaX) >= Math.abs(deltaY) ? "horizontal" : "vertical";
};

const getObjectGuideBounds = (
  object: OrderedCanvasObject,
  measuredBounds?: Partial<Pick<CanvasObjectBounds, "width" | "height">>,
) =>
  object.kind === "text"
    ? getObjectBounds(object, measuredBounds ?? measureTextItemBounds(object.item))
    : getObjectBounds(object, measuredBounds);

const buildAlignmentResult = ({
  movedBounds,
  otherBounds,
  canvasWidth,
  canvasHeight,
}: {
  movedBounds: CanvasObjectBounds;
  otherBounds: CanvasObjectBounds[];
  canvasWidth: number;
  canvasHeight: number;
}) => {
  const sourceX = [
    movedBounds.x,
    movedBounds.x + movedBounds.width / 2,
    movedBounds.x + movedBounds.width,
  ];
  const sourceY = [
    movedBounds.y,
    movedBounds.y + movedBounds.height / 2,
    movedBounds.y + movedBounds.height,
  ];
  const candidateX = [
    canvasWidth / 2,
    ...otherBounds.flatMap((bounds) => [
      bounds.x,
      bounds.x + bounds.width / 2,
      bounds.x + bounds.width,
    ]),
  ];
  const candidateY = [
    canvasHeight / 2,
    ...otherBounds.flatMap((bounds) => [
      bounds.y,
      bounds.y + bounds.height / 2,
      bounds.y + bounds.height,
    ]),
  ];

  let bestX: { delta: number; guide: number } | undefined;
  let bestY: { delta: number; guide: number } | undefined;

  sourceX.forEach((source) => {
    candidateX.forEach((candidate) => {
      const delta = candidate - source;
      if (Math.abs(delta) > SNAP_THRESHOLD) {
        return;
      }

      if (!bestX || Math.abs(delta) < Math.abs(bestX.delta)) {
        bestX = { delta, guide: candidate };
      }
    });
  });

  sourceY.forEach((source) => {
    candidateY.forEach((candidate) => {
      const delta = candidate - source;
      if (Math.abs(delta) > SNAP_THRESHOLD) {
        return;
      }

      if (!bestY || Math.abs(delta) < Math.abs(bestY.delta)) {
        bestY = { delta, guide: candidate };
      }
    });
  });

  return {
    deltaX: bestX?.delta ?? 0,
    deltaY: bestY?.delta ?? 0,
    guides: {
      vertical: bestX ? [bestX.guide] : [],
      horizontal: bestY ? [bestY.guide] : [],
    } satisfies GuideState,
  };
};

export const Canvas = memo(function BoardCanvas() {
  const viewportInnerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const inlineEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const dragStateRef = useRef<CanvasDragState | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const pointerSnapshotRef = useRef<PointerSnapshot | null>(null);
  const objectElementRefs = useRef<Record<string, HTMLDivElement | HTMLButtonElement | null>>({});
  const textEditSnapshotRef = useRef<{ id: string; text: string } | null>(null);
  const [dropTargetActive, setDropTargetActive] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [guideState, setGuideState] = useState<GuideState>({
    vertical: [],
    horizontal: [],
  });

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

  const flushPointerMove = useEffectEvent(() => {
    frameRequestRef.current = null;

    const pointer = pointerSnapshotRef.current;
    const dragState = dragStateRef.current;

    if (!pointer || !dragState) {
      return;
    }

    const localPoint = getCanvasPoint(pointer.clientX, pointer.clientY);

    if (dragState.kind === "selection") {
      if (!canvasShell) {
        return;
      }

      let deltaX = localPoint.x - dragState.startPointerX;
      let deltaY = localPoint.y - dragState.startPointerY;
      const axisLock = getAxisLock(deltaX, deltaY, pointer.shiftKey);

      if (axisLock === "horizontal") {
        deltaY = 0;
      } else if (axisLock === "vertical") {
        deltaX = 0;
      }

      const otherBounds = orderedObjects
        .filter(
          (object) =>
            !dragState.selection.some((selected) =>
              isSameObjectRef(selected, object.ref),
            ),
        )
        .map((object) => getRenderedBounds(object));
      const movedPrimaryBounds = {
        ...dragState.primaryBounds,
        x: dragState.primaryBounds.x + deltaX,
        y: dragState.primaryBounds.y + deltaY,
      };
      const alignment = buildAlignmentResult({
        movedBounds: movedPrimaryBounds,
        otherBounds,
        canvasWidth: canvasShell.width,
        canvasHeight: canvasShell.height,
      });

      const nextDeltaX = deltaX + alignment.deltaX;
      const nextDeltaY = deltaY + alignment.deltaY;

      moveObjectsOnCanvas(
        dragState.selection.map((ref) => {
          const startPosition =
            dragState.startPositions[getObjectRefKey(ref)] ?? { x: 0, y: 0 };

          return {
            ref,
            x: startPosition.x + nextDeltaX,
            y: startPosition.y + nextDeltaY,
          };
        }),
        {
          releaseFromAxis: true,
        },
      );
      setGuideState(alignment.guides);
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
    if (!dragStateRef.current) {
      return;
    }

    pointerSnapshotRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      shiftKey: event.shiftKey,
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
    setGuideState({
      vertical: [],
      horizontal: [],
    });

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

  const beginSelectionDrag = useEffectEvent(
    (
      object: OrderedCanvasObject,
      event: ReactPointerEvent<HTMLButtonElement | HTMLDivElement>,
      selection: BoardObjectRef[],
    ) => {
      beginHistoryTransaction();
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

      dragStateRef.current = {
        kind: "selection",
        primaryRef: object.ref,
        selection,
        startPointerX: localPoint.x,
        startPointerY: localPoint.y,
        startPositions,
        primaryBounds: getRenderedBounds(object),
      };
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

      beginSelectionDrag(object, event, activeSelection);
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
                      className={clsx(
                        "h-full w-full overflow-hidden rounded-lg shadow-md outline-2 outline-transparent",
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
                      onDoubleClick={() => handleStartTextEditing(object.item)}
                      className={clsx(
                        "rounded-xl bg-transparent px-2 py-1 text-left outline-2 outline-transparent",
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
