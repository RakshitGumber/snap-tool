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
  getBackgroundContrastColor,
  getBackgroundPresetById,
  getBackgroundPresetStyle,
} from "@/config/backgroundPresets";
import { getCompositionLayout } from "@/libs/canvasComposition";
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
  const textEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [isEditingText, setIsEditingText] = useState(false);
  const [textDraft, setTextDraft] = useState("");
  const { registerExporter } = useCanvasExport();

  const canvasSize = useCanvasStore((state) => state.canvasSize);
  const activeCanvasPresetId = useCanvasStore(
    (state) => state.activeCanvasPresetId,
  );
  const activeComposition = useCanvasStore(
    (state) => state.activeComposition,
  );
  const activeBackgroundId = useCanvasStore(
    (state) => state.activeBackgroundId,
  );
  const resizeActiveImage = useCanvasStore((state) => state.resizeActiveImage);
  const beginResizeActiveImage = useCanvasStore(
    (state) => state.beginResizeActiveImage,
  );
  const endResizeActiveImage = useCanvasStore(
    (state) => state.endResizeActiveImage,
  );
  const deleteActiveComposition = useCanvasStore(
    (state) => state.deleteActiveComposition,
  );
  const updateTextValue = useCanvasStore((state) => state.updateTextValue);

  const activeBackground = getBackgroundPresetById(activeBackgroundId);
  const textColor = getBackgroundContrastColor(activeBackground);
  const resolvedTextColor =
    activeComposition?.text.colorMode === "black"
      ? "#111111"
      : activeComposition?.text.colorMode === "white"
        ? "#FFFFFF"
        : textColor;
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
      if (!activeComposition) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      beginResizeActiveImage();
      resizeStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        widthRatio: activeComposition.image.widthRatio,
      };
    },
    [activeComposition, beginResizeActiveImage],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const resizeState = resizeStateRef.current;
      // Ensure we are actually dragging this specific button
      if (
        !resizeState ||
        !event.currentTarget.hasPointerCapture(event.pointerId) ||
        !activeComposition ||
        previewSize.scale <= 0
      )
        return;

      const deltaX = (event.clientX - resizeState.startX) / previewSize.scale;
      const deltaY = (event.clientY - resizeState.startY) / previewSize.scale;
      const directionalDelta = Math.max(
        deltaX,
        deltaY * activeComposition.image.aspectRatio,
      );
      const nextWidthRatio =
        resizeState.widthRatio + (directionalDelta * 2) / canvasSize.width;

      resizeActiveImage(nextWidthRatio);
    },
    [activeComposition, previewSize.scale, canvasSize.width, resizeActiveImage],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState || resizeState.pointerId !== event.pointerId) return;

      event.currentTarget.releasePointerCapture(event.pointerId);
      resizeStateRef.current = null;
      endResizeActiveImage();
    },
    [endResizeActiveImage],
  );

  const beginTextEditing = useCallback(() => {
    if (!activeComposition) return;

    setTextDraft(activeComposition.text.value);
    setIsEditingText(true);
  }, [activeComposition]);

  const commitTextEditing = useCallback(() => {
    if (!isEditingText) return;

    updateTextValue(textDraft.trim() || activeComposition?.metadata.title || "");
    setIsEditingText(false);
  }, [activeComposition?.metadata.title, isEditingText, textDraft, updateTextValue]);

  const cancelTextEditing = useCallback(() => {
    setIsEditingText(false);
    setTextDraft("");
  }, []);

  useEffect(() => {
    if (!isEditingText) return;

    textEditorRef.current?.focus();
    textEditorRef.current?.select();
  }, [isEditingText]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches('input, textarea, select, [contenteditable="true"]')) {
        return;
      }

      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      if (!activeComposition) return;

      event.preventDefault();
      deleteActiveComposition();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeComposition, deleteActiveComposition]);

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

  const activeLayout = activeComposition
    ? getCompositionLayout(activeComposition, canvasSize)
    : null;
  const imageOverlayStyle: CSSProperties | undefined =
    activeLayout && activeComposition?.image.visible
    ? {
        left: activeLayout.imageBox.x * previewSize.scale,
        top: activeLayout.imageBox.y * previewSize.scale,
        width: activeLayout.imageBox.width * previewSize.scale,
        height: activeLayout.imageBox.height * previewSize.scale,
      }
    : undefined;
  const textOverlayStyle: CSSProperties | undefined =
    activeComposition && activeLayout && activeComposition.text.visible
      ? {
          color: resolvedTextColor,
           fontFamily: `${activeComposition.text.fontFamily}, Arial, sans-serif`,
           fontSize: activeComposition.text.fontSize * previewSize.scale,
           height: activeLayout.titleBox.height * previewSize.scale,
           left: activeLayout.titleBox.x * previewSize.scale,
           lineHeight: 1.1,
           top: activeLayout.titleBox.y * previewSize.scale,
           width: activeLayout.titleBox.width * previewSize.scale,
         }
       : undefined;

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
            activeComposition={activeComposition}
            canvasSize={canvasSize}
          />
        </Application>

        {!activeComposition ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-secondary-text">
            Add a link from Images
          </div>
        ) : (
          <>
            {imageOverlayStyle ? (
              <div className="absolute" style={imageOverlayStyle}>
                <button
                  type="button"
                  aria-label="Resize video image"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="absolute bottom-0 right-0 h-5 w-5 translate-x-1/2 translate-y-1/2 rounded-full border bg-accent"
                />
              </div>
            ) : null}

            {textOverlayStyle ? (
              <div className="absolute" style={textOverlayStyle}>
                {isEditingText ? (
                  <textarea
                    ref={textEditorRef}
                    aria-label="Edit video title"
                    value={textDraft}
                    onBlur={commitTextEditing}
                    onChange={(event) =>
                      setTextDraft(event.currentTarget.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        cancelTextEditing();
                      }

                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        commitTextEditing();
                      }
                    }}
                    className="h-full w-full resize-none rounded-md border border-accent bg-panel-bg/90 px-3 py-2 text-left font-black leading-[1.1] outline-none"
                    style={{
                      color: resolvedTextColor,
                      fontFamily: `${activeComposition.text.fontFamily}, Arial, sans-serif`,
                      fontSize:
                        activeComposition.text.fontSize * previewSize.scale,
                    }}
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      aria-label="Edit video title"
                      onClick={beginTextEditing}
                      className="absolute inset-0 cursor-text bg-transparent"
                    />
                    <button
                      type="button"
                      aria-label="Edit video title"
                      onClick={beginTextEditing}
                      className="absolute right-0 top-1/2 h-5 w-5 translate-x-1/2 -translate-y-1/2 rounded-full border bg-accent text-[0px]"
                    />
                  </>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
